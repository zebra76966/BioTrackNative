import AppleHealthKit from "react-native-health";
import api from "../auth/api";

const permissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.HeartRate, // Added for future performance metrics
    ],
    write: [],
  },
};

export function initAppleHealth() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) return reject(err);
      resolve();
      console.log("Apple HealthKit initialized successfully with permissions:", permissions);
    });
  });
}

/** * 🏃 Fetches detailed workout sessions with duration and calorie burn.
 */
export function getWorkouts(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  return new Promise((resolve, reject) => {
    AppleHealthKit.getSamples(
      {
        type: "Workout",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      (err, results) => {
        if (err) return reject(err);

        const sessions = results.map((s) => ({
          activity_type: s.activityName || "Generic Training",
          start_time: s.start,
          end_time: s.end,
          duration_minutes: Math.round((new Date(s.end) - new Date(s.start)) / 60000),
          calories: Math.round(s.calories) || 0,
          source: s.sourceName || "Manual",
        }));

        resolve(sessions);
      },
    );
  });
}

/** * 📊 Aggregates daily biometric data (Steps, Calories, Distance).
 */

export async function getHealthData(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  // Separate options because different methods expect different keys
  const dailyOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };

  const sampleOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    unit: "kilocalorie", // Explicit unit for energy
    distanceUnit: "meter", // Explicit unit for distance
  };

  try {
    const [stepsRes, activeEnergyRes, distanceRes] = await Promise.all([
      new Promise((res) => AppleHealthKit.getDailyStepCountSamples(dailyOptions, (err, r) => res(r || []))),

      // Use the 'Samples' version if available, otherwise getActiveEnergyBurned
      new Promise((res) => AppleHealthKit.getActiveEnergyBurned(sampleOptions, (err, r) => res(r || []))),

      // CRITICAL: Try the 'Daily...Samples' version first as it's more reliable for totals
      new Promise((res) =>
        AppleHealthKit.getDailyDistanceWalkingRunningSamples(sampleOptions, (err, r) => {
          if (err || !r || r.length === 0) {
            // Fallback to raw samples if daily totals fail
            AppleHealthKit.getDistanceWalkingRunning(sampleOptions, (err2, r2) => res(r2 || []));
          } else {
            res(r);
          }
        }),
      ),
    ]);

    // DEBUG LOGS - Check your console to see which one is actually returning data
    console.log(`[HealthKit] Steps: ${stepsRes.length}, Energy: ${activeEnergyRes.length}, Distance: ${distanceRes.length}`);

    const grouped = {};

    const addToGroup = (samples, key) => {
      if (!Array.isArray(samples)) return;
      samples.forEach((s) => {
        // Some samples use 'startDate', some use 'endDate', some just 'date'
        const rawDate = s.startDate || s.endDate || s.date;
        if (!rawDate) return;

        const date = rawDate.split("T")[0];
        if (!grouped[date]) grouped[date] = { steps: 0, calories: 0, distance: 0 };

        // s.value is standard, but check for s.quantity just in case
        const val = s.value ?? s.quantity ?? 0;
        grouped[date][key] += val;
      });
    };

    addToGroup(stepsRes, "steps");
    addToGroup(activeEnergyRes, "calories");
    addToGroup(distanceRes, "distance");

    const daily = Object.entries(grouped).map(([date, val]) => ({
      date,
      steps: Math.round(val.steps),
      calories: Math.round(val.calories),
      distance: parseFloat(val.distance.toFixed(2)), // Should now show meters
      source: "apple_health",
    }));

    const sessions = await getWorkouts(days);
    return { daily, sessions };
  } catch (error) {
    console.error("Critical Biometric Retrieval Error:", error);
    throw error;
  }
}

/** * 🔄 Synchronizes local Apple Health data with the BioTrack Cloud.
 */
export async function syncAppleHealth(days = 7) {
  try {
    const { daily, sessions } = await getHealthData(days);

    // POST to your backend route
    await api.post("/sync/apple-health", {
      daily,
      sessions,
      lastSync: new Date().toISOString(),
    });

    return { daily, sessions };
  } catch (e) {
    console.error("Protocol Sync Failure:", e);
    throw e;
  }
}

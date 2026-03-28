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
/** * 📊 Aggregates daily biometric data (Steps, Calories, Distance).
 */
export async function getHealthData(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const options = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };

  try {
    // FIX: Changed getDailyActiveEnergyBurnedSamples to getActiveEnergyBurned
    // FIX: Changed getDailyDistanceWalkingRunningSamples to getDistanceWalkingRunning
    const [stepsRes, activeEnergyRes, distanceRes] = await Promise.all([
      new Promise((res) => AppleHealthKit.getDailyStepCountSamples(options, (err, r) => res(r || []))),
      new Promise((res) => AppleHealthKit.getActiveEnergyBurned(options, (err, r) => res(r || []))),
      new Promise((res) => AppleHealthKit.getDistanceWalkingRunning(options, (err, r) => res(r || []))),
    ]);

    const grouped = {};

    // Helper to group by ISO Date (YYYY-MM-DD)
    const addToGroup = (samples, key) => {
      if (!Array.isArray(samples)) return; // Safety check
      samples.forEach((s) => {
        const date = s.startDate.split("T")[0];
        if (!grouped[date]) grouped[date] = { steps: 0, calories: 0, distance: 0 };
        grouped[date][key] += s.value || 0;
      });
    };

    addToGroup(stepsRes, "steps");
    addToGroup(activeEnergyRes, "calories");
    addToGroup(distanceRes, "distance");

    const daily = Object.entries(grouped).map(([date, val]) => ({
      date,
      steps: Math.round(val.steps),
      calories: Math.round(val.calories),
      distance: parseFloat(val.distance.toFixed(2)),
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

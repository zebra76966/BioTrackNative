import { Platform } from "react-native";
import api from "../auth/api";

// 1. DO NOT import react-native-health at the top.
// We define a variable and load it ONLY on iOS.
let AppleHealthKit = null;
if (Platform.OS === "ios") {
  AppleHealthKit = require("react-native-health").default;
}

// 2. Wrap permissions in a function so it doesn't execute on startup
const getPermissions = () => {
  if (!AppleHealthKit) return {};
  return {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        AppleHealthKit.Constants.Permissions.Workout,
        AppleHealthKit.Constants.Permissions.HeartRate,
      ],
      write: [],
    },
  };
};

export function initAppleHealth() {
  if (Platform.OS !== "ios" || !AppleHealthKit) return Promise.resolve();

  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(getPermissions(), (err) => {
      if (err) return reject(err);
      resolve();
      console.log("Apple HealthKit initialized successfully");
    });
  });
}

export function getWorkouts(days = 7) {
  if (Platform.OS !== "ios" || !AppleHealthKit) return Promise.resolve([]);

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

export async function getHealthData(days = 7) {
  if (Platform.OS !== "ios" || !AppleHealthKit) return { daily: [], sessions: [] };

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const dailyOptions = { startDate: start.toISOString(), endDate: end.toISOString() };
  const sampleOptions = { ...dailyOptions, unit: "kilocalorie", distanceUnit: "meter" };

  try {
    const [stepsRes, activeEnergyRes, distanceRes] = await Promise.all([
      new Promise((res) => AppleHealthKit.getDailyStepCountSamples(dailyOptions, (err, r) => res(r || []))),
      new Promise((res) => AppleHealthKit.getActiveEnergyBurned(sampleOptions, (err, r) => res(r || []))),
      new Promise((res) => AppleHealthKit.getDailyDistanceWalkingRunningSamples(sampleOptions, (err, r) => res(r || []))),
    ]);

    const grouped = {};
    const addToGroup = (samples, key) => {
      samples.forEach((s) => {
        const rawDate = s.startDate || s.endDate || s.date;
        if (!rawDate) return;
        const date = rawDate.split("T")[0];
        if (!grouped[date]) grouped[date] = { steps: 0, calories: 0, distance: 0 };
        grouped[date][key] += s.value ?? s.quantity ?? 0;
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
    console.error("Health Retrieval Error:", error);
    return { daily: [], sessions: [] };
  }
}

export async function syncAppleHealth(days = 7) {
  if (Platform.OS !== "ios") return;
  try {
    const data = await getHealthData(days);
    await api.post("/sync/apple-health", data);
    return data;
  } catch (e) {
    console.error("Sync Failure:", e);
  }
}

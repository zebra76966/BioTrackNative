import api from "@/auth/api";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getHealthData, initAppleHealth, syncAppleHealth } from "../services/appleHealth";

export default function AppleHealthTest() {
  const [dailyData, setDailyData] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [activeTab, setActiveTab] = useState("daily"); // "daily" or "workouts"
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [range, setRange] = useState(7);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("jwt");
        const userStr = await SecureStore.getItemAsync("user");
        if (userStr) setUser(JSON.parse(userStr));

        if (token) {
          api.defaults.headers.Authorization = `Bearer ${token}`;
          await initAppleHealth().catch(() => {});
          setConnected(true);
          fetchData(range);
        }
      } catch (err) {
        console.log("Error loading session:", err);
      }
    };
    loadSession();
  }, []);

  const fetchData = async (days) => {
    setLoading(true);
    try {
      const res = await getHealthData(days);

      console.log("resSession", res.sessions);
      setDailyData(res.daily || []);
      setWorkouts(res.sessions || []);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) fetchData(range);
  }, [range]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncAppleHealth(range);
      alert("Synced to BioTrack 🚀");
    } catch (e) {
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const totals = dailyData.reduce(
    (acc, d) => {
      acc.steps += d.steps || 0;
      acc.calories += d.calories || 0;
      acc.distance += d.distance || 0;
      return acc;
    },
    { steps: 0, calories: 0, distance: 0 },
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {!connected ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            onPress={async () => {
              setLoading(true);
              await initAppleHealth();
              setConnected(true);
              fetchData(range);
              setLoading(false);
            }}
            style={{ backgroundColor: "#2563eb", padding: 16, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{loading ? "Connecting..." : "Connect Apple Health"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
          {/* HEADER SECTION */}
          <View style={{ marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#94a3b8" }}>{user?.email || "User"}</Text>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>Health Dashboard</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/qr-scanner")}>
              <Ionicons name="scan-circle" size={40} color="#22c55e" />
            </TouchableOpacity>
          </View>

          {/* SYNC & RANGE SELECTOR */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 25 }}>
            <View style={{ flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, padding: 4 }}>
              {[7, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setRange(d)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: range === d ? "#3b82f6" : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>{d}D</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSync}
              disabled={syncing}
              style={{
                backgroundColor: syncing ? "#334155" : "#22c55e",
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {syncing ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="sync" size={18} color="#fff" />}
              <Text style={{ color: "#fff", fontWeight: "700" }}>Sync</Text>
            </TouchableOpacity>
          </View>

          {/* TAB SWITCHER */}
          <View style={{ flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 15, padding: 5, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setActiveTab("daily")}
              style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: activeTab === "daily" ? "#334155" : "transparent", borderRadius: 10 }}
            >
              <Text style={{ color: activeTab === "daily" ? "#fff" : "#94a3b8", fontWeight: "600" }}>Daily Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("workouts")}
              style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: activeTab === "workouts" ? "#334155" : "transparent", borderRadius: 10 }}
            >
              <Text style={{ color: activeTab === "workouts" ? "#fff" : "#94a3b8", fontWeight: "600" }}>Workouts</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
          ) : activeTab === "daily" ? (
            /* DAILY VIEW */
            <View>
              <View style={{ backgroundColor: "#1e293b", padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "#334155" }}>
                <Text style={{ color: "#94a3b8", marginBottom: 15, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Period Totals</Text>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                    <View style={{ backgroundColor: "#22c55e20", p: 8, borderRadius: 10, padding: 8 }}>
                      <Ionicons name="walk" size={20} color="#22c55e" />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                      {totals.steps.toLocaleString()} <Text style={{ fontSize: 14, color: "#94a3b8" }}>steps</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                    <View style={{ backgroundColor: "#ef444420", p: 8, borderRadius: 10, padding: 8 }}>
                      <Ionicons name="flame" size={20} color="#ef4444" />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>
                      {totals.calories.toLocaleString()} <Text style={{ fontSize: 14, color: "#94a3b8" }}>kcal</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {dailyData.map((d, i) => (
                <View key={i} style={{ backgroundColor: "#1e293b", padding: 16, borderRadius: 15, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "500" }}>{new Date(d.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}</Text>
                  <Text style={{ color: "#22c55e", fontWeight: "700" }}>
                    {d.steps.toLocaleString()} <Text style={{ color: "#94a3b8", fontWeight: "400" }}>steps</Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            /* WORKOUTS VIEW */
            <View>
              {workouts.length === 0 ? (
                <Text style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>No workouts found in this period.</Text>
              ) : (
                workouts.map((w, i) => (
                  <View key={i} style={{ backgroundColor: "#1e293b", padding: 16, borderRadius: 15, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#3b82f6" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <FontAwesome5 name="running" size={14} color="#3b82f6" />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{w.activity_type}</Text>
                      </View>
                      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(w.start_time).toLocaleDateString()}</Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 20 }}>
                      <View>
                        <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase" }}>Duration</Text>
                        <Text style={{ color: "#fff", fontWeight: "600" }}>{w.duration_minutes} mins</Text>
                      </View>
                      <View>
                        <Text style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase" }}>Burned</Text>
                        <Text style={{ color: "#fff", fontWeight: "600" }}>{w.calories} kcal</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

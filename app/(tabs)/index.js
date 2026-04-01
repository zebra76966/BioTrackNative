import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../auth/api";
import ActivityItem from "../../components/ActivityItem";
import CheckupSchedule from "../../components/CheckupSchedule";
import MetabolicHealthCard from "../../components/MetabolicHealthCard";
import StatCard from "../../components/StatCard";
import UnifiedActivityChart from "../../components/UnifiedActivityChart";
// NEW: You'll need to create this simple component to show Oura metrics
import OuraRecoveryCard from "../../components/OuraRecoveryCard";
import { syncAppleHealth } from "../../services/appleHealth";

export default function Dashboard() {
  console.log("Rendering Insights Screen", Platform.OS);
  const router = useRouter();
  const [range, setRange] = useState(7);
  const [mode, setMode] = useState("smart");
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [ouraData, setOuraData] = useState(null); // NEW: Oura state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [metabolicData, setMetabolicData] = useState(null);
  const [lastSynced, setLastSynced] = useState("Never");

  const spinValue = useRef(new Animated.Value(0)).current;
  const isFirstMount = useRef(true);

  // UPDATED: Added fitbit to the priority hierarchy
  const [priority, setPriority] = useState({
    steps: "fitbit", // Fitbit is often more accurate for steps than phone-only
    calories: "fitbit",
    distance: "apple_health",
  });

  const loadSyncTime = async () => {
    const time = await SecureStore.getItemAsync("last_sync_timestamp");
    if (time) setLastSynced(time);
  };

  const fetchAll = useCallback(
    async (silent = false) => {
      try {
        if (!silent && !refreshing) setLoading(true);

        // UPDATED: Added Oura recovery data endpoint
        const [metabolicRes, activityRes, statusRes, ouraRes] = await Promise.all([
          api.get("/insights/metabolic-full"),
          api.get("/activity/merged", {
            params: { days: range === 1 ? 7 : range, mode: mode, priority: JSON.stringify(priority) },
          }),
          api.get("/devices/status"),
          api.get("/activity/oura-recovery"), // NEW: Fetching injected/real Oura data
        ]);

        setMetabolicData(metabolicRes.data);
        setData(activityRes.data);
        setOuraData(ouraRes.data); // NEW: Setting Oura data

        const hasNoDevices = !statusRes.data.apple && !statusRes.data.googlefit && !statusRes.data.dexcom && !statusRes.data.fitbit && !statusRes.data.oura;
        const hasNoData = !activityRes.data || activityRes.data.length === 0;

        setShowOnboarding(hasNoDevices || hasNoData);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [range, mode, refreshing, priority],
  );

  const syncActivity = async () => {
    try {
      setSyncing(true);
      startSpin();

      await syncAppleHealth(range === 1 ? 7 : range); // Sync Apple Health first to ensure we have the latest data, especially for Oura which relies on it
      await api.post("/sync/manual", { days: range === 1 ? 7 : range });

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await SecureStore.setItemAsync("last_sync_timestamp", now);
      setLastSynced(now);

      await fetchAll(true);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadSyncTime();
    fetchAll().then(() => {
      if (isFirstMount.current) {
        syncActivity();
        isFirstMount.current = false;
      }
    });
  }, [fetchAll]);
  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        fetchAll(true);
      }, 300); // small delay

      return () => clearTimeout(timeout);
    }, [fetchAll]),
  );

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const stats = (() => {
    if (!data || data.length === 0) return { steps: 0, calories: 0, distance: 0 };
    if (range === 1) return data[data.length - 1];
    return data.reduce(
      (acc, curr) => ({
        steps: (acc.steps || 0) + (curr.steps || 0),
        calories: (acc.calories || 0) + (curr.calories || 0),
        distance: (acc.distance || 0) + (curr.distance || 0),
        sources: Array.from(new Set([...(acc.sources || []), ...(curr.sources || [])])),
      }),
      {},
    );
  })();

  const sessions = (function useActivitySessions(days, refreshTrigger) {
    const [s, setS] = useState([]);
    useEffect(() => {
      api.get(`/activity/sessions/${days}`).then((res) => setS(res.data));
    }, [days, refreshTrigger]);
    return s;
  })(range, refreshing);

  const displaySessions = (sessions || []).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#a58fff" />
          <Text style={styles.loaderText}>SYNCHRONIZING NEURAL LINK...</Text>
        </View>
      )}

      {/* ONBOARDING MODAL */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Animated.View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="access-point-network" size={42} color="#a58fff" />
            </Animated.View>
            <Text style={styles.modalTitle}>LINK REQUIRED</Text>
            <Text style={styles.modalSub}>Connect your Apple Health, Google Fit, Fitbit, or Oura Ring to begin biometric data synthesis.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowOnboarding(false);
                router.push("/(tabs)/profile");
              }}
            >
              <Text style={styles.modalBtnText}>INITIALIZE BIOMETRIC NODE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll()} tintColor="#a58fff" />} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.padding}>
          <View style={styles.headerRow}>
            <View>
              <View style={styles.syncStatusRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.greeting}>SYSTEM ONLINE • LAST SYNC: {lastSynced}</Text>
              </View>
              <Text style={styles.mainTitle}>BioTrack</Text>
            </View>
            <TouchableOpacity style={[styles.actionBtn, syncing && styles.syncingBtn]} onPress={syncActivity} disabled={syncing}>
              <Animated.View style={{ transform: [{ rotate: syncing ? spin : "0deg" }] }}>
                <MaterialCommunityIcons name="cached" size={22} color={syncing ? "#fff" : "#a58fff"} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Toggles */}
          <View style={styles.controlsRow}>
            <View style={styles.toggleContainer}>
              {[1, 7, 30].map((d) => (
                <TouchableOpacity key={d} onPress={() => setRange(d)} style={[styles.toggleBtn, range === d && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, range === d && styles.toggleTextActive]}>{d === 1 ? "1D" : `${d}D`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.toggleContainer}>
              {["smart", "priority"].map((m) => (
                <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selector */}
          {mode === "priority" && (
            <View style={styles.prioritySelectorPane}>
              <Text style={styles.paneLabel}>DATA SOURCE PRIORITY</Text>
              <View style={styles.sourceToggleRow}>
                {[
                  { id: "apple_health", label: "APPLE", icon: "apple" },
                  { id: "google_fit", label: "FIT", icon: "google" },
                  { id: "fitbit", label: "FITBIT", icon: "watch-variant" }, // Added Fitbit
                ].map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[styles.sourceBtn, priority.steps === source.id && styles.sourceBtnActive]}
                    onPress={() => {
                      setPriority({ steps: source.id, calories: source.id, distance: source.id });
                    }}
                  >
                    <MaterialCommunityIcons name={source.icon} size={14} color={priority.steps === source.id ? "#000" : "#666"} />
                    <Text style={[styles.sourceText, priority.steps === source.id && styles.sourceTextActive]}>{source.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Stats Grid - Now shows Fitbit as source if available */}
          <View style={styles.grid}>
            <StatCard title="Steps" value={stats.steps?.toLocaleString() || 0} icon="run" sources={stats.sources || []} />
            <StatCard title="Kcal" value={(stats.calories || 0).toFixed(0)} icon="fire" color="#FF4500" sources={stats.sources || []} />
            <StatCard title="Dist" value={`${((stats.distance || 0) / 1000).toFixed(1)}km`} icon="map-marker-distance" color="#00BFFF" sources={stats.sources || []} />
          </View>

          {data && <UnifiedActivityChart data={data} />}

          {/* NEW: Oura Recovery Card */}
          {ouraData && <OuraRecoveryCard data={ouraData} />}

          {metabolicData && <MetabolicHealthCard data={metabolicData} />}
          <CheckupSchedule />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT PROTOCOLS</Text>
          </View>

          {displaySessions.length > 0 ? (
            displaySessions.slice(0, 10).map((item, i) => <ActivityItem key={i} session={item} />)
          ) : (
            <View style={styles.loaderContainer}>
              <Text style={styles.loadingText}>Waiting for link...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  padding: { padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 25 },
  syncStatusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#50ff50" },
  greeting: { color: "#a58fff", fontSize: 9, letterSpacing: 1.5, fontWeight: "800", textTransform: "uppercase" },
  mainTitle: { color: "#fff", fontSize: 34, fontWeight: "900", textTransform: "uppercase", letterSpacing: -1 },

  fullScreenLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loaderText: { color: "#a58fff", marginTop: 20, fontSize: 10, letterSpacing: 2, fontWeight: "800" },

  modalOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 25 },
  modalContent: { backgroundColor: "#080808", padding: 40, borderRadius: 40, alignItems: "center", borderWidth: 1, borderColor: "#a58fff33", width: "100%" },
  modalIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#a58fff10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#a58fff",
  },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 2, marginBottom: 12 },
  modalSub: { color: "#666", textAlign: "center", fontSize: 14, lineHeight: 22, marginBottom: 35, fontWeight: "500" },
  modalBtn: { backgroundColor: "#a58fff", paddingVertical: 18, borderRadius: 20, width: "100%", alignItems: "center" },
  modalBtnText: { color: "#000", fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  lockText: { color: "#333", fontSize: 9, fontWeight: "800", marginTop: 20, letterSpacing: 1 },

  actionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#121212", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },
  syncingBtn: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  controlsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  toggleContainer: { flexDirection: "row", backgroundColor: "#0a0a0a", borderRadius: 15, padding: 4, borderWidth: 1, borderColor: "#1a1a1a" },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  toggleBtnActive: { backgroundColor: "#a58fff" },
  toggleText: { color: "#444", fontSize: 10, fontWeight: "900" },
  toggleTextActive: { color: "#000" },
  grid: { flexDirection: "row", gap: 12, marginBottom: 35 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: "#a58fff", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  loaderContainer: { padding: 40, alignItems: "center" },
  loadingText: { color: "#222", fontSize: 10, fontWeight: "800" },
  // --- ADD THESE TO YOUR STYLES ---
  prioritySelectorPane: {
    backgroundColor: "#0a0a0a",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 25,
  },
  paneLabel: {
    color: "#444",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: "center",
  },
  sourceToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  sourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#222",
  },
  sourceBtnActive: {
    backgroundColor: "#a58fff",
    borderColor: "#a58fff",
  },
  sourceText: {
    color: "#666",
    fontSize: 9,
    fontWeight: "900",
  },
  sourceTextActive: {
    color: "#000",
  },
});

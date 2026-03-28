import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../auth/api";
import ActivityItem from "../../components/ActivityItem";
import CheckupSchedule from "../../components/CheckupSchedule";
import StatCard from "../../components/StatCard";
import UnifiedActivityChart from "../../components/UnifiedActivityChart";

export default function Dashboard() {
  const [range, setRange] = useState(7);
  const [mode, setMode] = useState("smart");
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);

  // Animation value for the sync icon
  const spinValue = useRef(new Animated.Value(0)).current;

  function useActivitySessions(days, refreshTrigger = 0) {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
      api.get(`/activity/sessions/${days}`).then((res) => {
        setSessions(res.data);
      });
    }, [days, refreshTrigger]);

    return sessions;
  }

  const sessions = useActivitySessions(range, refreshing);

  const [priority, setPriority] = useState({
    steps: "apple_health",
    calories: "apple_health",
    distance: "apple_health",
  });

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get(`/activity/merged`, {
        params: {
          days: range,
          mode: mode,
          priority: JSON.stringify(priority),
        },
      });
      setData(res.data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [range, mode, priority]);

  // Sync Logic
  const syncActivity = async () => {
    try {
      setSyncing(true);
      startSpin();
      await api.post("/sync/manual", { days: range });
      await fetchAll();
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  };

  // Rotation Animation
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

  useEffect(() => {
    if (!syncing) {
      spinValue.stopAnimation();
    }
  }, [syncing]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const today = data?.[data?.length - 1];

  const [displaySessions, setDisplaySessions] = useState([]);

  useEffect(() => {
    if (sessions) {
      // Merge the sessions before setting them to display
      const merged = groupAdjacentSessions(sessions);
      setDisplaySessions(merged);
    }
  }, [sessions]);

  const groupAdjacentSessions = (sessions) => {
    if (!sessions || sessions.length === 0) return [];

    // Sort by time ascending to group correctly
    const sorted = [...sessions].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const grouped = sorted.reduce((acc, curr) => {
      if (acc.length === 0) return [curr];

      const last = acc[acc.length - 1];
      const lastEnd = new Date(new Date(last.start_time).getTime() + last.duration_minutes * 60000);
      const currStart = new Date(curr.start_time);

      // If the gap is 5 minutes or less, merge them
      const diffInMinutes = (currStart - lastEnd) / 60000;

      if (diffInMinutes <= 5 && last.activity_type === curr.activity_type) {
        last.duration_minutes += curr.duration_minutes;
        last.calories = (last.calories || 0) + (curr.calories || 0);
        return acc;
      } else {
        return [...acc, curr];
      }
    }, []);

    // Return reversed so newest is on top for the UI
    return grouped.reverse();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAll();
            }}
            tintColor="#a58fff"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.padding}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>SYSTEM OPERATIONAL</Text>
              <Text style={styles.mainTitle}>BioTrack</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.actionBtn, syncing && styles.syncingBtn]} onPress={syncActivity} disabled={syncing}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <MaterialCommunityIcons name="cached" size={22} color={syncing ? "#fff" : "#a58fff"} />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileCircle}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color="#a58fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls: Range & Mode */}
          <View style={styles.controlsRow}>
            <View style={styles.toggleContainer}>
              {[7, 30].map((d) => (
                <TouchableOpacity key={d} onPress={() => setRange(d)} style={[styles.toggleBtn, range === d && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, range === d && styles.toggleTextActive]}>{d}D</Text>
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
                ].map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[styles.sourceBtn, priority.steps === source.id && styles.sourceBtnActive]}
                    onPress={() => setPriority({ steps: source.id, calories: source.id, distance: source.id })}
                  >
                    <MaterialCommunityIcons name={source.icon} size={14} color={priority.steps === source.id ? "#000" : "#666"} />
                    <Text style={[styles.sourceText, priority.steps === source.id && styles.sourceTextActive]}>{source.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.grid}>
            <StatCard
              title="Steps"
              value={today?.steps?.toLocaleString() || 0}
              icon="run"
              // Extracting from chosenSource and wrapping in array for the card's map function
              sources={today?.chosenSource?.steps ? [today.chosenSource.steps] : today?.sources}
            />
            <StatCard title="Kcal" value={(today?.calories || 0).toFixed(0)} icon="fire" color="#FF4500" sources={today?.chosenSource?.calories ? [today.chosenSource.calories] : today?.sources} />
            <StatCard
              title="Dist"
              value={`${((today?.distance || 0) / 1000).toFixed(1)}km`}
              icon="map-marker-distance"
              color="#00BFFF"
              sources={today?.chosenSource?.distance ? [today.chosenSource.distance] : today?.sources}
            />
          </View>

          {data && <UnifiedActivityChart data={data} />}
          <CheckupSchedule />

          {/* Recent Protocols Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>RECENT PROTOCOLS</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>HISTORY</Text>
            </TouchableOpacity>
          </View>

          {sessions && sessions.length > 0 ? (
            displaySessions.slice(0, 20).map((item, i) => <ActivityItem key={i} session={item} />)
          ) : (
            <View style={styles.loaderContainer}>
              <Text style={styles.loadingText}>No recent protocols found...</Text>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  greeting: { color: "#a58fff", fontSize: 10, letterSpacing: 3, fontWeight: "700" },
  mainTitle: { color: "#fff", fontSize: 32, fontWeight: "900", textTransform: "uppercase" },

  actionBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: "#121212", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },
  syncingBtn: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  profileCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: "#121212", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },

  controlsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  toggleContainer: { flexDirection: "row", backgroundColor: "#121212", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "#222" },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: "#a58fff" },
  toggleText: { color: "#666", fontSize: 10, fontWeight: "800" },
  toggleTextActive: { color: "#000" },

  prioritySelectorPane: { backgroundColor: "#121212", padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#a58fff33" },
  paneLabel: { color: "#a58fff", fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 10, textAlign: "center" },
  sourceToggleRow: { flexDirection: "row", gap: 10 },
  sourceBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  sourceBtnActive: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  sourceText: { color: "#666", fontSize: 11, fontWeight: "700" },
  sourceTextActive: { color: "#000" },

  grid: { flexDirection: "row", gap: 10, marginBottom: 35 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, alignItems: "center" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  accentBar: { width: 4, height: 16, backgroundColor: "#a58fff", borderRadius: 2 },
  sectionTitle: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  viewAll: { color: "#555", fontSize: 10, fontWeight: "700" },
  loaderContainer: { padding: 40, alignItems: "center" },
  loadingText: { color: "#444", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
});

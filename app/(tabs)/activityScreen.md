import { MaterialCommunityIcons } from "@expo/vector-icons";
import \* as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";
// Components
import ActivityLogList from "../../components/ActivityLogList";
import ActivityTimeline from "../../components/ActivityTimeline";
import StatCard from "../../components/StatCard";
import UnifiedActivityChart from "../../components/UnifiedActivityChart";

export default function ActivityScreen() {
// Renamed from 'range' to 'activeRange' to avoid declaration conflicts
const [activeRange, setActiveRange] = useState(7);
const [mode, setMode] = useState("smart");
const [data, setData] = useState([]);
const [sessions, setSessions] = useState([]);
const [loading, setLoading] = useState(true);
const [syncing, setSyncing] = useState(false);

const [priority, setPriority] = useState({
steps: "apple_health",
calories: "apple_health",
distance: "apple_health",
});

const fetchActivity = useCallback(async () => {
try {
setLoading(true);
const [mergedRes, sessionsRes] = await Promise.all([
api.get(`/activity/merged`, {
params: {
days: activeRange,
mode: mode,
priority: JSON.stringify(priority),
},
}),
api.get(`/activity/sessions/${activeRange}`),
]);

      setData(mergedRes.data);
      setSessions(sessionsRes.data);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }

}, [activeRange, mode, priority]);

const syncActivity = async () => {
setSyncing(true);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
try {
await api.post("/sync/manual", { days: activeRange });
fetchActivity();
} catch (e) {
Alert.alert("Sync Failed", "Could not refresh health data.");
} finally {
setSyncing(false);
}
};

useEffect(() => {
fetchActivity();
}, [fetchActivity]);

const today = data[data.length - 1];
const avgSteps = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.steps, 0) / data.length) : 0;

return (
<ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={syncing || loading} onRefresh={syncActivity} tintColor="#a58fff" />}>
<View style={styles.header}>
<View>
<Text style={styles.title}>ACTIVITY</Text>
<Text style={styles.subtitle}>Track your movement patterns</Text>
</View>
<TouchableOpacity style={styles.syncBtn} onPress={syncActivity} disabled={syncing}>
<MaterialCommunityIcons name="cached" size={20} color="#a58fff" />
</TouchableOpacity>
</View>

      {/* Range & Mode Toggles */}
      <View style={styles.toggleRow}>
        <View style={styles.leftToggles}>
          {[7, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.toggleBtn, activeRange === d && styles.activeToggle]}
              onPress={() => {
                setActiveRange(d);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.toggleText, activeRange === d && styles.activeToggleText]}>{d}D</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modeToggleGroup}>
          {["smart", "priority"].map((m) => (
            <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.activeModeBtn]} onPress={() => setMode(m)}>
              <Text style={[styles.modeText, mode === m && styles.activeModeText]}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Priority Selector Pane (Added to match Dashboard) */}
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
      <View style={styles.statsGrid}>
        <StatCard
          title="Today"
          value={today?.steps?.toLocaleString() || "0"}
          icon="walk"
          unit="steps"
          color="#27ae60"
          sources={today?.chosenSource?.steps ? [today.chosenSource.steps] : today?.sources}
        />
        <StatCard title="Average" value={avgSteps.toLocaleString()} icon="trending-up" unit="steps/day" color="#a58fff" />
        <StatCard
          title="Burn"
          value={`${Math.round(today?.calories || 0)}`}
          icon="fire"
          unit="kcal"
          color="#eb5757"
          sources={today?.chosenSource?.calories ? [today.chosenSource.calories] : today?.sources}
        />
      </View>

      <UnifiedActivityChart data={data} />

      <Text style={styles.sectionTitle}>Daily Timeline</Text>
      <ActivityTimeline sessions={sessions} />

      <Text style={styles.sectionTitle}>Workouts</Text>
      <ActivityLogList sessions={sessions} />

      <View style={{ height: 100 }} />
    </ScrollView>

);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16 },
header: { marginTop: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
title: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: 1 },
subtitle: { fontSize: 12, color: "#666", fontWeight: "600" },
syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#111", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },

toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
leftToggles: { flexDirection: "row", gap: 8 },
toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#111", borderWidth: 1, borderColor: "#222" },
activeToggle: { borderColor: "#a58fff", backgroundColor: "#a58fff22" },
toggleText: { color: "#666", fontSize: 10, fontWeight: "bold" },
activeToggleText: { color: "#a58fff" },

modeToggleGroup: { flexDirection: "row", backgroundColor: "#111", borderRadius: 20, padding: 2, borderWidth: 1, borderColor: "#222" },
modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
activeModeBtn: { backgroundColor: "#a58fff" },
modeText: { color: "#666", fontSize: 9, fontWeight: "900" },
activeModeText: { color: "#000" },

prioritySelectorPane: { backgroundColor: "#111", padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#a58fff33" },
paneLabel: { color: "#a58fff", fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 10, textAlign: "center" },
sourceToggleRow: { flexDirection: "row", gap: 10 },
sourceBtn: {
flex: 1,
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
gap: 6,
paddingVertical: 10,
backgroundColor: "#000",
borderRadius: 8,
borderWidth: 1,
borderColor: "#222",
},
sourceBtnActive: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
sourceText: { color: "#666", fontSize: 11, fontWeight: "700" },
sourceTextActive: { color: "#000" },

statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 8 },
sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1, marginTop: 25, marginBottom: 15 },
});

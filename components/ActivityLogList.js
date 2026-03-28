import { StyleSheet, Text, View } from "react-native";

export default function ActivityLogList({ sessions }) {
  return (
    <View style={styles.container}>
      {sessions.slice(0, 5).map((session, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.iconBox}>
            <Text style={styles.emoji}>{session.activity_type.toLowerCase().includes("walk") ? "🚶" : "🏋️"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.type}>{session.activity_type}</Text>
            <Text style={styles.date}>{new Date(session.start_time).toLocaleDateString()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.duration}>{session.duration_minutes} min</Text>
            <Text style={[styles.source, { color: session.source === "google_fit" ? "#4285F4" : "#FF2D55" }]}>{session.source.replace("_", " ").toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0a0a0a", borderRadius: 20, borderWidth: 1, borderColor: "#1a1a1a", overflow: "hidden" },
  row: { flexDirection: "row", padding: 15, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#111", justifyContent: "center", alignItems: "center", marginRight: 12 },
  emoji: { fontSize: 18 },
  type: { color: "#fff", fontSize: 14, fontWeight: "700" },
  date: { color: "#555", fontSize: 11, marginTop: 2 },
  duration: { color: "#fff", fontSize: 14, fontWeight: "800" },
  source: { fontSize: 8, fontWeight: "900", marginTop: 4 },
});

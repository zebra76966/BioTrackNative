import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function ActivityItem({ session }) {
  const type = session?.activity_type || "Activity";
  const duration = session?.duration_minutes || 0;

  const intensity = duration > 45 ? "High" : duration > 25 ? "Moderate" : "Light";
  const intensityColor = intensity === "High" ? "#FF4500" : intensity === "Moderate" ? "#D4AF37" : "#00BFFF";

  const dateObj = session?.start_time ? new Date(session.start_time) : new Date();
  const formattedDate = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const source = session?.source || "google_fit";
  const calories = session?.calories;

  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: `${intensityColor}20` }]}>
            <MaterialCommunityIcons name={type.toLowerCase().includes("walk") ? "walk" : type.toLowerCase().includes("run") ? "run" : "lightning-bolt"} size={16} color={intensityColor} />
          </View>
          <Text style={styles.type}>{type}</Text>
          <View style={styles.sourceBadge}>
            <MaterialCommunityIcons name={source.includes("apple") ? "apple" : "google"} size={10} color="#D4AF37" />
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.timeText}>{formattedTime}</Text>
          <Text style={styles.dateSeparator}>•</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={[styles.intensityDot, { backgroundColor: intensityColor }]} />
          <Text style={[styles.intensityText, { color: intensityColor }]}>{intensity}</Text>
        </View>
      </View>

      <View style={styles.right}>
        {/* Added a subtle icon to indicate this is a total duration */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#D4AF37" style={{ marginTop: 2 }} />
          <Text style={styles.metric}>{duration} min</Text>
        </View>
        <Text style={styles.subMetric}>{calories ? `${Math.round(calories)} kcal` : "-- kcal"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#121212",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  left: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  type: { color: "#fff", fontWeight: "700", fontSize: 13, textTransform: "uppercase" },
  sourceBadge: { padding: 4, borderRadius: 4, backgroundColor: "#000" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  timeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  dateSeparator: { color: "#333", fontSize: 11 },
  dateText: { color: "#666", fontSize: 11, fontWeight: "600" },
  intensityDot: { width: 4, height: 4, borderRadius: 2 },
  intensityText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  right: { justifyContent: "center", alignItems: "flex-end" },
  metricRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  metric: { color: "#D4AF37", fontWeight: "900", fontSize: 16 },
  subMetric: { color: "#555", fontSize: 11, fontWeight: "600" },
});

import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { StyleSheet, Text, View } from "react-native";

// Mapping for icons based on activity type or title
const getActivityConfig = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("walk")) return { icon: "walking", color: "#27ae60", lib: FontAwesome5 };
  if (t.includes("strength") || t.includes("workout")) return { icon: "dumbbell", color: "#7c4dff", lib: FontAwesome5 };
  if (t.includes("sleep")) return { icon: "bed", color: "#3498db", lib: FontAwesome5 };
  return { icon: "heartbeat", color: "#eb5757", lib: FontAwesome5 };
};

export default function ActivityTimeline({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No workout sessions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((group, groupIdx) => (
        <View key={groupIdx} style={styles.group}>
          <Text style={styles.dateLabel}>{group.label}</Text>

          {group.items.map((item, itemIdx) => (
            <TimelineItem key={itemIdx} {...item} isLast={groupIdx === data.length - 1 && itemIdx === group.items.length - 1} />
          ))}
        </View>
      ))}
    </View>
  );
}

function TimelineItem({ title, time, duration, intensity, source, isLast }) {
  const config = getActivityConfig(title);
  const IconLib = config.lib;

  return (
    <MotiView from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "timing", duration: 400 }} style={styles.itemWrapper}>
      {/* The Vertical Line "Thread" */}
      <View style={styles.lineWrapper}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        {!isLast && <View style={styles.verticalLine} />}
      </View>

      {/* The Content Card */}
      <View style={styles.itemCard}>
        <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
          <IconLib name={config.icon} size={16} color={config.color} />

          {/* Small Source Badge */}
          <View style={styles.sourceBadge}>
            <MaterialCommunityIcons name={source === "apple_health" ? "apple" : "google-fit"} size={10} color="#fff" />
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemMeta}>
            {time} · {duration}
          </Text>
        </View>

        <View style={[styles.intensityPill, styles[intensity?.toLowerCase()]]}>
          <Text style={[styles.intensityText, styles[`${intensity?.toLowerCase()}Text`]]}>{intensity}</Text>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  group: { marginBottom: 20 },
  dateLabel: { color: "#888", fontSize: 12, fontWeight: "700", marginBottom: 15, textTransform: "uppercase", letterSpacing: 1 },

  itemWrapper: { flexDirection: "row", marginBottom: 5 },
  lineWrapper: { alignItems: "center", width: 20, marginRight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 2, marginTop: 18 },
  verticalLine: { width: 2, flex: 1, backgroundColor: "#1a1a1a", marginTop: -5, marginBottom: -15 },

  itemCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#161616",
    marginBottom: 10,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  sourceBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: "#000", borderRadius: 10, padding: 2, borderWidth: 1, borderColor: "#1a1a1a" },

  info: { flex: 1 },
  itemTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  itemMeta: { color: "#555", fontSize: 12, marginTop: 2 },

  intensityPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  intensityText: { fontSize: 10, fontWeight: "800" },

  // Intensity Colors
  high: { backgroundColor: "#eb575720" },
  highText: { color: "#eb5757" },
  moderate: { backgroundColor: "#f2994a20" },
  moderateText: { color: "#f2994a" },
  light: { backgroundColor: "#27ae6020" },
  lightText: { color: "#27ae60" },

  emptyCard: { padding: 40, alignItems: "center", backgroundColor: "#0a0a0a", borderRadius: 20 },
  emptyText: { color: "#444", fontWeight: "600" },
});

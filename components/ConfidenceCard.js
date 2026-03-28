import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function ConfidenceCard({ confidence }) {
  const percent = Math.round((confidence?.value || 0) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-check" size={20} color="#D4AF37" />
        <Text style={styles.title}>AI CONFIDENCE</Text>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>
      <Text style={styles.reason}>{confidence?.reason}</Text>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="database" size={12} color="#666" />
          <Text style={styles.chipText}>Labs + Wearables</Text>
        </View>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="check-decagram" size={12} color="#666" />
          <Text style={styles.chipText}>Verified</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111", borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: "#D4AF37" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  title: { color: "#fff", fontSize: 12, fontWeight: "800", flex: 1 },
  percentBadge: { backgroundColor: "#D4AF3720", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  percentText: { color: "#D4AF37", fontWeight: "900", fontSize: 12 },
  reason: { color: "#888", fontSize: 12, lineHeight: 18, marginBottom: 15 },
  chips: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#000", padding: 6, borderRadius: 6 },
  chipText: { color: "#666", fontSize: 9, fontWeight: "700" },
});

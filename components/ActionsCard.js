import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import ActionItem from "./ActionItem";

export default function ActionsCard({ actions = [] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="star-four-points" size={18} color="#D4AF37" />
          <Text style={styles.title}>SUGGESTED ACTIONS</Text>
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI VERIFIED</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Personalized protocols to optimize your metabolic health score.</Text>

      <View style={styles.list}>
        {actions.map((action, index) => (
          <ActionItem key={index} action={action} isLast={index === actions.length - 1} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  aiBadge: {
    backgroundColor: "#D4AF3720",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#D4AF3740",
  },
  aiBadgeText: { color: "#D4AF37", fontSize: 8, fontWeight: "900" },
  subtitle: { color: "#666", fontSize: 11, marginBottom: 20, lineHeight: 16 },
  list: { gap: 12 },
});

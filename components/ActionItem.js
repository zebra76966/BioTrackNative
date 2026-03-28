import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ActionItem({ action }) {
  // Determine icon based on category (optional logic)
  const getIcon = (type) => {
    if (type?.includes("Nutrition")) return "food-apple";
    if (type?.includes("Activity")) return "run";
    return "lightning-bolt";
  };

  return (
    <Pressable style={({ pressed }) => [styles.item, pressed && { backgroundColor: "#1A1A1A" }]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={getIcon(action.category)} size={18} color="#a58fff" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionImpact}>{action.impact || "High Impact"}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#a58fff10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  actionTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  actionImpact: {
    color: "#4CAF50",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

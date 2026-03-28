import { StyleSheet, Text, View } from "react-native";

export default function ImpactList({ title, type, items }) {
  const color = type === "positive" ? "#4CAF50" : "#FF4500";

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color }]}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.impactCard}>
          <View style={[styles.indicator, { backgroundColor: color }]} />
          <View style={styles.cardContent}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.message}>{item.message || item.description}</Text>
          </View>
          <Text style={[styles.points, { color }]}>
            {type === "positive" ? "+" : ""}
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  impactCard: {
    flexDirection: "row",
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  indicator: { width: 3, height: "100%", borderRadius: 2, marginRight: 12 },
  cardContent: { flex: 1 },
  label: { color: "#fff", fontSize: 13, fontWeight: "700" },
  message: { color: "#666", fontSize: 11, marginTop: 2 },
  points: { fontSize: 14, fontWeight: "900" },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function StatCard({ title, value, sub, icon, color = "#D4AF37", sources = [] }) {
  // Ensure sources is always an array and filter out nulls
  const safeSources = Array.isArray(sources) ? sources : [sources];
  const uniqueSources = [...new Set(safeSources.filter(Boolean))];

  return (
    <View style={styles.card}>
      <View style={styles.sourcesRow}>
        {uniqueSources.map((s, idx) => (
          <View key={idx} style={styles.sourcePill}>
            <MaterialCommunityIcons name={s.toLowerCase().includes("apple") ? "apple" : "google"} size={10} color="#666" />
          </View>
        ))}
      </View>

      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    minHeight: 110,
    justifyContent: "center",
  },
  sourcesRow: {
    flexDirection: "row",
    position: "absolute",
    top: 8,
    right: 8,
    gap: 4,
  },
  sourcePill: {
    padding: 2,
  },
  iconCircle: { padding: 8, borderRadius: 50, marginBottom: 4 },
  value: { color: "#fff", fontSize: 16, fontWeight: "900" },
  title: { color: "#D4AF37", fontSize: 8, fontWeight: "800", marginTop: 2, letterSpacing: 1 },
  sub: { color: "#444", fontSize: 8, marginTop: 1 },
});

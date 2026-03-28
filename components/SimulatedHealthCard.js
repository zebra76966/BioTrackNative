import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSimulation } from "./SimulationContext";

export default function SimulatedHealthCard({ todaySteps = 8420 }) {
  const { simulatedMarkers } = useSimulation();

  const dynamicScore = useMemo(() => {
    // 1. Lab Score logic from your snippet
    const trt = simulatedMarkers.find((m) => m.id === "trt")?.value || 600;
    const ldl = simulatedMarkers.find((m) => m.id === "ldl")?.value || 100;

    // Normalized lab score (Targeting ~100)
    const labScore = trt / 10 + (200 - ldl) / 2;

    // 2. Activity Score (Goal 10k)
    const activityScore = Math.min(100, (todaySteps / 10000) * 100);

    return Math.round(labScore * 0.4 + activityScore * 0.6);
  }, [simulatedMarkers, todaySteps]);

  const getStatus = (score) => {
    if (score >= 80) return { label: "Excellent", color: "#4CAF50" };
    if (score >= 65) return { label: "Good", color: "#a58fff" };
    return { label: "Needs Attention", color: "#FF5252" };
  };

  const status = getStatus(dynamicScore);

  return (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color="#a58fff" />
          <Text style={styles.titleText}>OVERALL HEALTH</Text>
        </View>
        <Text style={[styles.statusBadge, { color: status.color }]}>{status.label}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreNumber}>{dynamicScore}</Text>
        <Text style={styles.scoreUnit}>/ 100</Text>
      </View>

      <Text style={styles.subText}>Live index combining lab simulations and movement.</Text>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="trending-up" size={12} color="#666" />
          <Text style={styles.chipLabel}>LIVE</Text>
        </View>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#666" />
          <Text style={styles.chipLabel}>{dynamicScore > 70 ? "STABLE" : "VAR"}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#222", marginBottom: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  statusBadge: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  scoreContainer: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  scoreNumber: { color: "#fff", fontSize: 48, fontWeight: "900" },
  scoreUnit: { color: "#444", fontSize: 18, fontWeight: "700", marginLeft: 5 },
  subText: { color: "#666", fontSize: 12, lineHeight: 18, marginBottom: 20 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#080808", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#1a1a1a" },
  chipLabel: { color: "#888", fontSize: 9, fontWeight: "800" },
});

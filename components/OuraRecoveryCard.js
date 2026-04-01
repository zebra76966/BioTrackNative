import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function OuraRecoveryCard({ data }) {
  // If no data, don't render or show a placeholder
  if (!data || data.length === 0) return null;

  // Get the most recent entry
  const latest = data[0];

  const getScoreColor = (score) => {
    if (score >= 85) return "#a58fff"; // Optimal
    if (score >= 70) return "#50ff50"; // Good
    return "#ff4500"; // Pay Attention
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="ring" size={20} color="#000" />
          </View>
          <View>
            <Text style={styles.title}>RECOVERY ANALYSIS</Text>
            <Text style={styles.subtitle}>OURA RING DATA NODE</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{latest.date}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {/* Readiness Score */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>READINESS</Text>
          <Text style={[styles.metricValue, { color: getScoreColor(latest.readiness_score) }]}>{latest.readiness_score}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${latest.readiness_score}%`, backgroundColor: getScoreColor(latest.readiness_score) }]} />
          </View>
        </View>

        {/* Sleep Score */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>SLEEP QUALITY</Text>
          <Text style={[styles.metricValue, { color: getScoreColor(latest.sleep_score) }]}>{latest.sleep_score}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${latest.sleep_score}%`, backgroundColor: getScoreColor(latest.sleep_score) }]} />
          </View>
        </View>

        {/* HRV Average */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>HRV AVG</Text>
          <View style={styles.hrvContainer}>
            <Text style={styles.hrvValue}>{latest.hrv_average || "--"}</Text>
            <Text style={styles.unit}>ms</Text>
          </View>
          <Text style={styles.statusText}>{latest.hrv_average > 50 ? "AUTONOMIC BALANCE: HIGH" : "RECOVERY NEEDED"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#080808",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#444",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
  },
  dateText: {
    color: "#333",
    fontSize: 10,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: "#666",
    fontSize: 8,
    fontWeight: "800",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#151515",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  hrvContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 4,
  },
  hrvValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  unit: {
    color: "#444",
    fontSize: 10,
    fontWeight: "700",
  },
  statusText: {
    color: "#a58fff",
    fontSize: 7,
    fontWeight: "800",
    marginTop: 4,
  },
});

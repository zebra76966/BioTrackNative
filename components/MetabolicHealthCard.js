import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-wagmi-charts";

const { width } = Dimensions.get("window");

export default function MetabolicHealthCard({ data }) {
  const router = useRouter();

  if (!data?.graphData || data.graphData.length === 0) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons name="database-off-outline" size={32} color="#444" />
        </View>
        <Text style={styles.emptyTitle}>CGM NODE OFFLINE</Text>
        <Text style={styles.emptySubtitle}>No metabolic telemetry detected. Establish a secure link with Dexcom to begin AI analysis.</Text>
        <TouchableOpacity style={styles.connectBtn} onPress={() => router.push("/profile")}>
          <MaterialCommunityIcons name="link-variant" size={16} color="#000" />
          <Text style={styles.connectBtnText}>INITIALIZE CONNECTION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DOWNSAMPLING & PEAK DETECTION ---
  // --- SMART DOWNSAMPLING (PEAK PRESERVING) ---
  const rawData = data.graphData || [];

  const MAX_POINTS = 40; // 👈 tweak this (80–150 ideal)

  // sort first
  const sorted = rawData
    .map((d) => ({
      timestamp: new Date(d.time).getTime(),
      value: d.value,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sorted.length <= MAX_POINTS) {
    var chartData = sorted;
  } else {
    const bucketSize = Math.ceil(sorted.length / MAX_POINTS);

    const downsampled = [];

    for (let i = 0; i < sorted.length; i += bucketSize) {
      const bucket = sorted.slice(i, i + bucketSize);

      if (bucket.length === 0) continue;

      // pick MOST IMPORTANT point (max spike)
      let point = bucket[0];

      for (let j = 1; j < bucket.length; j++) {
        if (bucket[j].value > point.value) {
          point = bucket[j];
        }
      }

      downsampled.push(point);
    }

    chartData = downsampled.sort((a, b) => a.timestamp - b.timestamp).slice(-40); // 👈 HARD LIMIT
  }

  // Find Peak and Low for highlighting
  const values = chartData.map((d) => d.value);
  const peakValue = Math.max(...values);
  const lowValue = Math.min(...values);

  const { avgGlucose, timeInRange, variability, estimatedA1c } = data.summary;

  const stats = [
    { label: "AVG GLUCOSE", value: avgGlucose, unit: "mg/dL", icon: "water", color: "#ef4444" },
    { label: "TIME IN RANGE", value: timeInRange, unit: "%", icon: "check-circle-outline", color: "#22c55e" },
    { label: "VARIABILITY", value: variability, unit: "%", icon: "sine-wave", color: "#f59e0b" },
    { label: "EST. A1C", value: estimatedA1c, unit: "", icon: "trending-up", color: "#3b82f6" },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="heart-pulse" size={18} color="#a58fff" />
          <View>
            <Text style={styles.title}>METABOLIC STABILITY</Text>
            <Text style={styles.subtitle}>Last 24 hours activity</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: timeInRange > 80 ? "#22c55e20" : "#f59e0b20" }]}>
          <Text style={[styles.statusText, { color: timeInRange > 80 ? "#22c55e" : "#f59e0b" }]}>{timeInRange > 80 ? "OPTIMAL" : "STABILIZING"}</Text>
        </View>
      </View>

      {/* --- ENHANCED CHART WITH PEAKS & LOWS --- */}
      <View style={styles.chartWrapper}>
        <LineChart.Provider data={chartData}>
          <LineChart height={120} width={width - 72}>
            <LineChart.Path color="#a58fff" width={3}>
              <LineChart.Gradient color="#a58fff" />
            </LineChart.Path>

            {/* Target Range Guide Lines */}
            <LineChart.HorizontalLine at={{ value: 140 }} color="#222" strokeDasharray="5, 5" />
            <LineChart.HorizontalLine at={{ value: 70 }} color="#222" strokeDasharray="5, 5" />

            {/* Highlighting Points */}
            <LineChart.Dot at={chartData.findIndex((d) => d.value === peakValue)} color="#ef4444" hasPulse />
            <LineChart.Dot at={chartData.findIndex((d) => d.value === lowValue)} color="#3b82f6" />

            <LineChart.CursorCrosshair color="#a58fff">
              <LineChart.Tooltip style={styles.tooltip} textStyle={styles.tooltipText} />
              <LineChart.DatetimeText style={styles.datetimeText} />
            </LineChart.CursorCrosshair>
          </LineChart>
        </LineChart.Provider>

        {/* Legend for Peak/Low */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
            <Text style={styles.legendText}>PEAK: {peakValue}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
            <Text style={styles.legendText}>LOW: {lowValue}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: `${stat.color}15` }]}>
              <MaterialCommunityIcons name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.statValue}>{stat.value}</Text>
              {stat.unit ? <Text style={styles.statUnit}>{stat.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#222", marginBottom: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  titleContainer: { flexDirection: "row", gap: 10, flex: 1 },
  title: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { color: "#555", fontSize: 10, fontWeight: "600" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  statusText: { fontSize: 9, fontWeight: "900" },

  chartWrapper: {
    marginBottom: 20,
    backgroundColor: "#080808",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#151515",
    overflow: "hidden",
  },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 10, borderTopWidth: 1, borderTopColor: "#151515", paddingTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { color: "#444", fontSize: 9, fontWeight: "800" },
  dot: { width: 6, height: 6, borderRadius: 3 },

  tooltip: { backgroundColor: "#a58fff", borderRadius: 4, padding: 4 },
  tooltipText: { color: "#000", fontSize: 12, fontWeight: "900" },
  datetimeText: { color: "#3191ff", fontSize: 10, fontWeight: "700", marginTop: 10, textAlign: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  statBox: { width: "48%", backgroundColor: "#0A0A0A", borderRadius: 16, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#1A1A1A" },
  iconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  statLabel: { color: "#666", fontSize: 8, fontWeight: "700", marginBottom: 2 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
  statUnit: { color: "#444", fontSize: 9, fontWeight: "700" },

  emptyCard: { alignItems: "center", paddingVertical: 40, borderStyle: "dashed", borderColor: "#333" },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#1A1A1A" },
  emptyTitle: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  emptySubtitle: { color: "#555", fontSize: 11, textAlign: "center", lineHeight: 18, paddingHorizontal: 20, marginBottom: 25 },
  connectBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#a58fff", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  connectBtnText: { color: "#000", fontSize: 11, fontWeight: "900" },
});

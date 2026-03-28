import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { runOnJS } from "react-native-reanimated";
import { LineChart } from "react-native-wagmi-charts";

const { width } = Dimensions.get("window");

const METRICS = {
  steps: { label: "Steps", color: "#27ae60", icon: "walk", unit: "steps", goal: 10000 },
  calories: { label: "Calories", color: "#eb5757", icon: "fire", unit: "kcal", goal: 600 },
  distance: { label: "Distance", color: "#00BFFF", icon: "map-marker-distance", unit: "km", goal: 5000 },
};

export default function UnifiedActivityChart({ data }) {
  const [activeMetric, setActiveMetric] = useState("steps");
  const currentConfig = METRICS[activeMetric];

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      timestamp: new Date(d.date).getTime(),
      value: activeMetric === "distance" ? d.distance || 0 : d[activeMetric] || 0,
      sources: d.sources || [], // ✅ keep full array
    }));
  }, [data, activeMetric]);

  const [activeIndex, setActiveIndex] = useState(chartData?.length - 1);

  const goalPosition = useMemo(() => {
    if (chartData.length === 0) return 0;
    const maxValue = Math.max(...chartData.map((d) => d.value), currentConfig.goal);
    const chartHeight = 150;
    return chartHeight - (currentConfig.goal / maxValue) * chartHeight;
  }, [chartData, currentConfig.goal]);

  const handleToggle = (key) => {
    setActiveMetric(key);
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!data || data?.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ACTIVITY TRENDS</Text>
          <Text style={styles.subtitle}>
            GOAL: {currentConfig.goal.toLocaleString()} {currentConfig.unit}
          </Text>
        </View>
        <View style={styles.toggleRow}>
          {Object.keys(METRICS).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleToggle(key)}
              style={[styles.toggleBtn, activeMetric === key && { backgroundColor: currentConfig.color + "33", borderColor: currentConfig.color }]}
            >
              <MaterialCommunityIcons name={METRICS[key].icon} size={16} color={activeMetric === key ? currentConfig.color : "#444"} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart.Provider data={chartData}>
          {/* DYNAMIC SOURCE PILL */}
          <View style={styles.sourceBadgeContainer}>
            <View style={styles.sourcePill}>
              <LineChart.PriceText
                variant="value"
                style={{ width: 0, height: 0, opacity: 0 }} // hide text
                format={({ value }) => {
                  "worklet";

                  // find index based on value
                  const index = chartData.findIndex((d) => d.value === Number(value));

                  if (index !== -1) {
                    runOnJS(setActiveIndex)(index);
                  }

                  return "";
                }}
              />

              <View style={{ flexDirection: "row", gap: 4 }}>
                {chartData[activeIndex]?.sources?.includes("apple_health") && <MaterialCommunityIcons name="apple" size={10} color="#fcf0f0" />}

                {chartData[activeIndex]?.sources?.includes("google_fit") && <MaterialCommunityIcons name="google-fit" size={10} color="#4285F4" />}
              </View>
            </View>
          </View>

          <LineChart height={150} width={width - 72}>
            <LineChart.Path color={currentConfig.color} width={3}>
              <LineChart.Gradient color={currentConfig.color} />
            </LineChart.Path>
            <LineChart.CursorCrosshair color={currentConfig.color}>
              <LineChart.Tooltip textStyle={{ color: "white", fontWeight: "bold" }} backgroundColor={currentConfig.color} />
            </LineChart.CursorCrosshair>
          </LineChart>
        </LineChart.Provider>

        {/* GOAL LINE */}
        <View style={[styles.goalLine, { top: goalPosition, borderTopColor: currentConfig.color + "60" }]}>
          <Text style={[styles.goalLabel, { color: currentConfig.color }]}>GOAL</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>AVG</Text>
          <Text style={styles.statValue}>{Math.round(chartData.reduce((a, b) => a + b.value, 0) / chartData?.length).toLocaleString()}</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>PEAK</Text>
          <Text style={styles.statValue}>{Math.max(...chartData.map((d) => d.value)).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#121212", borderRadius: 20, padding: 18, marginBottom: 25, borderWidth: 1, borderColor: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { color: "#a58fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  subtitle: { color: "#555", fontSize: 9, fontWeight: "700", marginTop: 4 },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },
  chartWrapper: { position: "relative", marginTop: 10, minHeight: 150 },

  sourceBadgeContainer: { position: "absolute", top: -10, left: 0, zIndex: 10 },
  sourcePill: { backgroundColor: "#1a1a1a", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: "#333" },
  sourceText: { color: "#888", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },

  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  goalLabel: { fontSize: 8, fontWeight: "900", marginTop: -12, opacity: 0.6 },

  footer: { flexDirection: "row", gap: 25, marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  statGroup: { flexDirection: "column" },
  statLabel: { color: "#444", fontSize: 9, fontWeight: "800", marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

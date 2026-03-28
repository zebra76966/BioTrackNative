import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-wagmi-charts";
import { hormoneTrends } from "../data/hormoneTrendsData";
import { useSimulation } from "./SimulationContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const CHART_WIDTH = SCREEN_WIDTH - 80;

export default function HormoneTrendCard() {
  const { simulatedMarkers } = useSimulation();
  const [active, setActive] = useState("all");

  const hormoneKeys = useMemo(() => Object.keys(hormoneTrends || {}), []);

  const allChartData = useMemo(() => {
    const dataMap = {};
    hormoneKeys.forEach((key) => {
      const h = hormoneTrends[key];
      const marker = simulatedMarkers.find((m) => m.id === key);
      const liveValue = marker ? marker.value : h.data[h.data.length - 1];

      // Normalized logic for "All", raw for single
      const points = active === "all" ? [...h.normalized.slice(0, 6), marker ? ((liveValue - marker.min) / (marker.max - marker.min)) * 100 : h.normalized[6]] : [...h.data.slice(0, 6), liveValue];

      dataMap[key] = points.map((val, i) => ({
        timestamp: i,
        value: val,
      }));
    });
    return dataMap;
  }, [active, simulatedMarkers, hormoneKeys]);

  const primaryData = useMemo(() => {
    const key = active === "all" ? "trt" : active;
    return allChartData[key] || [];
  }, [active, allChartData]);

  const latestValue = useMemo(() => {
    if (primaryData.length === 0) return "--";
    return primaryData[primaryData.length - 1].value.toFixed(0);
  }, [primaryData]);

  const handleToggle = (key) => {
    setActive(key);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const activeConfig = hormoneTrends[active === "all" ? "trt" : active] || {};

  return (
    <View style={styles.card}>
      <LineChart.Provider data={primaryData}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>HORMONE TRENDS</Text>
            <Text style={styles.subtitle}>{active === "all" ? "OVERVIEW (NORMALIZED %)" : `${activeConfig.label} · ${activeConfig.unit}`}</Text>
          </View>

          <View style={[styles.valBox, { backgroundColor: active === "all" ? "#a58fff" : activeConfig.color }]}>
            {/* Base layer: Latest Value */}
            <Text style={styles.valText}>
              <LineChart.PriceText
                precision={0}
                format={({ value }) => {
                  "worklet";
                  // If scrubbing, show scrubbed value. If not, show latestValue.
                  const displayVal = value ? value : latestValue;
                  return `${displayVal}${active === "all" ? "%" : ""}`;
                }}
              />
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity onPress={() => handleToggle("all")} style={[styles.chip, active === "all" && styles.chipActive]}>
            <Text style={[styles.chipText, active === "all" && styles.chipTextActive]}>ALL</Text>
          </TouchableOpacity>
          {hormoneKeys.map((key) => (
            <TouchableOpacity key={key} onPress={() => handleToggle(key)} style={[styles.chip, active === key && { backgroundColor: hormoneTrends[key].color, borderColor: hormoneTrends[key].color }]}>
              <Text style={[styles.chipText, active === key && styles.chipTextActive]}>{hormoneTrends[key].label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chartWrapper}>
          <LineChart height={120} width={CHART_WIDTH}>
            {active === "all" ? (
              hormoneKeys.map((key) => (
                <LineChart.Path key={key} data={allChartData[key]} color={hormoneTrends[key].color} width={2}>
                  <LineChart.Gradient color={hormoneTrends[key].color} opacity={0.2} />
                </LineChart.Path>
              ))
            ) : (
              <LineChart.Path color={activeConfig.color} width={3}>
                <LineChart.Gradient color={activeConfig.color} opacity={0.4} />
              </LineChart.Path>
            )}

            {/* Removing Crosshair and Tooltip for a cleaner look unless explicitly needed */}
            <LineChart.CursorCrosshair color={active === "all" ? "#FFF" : activeConfig.color}>
              <LineChart.Tooltip backgroundColor={active === "all" ? "#1A1A1A" : activeConfig.color} textStyle={{ color: "#FFF", fontWeight: "bold" }} />
            </LineChart.CursorCrosshair>
          </LineChart>

          <View style={styles.labelRow}>
            {LABELS.map((l, i) => (
              <Text key={l} style={[styles.label, i === 6 && styles.latestLabel]}>
                {l === "Jul" ? "LATEST" : l.toUpperCase()}
              </Text>
            ))}
          </View>
        </View>
      </LineChart.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#0A0A0A", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#1A1A1A" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  title: { color: "#FFF", fontWeight: "900", fontSize: 11, letterSpacing: 1.5 },
  subtitle: { color: "#666", fontSize: 9, marginTop: 4, fontWeight: "800" },
  valBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, minWidth: 50, alignItems: "center", justifyContent: "center" },
  valText: { color: "#000", fontWeight: "900", fontSize: 14 },
  filterScroll: { flexDirection: "row", marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#111", marginRight: 8, borderWidth: 1, borderColor: "#222" },
  chipActive: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  chipText: { color: "#666", fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: "#000" },
  chartWrapper: { marginTop: 10, overflow: "hidden" },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  label: { color: "#333", fontSize: 9, fontWeight: "800" },
  latestLabel: { color: "#a58fff" },
});

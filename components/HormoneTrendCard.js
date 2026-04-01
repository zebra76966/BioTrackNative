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
  const hormoneKeys = useMemo(() => Object.keys(hormoneTrends || {}), []);

  // Set default to the first hormone key (e.g., "testosterone") instead of "all"
  const [active, setActive] = useState(hormoneKeys[0]);

  const chartData = useMemo(() => {
    const dataMap = {};
    hormoneKeys.forEach((key) => {
      const h = hormoneTrends[key];
      const marker = simulatedMarkers.find((m) => m.id === key);
      const liveValue = marker ? marker.value : h.data[h.data.length - 1];

      // Simplified logic: just handle the single view data
      const points = [...h.data.slice(0, 6), liveValue];

      dataMap[key] = points.map((val, i) => ({
        timestamp: i,
        value: val,
      }));
    });
    return dataMap;
  }, [simulatedMarkers, hormoneKeys]);

  const activeData = useMemo(() => chartData[active] || [], [active, chartData]);
  const activeConfig = hormoneTrends[active] || {};

  const latestValue = useMemo(() => {
    if (activeData.length === 0) return "--";
    return activeData[activeData.length - 1].value.toFixed(0);
  }, [activeData]);

  const handleToggle = (key) => {
    setActive(key);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.card}>
      <LineChart.Provider data={activeData}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>HORMONE TRENDS</Text>
            <Text style={styles.subtitle}>{`${activeConfig.label} · ${activeConfig.unit}`}</Text>
          </View>

          <View style={[styles.valBox, { backgroundColor: activeConfig.color }]}>
            <Text style={styles.valText}>
              <LineChart.PriceText
                precision={0}
                format={({ value }) => {
                  "worklet";
                  return value ? `${value}` : `${latestValue}`;
                }}
              />
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {hormoneKeys.map((key) => (
            <TouchableOpacity key={key} onPress={() => handleToggle(key)} style={[styles.chip, active === key && { backgroundColor: activeConfig.color, borderColor: activeConfig.color }]}>
              <Text style={[styles.chipText, active === key && styles.chipTextActive]}>{hormoneTrends[key].label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chartWrapper}>
          <LineChart height={120} width={CHART_WIDTH}>
            <LineChart.Path color={activeConfig.color} width={3}>
              <LineChart.Gradient color={activeConfig.color} opacity={0.4} />
            </LineChart.Path>

            <LineChart.CursorCrosshair color={activeConfig.color}>
              <LineChart.Tooltip backgroundColor={activeConfig.color} textStyle={{ color: "#FFF", fontWeight: "bold" }} />
            </LineChart.CursorCrosshair>
          </LineChart>

          <View style={styles.labelRow}>
            {LABELS.map((l, i) => (
              <Text key={l} style={[styles.label, i === 6 && { color: activeConfig.color }]}>
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
  chipText: { color: "#666", fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: "#000" },
  chartWrapper: { marginTop: 10, overflow: "hidden" },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  label: { color: "#333", fontSize: 9, fontWeight: "800" },
});

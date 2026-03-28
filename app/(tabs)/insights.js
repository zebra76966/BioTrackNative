import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../auth/api";
import ActionsCard from "../../components/ActionsCard";
import ConfidenceCard from "../../components/ConfidenceCard";
import ImpactList from "../../components/ImpactList";
import MarkerLabModal from "../../components/MarkerLabModal";
import MetabolicHealthCard from "../../components/MetabolicHealthCard";
import OverallHealthCard from "../../components/OverallHealthCard";

import HormoneTrendCard from "../../components/HormoneTrendCard";
import SimulatedHealthCard from "../../components/SimulatedHealthCard";

export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metabolicData, setMetabolicData] = useState(null);
  const [activityData, setActivityData] = useState(null); // New state for merged activity
  const [aiInsights, setAiInsights] = useState(null);
  const [labVisible, setLabVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetching metabolic, AI, AND the merged activity data
      const [metabolicRes, aiRes, activityRes] = await Promise.all([
        api.get("/insights/metabolic-full"),
        api.get("/insights/ai-generate"),
        api.get("/activity/merged", { params: { days: 1, mode: "smart" } }), // Just need today for the score
      ]);

      setMetabolicData(metabolicRes.data);
      setAiInsights(aiRes.data);
      setActivityData(activityRes.data);
    } catch (err) {
      console.error("Failed to fetch health insights", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract today's steps from the activity/merged response
  const todaySteps = activityData?.[activityData.length - 1]?.steps || 0;

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#a58fff" />
        <Text style={styles.loadingText}>GENERATING AI ANALYSIS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a58fff" />}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>HEALTH INSIGHTS</Text>
            <Text style={styles.subtitle}>AI-Powered Metabolic Analysis</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Marker Lab Trigger */}
            <TouchableOpacity style={styles.labBtn} onPress={() => setLabVisible(true)}>
              <MaterialCommunityIcons name="test-tube" size={18} color="#a58fff" />
            </TouchableOpacity>

            <View style={styles.aiBadge}>
              <MaterialCommunityIcons name="auto-fix" size={12} color="#000" />
              <Text style={styles.aiBadgeText}>AI VERIFIED</Text>
            </View>
          </View>
        </View>

        <OverallHealthCard score={aiInsights?.metabolicScore || 0} />

        <SimulatedHealthCard todaySteps={todaySteps} />
        <HormoneTrendCard />

        <Text style={styles.sectionLabel}>Metabolic Deep Dive</Text>

        <MetabolicHealthCard data={metabolicData} />

        <ConfidenceCard
          confidence={{
            value: aiInsights?.stabilityStatus === "Stable" ? 0.92 : 0.75,
            label: aiInsights?.stabilityStatus || "Analyzing",
            reason: aiInsights?.stabilityStatus === "Stable" ? "High data consistency from integrated sensors." : "Variability detected in recent patterns.",
          }}
        />

        <Text style={styles.sectionLabel}>RECOMMENDED PROTOCOLS</Text>
        <ActionsCard actions={aiInsights?.suggestedActions || []} />

        <View style={styles.impactContainer}>
          <ImpactList title="Negative Contributors" type="negative" items={aiInsights?.contributors?.filter((i) => i.type === "negative") || []} />
          <ImpactList title="Positive Contributors" type="positive" items={aiInsights?.contributors?.filter((i) => i.type === "positive") || []} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* The Lab Modal */}
      <MarkerLabModal visible={labVisible} onClose={() => setLabVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  scrollContent: { padding: 20 },
  loaderContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#a58fff", marginTop: 20, fontSize: 10, letterSpacing: 2, fontWeight: "800" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  headerActions: { alignItems: "flex-end", gap: 8 },
  labBtn: {
    backgroundColor: "#111",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: "#666", fontSize: 12, fontWeight: "600", marginTop: 2 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a58fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  aiBadgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
  sectionLabel: {
    color: "#a58fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 25,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  impactContainer: { marginTop: 10, gap: 15 },
});

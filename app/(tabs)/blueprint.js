import api from "@/auth/api";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CombinedBlueprintScreen() {
  const navigation = useNavigation();
  const [activePlan, setActivePlan] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute();

  const prepare = async () => {
    const token = await SecureStore.getItemAsync("jwt");
    if (token) {
      await Promise.all([fetchPlan(), fetchPulse()]);
    }
    setLoading(false);
  };

  useEffect(() => {
    prepare();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await api.get("/user/get-plan");
      const rawData = res.data.plan;
      if (!rawData) {
        setActivePlan(null);
        return;
      }
      const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
      setActivePlan({ ...data, createdAt: res.data.createdAt });
    } catch (err) {
      console.error("Plan Fetch error:", err);
      setActivePlan(null);
    }
  };

  const fetchPulse = async () => {
    try {
      const res = await api.get("/user/blueprint-comparison");
      setSuggestions(res.data.comparisons || []);
    } catch (err) {
      console.error("Pulse Fetch error:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.origin === "biobot") {
        prepare();
        navigation.setParams({ origin: null });
      }
    }, [route.params?.origin]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlan(), fetchPulse()]);
    setRefreshing(false);
  };

  const getIcon = (label, type) => {
    const l = label.toLowerCase();
    if (l.includes("step")) return <MaterialCommunityIcons name="walk" size={20} color={type === "danger" ? "#ef4444" : "#22c55e"} />;
    if (l.includes("glucose")) return <MaterialCommunityIcons name="water-outline" size={20} color="#f59e0b" />;
    return <Ionicons name="flash" size={20} color="#a58fff" />;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#a58fff" size="large" />
      </View>
    );
  }

  const sections = activePlan?.plan || activePlan?.sections || activePlan?.optimizationPlan || [];
  const hasBlueprint = sections.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a58fff" />}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Performance</Text>
            <Text style={styles.titleGold}>Blueprint</Text>
          </View>
          {hasBlueprint && (
            <View style={styles.statusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>LIVE SYNC</Text>
            </View>
          )}
        </View>

        {!hasBlueprint ? (
          /* EMPTY STATE */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-search-outline" size={40} color="#a58fff" />
            </View>
            <Text style={styles.emptyTitle}>No Protocol Found</Text>
            <Text style={styles.emptyDesc}>Your personalized performance blueprint hasn't been generated yet. Talk to BioBot to analyze your biomarkers.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate("biobot")}>
              <Text style={styles.ctaButtonText}>GENERATE WITH BIOBOT</Text>
              <Feather name="arrow-right" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ACTIVE BLUEPRINT CONTENT */
          <>
            {/* HORIZONTAL PULSE CARDS */}
            <View style={styles.pulseSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.pulseTitle}>METABOLIC PULSE</Text>
                <Text style={styles.pulseSubtitle}>BioTrack Logic</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pulseScroll}>
                {suggestions.map((item, i) => {
                  // 1. Capitalize the first letter (e.g., 'success' -> 'Success')
                  const typeKey = item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase();

                  return (
                    <View key={i} style={[styles.pulseCard]}>
                      <View style={styles.pulseCardHeader}>
                        <View style={[styles.pulseIconBox, styles[`icon${typeKey}`]]}>{getIcon(item.label, item.type)}</View>
                        <View style={[styles.badge, styles[`badge${typeKey}`]]}>
                          <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.pulseLabel}>{item.label}</Text>
                      <Text numberOfLines={2} style={styles.pulseMsg}>
                        {item.message}
                      </Text>
                      <View style={styles.pulseTipBox}>
                        <Text style={styles.pulseTipText}>{item.cta}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* TIMELINE SECTION */}
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineTitle}>DAILY PROTOCOL</Text>
              {sections.map((section, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.markerContainer}>
                    <View style={styles.markerNode} />
                    {idx !== sections.length - 1 && <View style={styles.markerLine} />}
                  </View>
                  <View style={styles.card}>
                    <View style={styles.timeRow}>
                      <Feather name="clock" size={14} color="#a58fff" />
                      <Text style={styles.sectionHeading}>{section.heading || section.timeBlock || "Phase " + (idx + 1)}</Text>
                    </View>
                    <View style={styles.actionList}>
                      {(section.actions || section.Actions || []).map((action, aIdx) => (
                        <View key={aIdx} style={styles.actionItem}>
                          <View style={styles.bullet} />
                          <Text style={styles.actionText}>{typeof action === "object" ? action.Description || action.task : action}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON - Only shows if blueprint exists */}
      {hasBlueprint && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("biobot")} activeOpacity={0.9}>
          <Ionicons name="sparkles" size={24} color="#000" />
          <MaterialCommunityIcons name="robot" size={20} color="#000" style={{ marginLeft: -4 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  centered: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 25, marginBottom: 20 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  titleGold: { color: "#a58fff", fontSize: 32, fontWeight: "900", marginTop: -10, letterSpacing: -1 },
  statusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#222" },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e", marginRight: 8 },
  statusText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  // Empty State Styles
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#111", justifyContent: "center", alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#222" },
  emptyTitle: { color: "#FFF", fontSize: 20, fontWeight: "800", marginBottom: 10 },
  emptyDesc: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 30 },
  ctaButton: { backgroundColor: "#a58fff", flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 25, borderRadius: 16, gap: 10 },
  ctaButtonText: { color: "#000", fontWeight: "900", fontSize: 12, letterSpacing: 0.5 },

  // FAB Style
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#a58fff",
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#a58fff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Pulse Merged Styles
  pulseSection: { marginBottom: 30 },
  sectionHeader: { paddingHorizontal: 25, marginBottom: 15 },
  pulseTitle: { color: "#FFF", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  pulseSubtitle: { color: "#666", fontSize: 10, fontWeight: "700" },
  pulseScroll: { paddingHorizontal: 25, gap: 12 },
  pulseCard: { backgroundColor: "#0a0a0a", width: 220, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#1a1a1a" },
  pulseCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pulseIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: "#000", fontSize: 7, fontWeight: "900" },
  pulseLabel: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  pulseMsg: { color: "#666", fontSize: 11, lineHeight: 16, marginBottom: 12, height: 32 },
  pulseTipBox: { backgroundColor: "#111", padding: 8, borderRadius: 8 },
  pulseTipText: { color: "#a58fff", fontSize: 10, fontWeight: "600" },

  badgeSuccess: { backgroundColor: "#22c55e" },
  badgeWarning: { backgroundColor: "#f59e0b" },
  badgeDanger: { backgroundColor: "#ef4444" },
  iconSuccess: { backgroundColor: "rgba(34, 197, 94, 0.1)" },
  iconWarning: { backgroundColor: "rgba(245, 158, 11, 0.1)" },
  iconDanger: { backgroundColor: "rgba(239, 68, 68, 0.1)" },

  // Timeline Styles
  timelineContainer: { paddingHorizontal: 25 },
  timelineTitle: { color: "#FFF", fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 20 },
  timelineItem: { flexDirection: "row", minHeight: 100 },
  markerContainer: { alignItems: "center", marginRight: 20, width: 20 },
  markerNode: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#a58fff", borderWidth: 2, borderColor: "#000", zIndex: 2 },
  markerLine: { flex: 1, width: 2, backgroundColor: "#1a1a1a", marginTop: -5, marginBottom: -5 },
  card: { flex: 1, backgroundColor: "#080808", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#111" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionHeading: { color: "#a58fff", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  actionList: { gap: 8 },
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#a58fff", marginTop: 8 },
  actionText: { color: "#888", fontSize: 13, lineHeight: 18, flex: 1 },
});

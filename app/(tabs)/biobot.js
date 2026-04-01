import api from "@/auth/api";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

export default function BioBotScreen() {
  const navigation = useNavigation(); // Hook initialization
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetching metabolic, AI, AND the merged activity data
      const [statusRes, activityRes] = await Promise.all([
        api.get("/devices/status"),
        api.get("/activity/merged", { params: { days: 1, mode: "smart" } }), // Just need today for the score
      ]);

      const hasNoDevices = !statusRes.data.apple && !statusRes.data.googlefit && !statusRes.data.dexcom && !statusRes.data.fitbit && !statusRes.data.oura;
      const hasNoData = !activityRes.data || activityRes.data.length === 0;

      setShowOnboarding(hasNoDevices || hasNoData);
    } catch (err) {
      console.error("Failed to fetch health insights", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const generateBlueprint = async () => {
    setLoading(true);
    setIsSaved(false);
    try {
      const res = await api.post("/ai/generate-plan");
      setResponse(res.data);

      console.log();
    } catch (err) {
      setResponse({ error: "Architect connection lost." });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = () => {
    // PASSING THE ORIGIN PARAMETER HERE
    if (isSaved) {
      navigation.navigate("blueprint", { origin: "biobot" });
      return;
    }

    Alert.alert("Confirm Overwrite", "This will replace your existing active blueprint on the main tab. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await api.post("/user/save-plan", { plan: JSON.stringify(response) });
            setIsSaved(true);
          } catch (err) {
            Alert.alert("Error", "System failed to save blueprint.");
          }
        },
      },
    ]);
  };

  const getPlanData = () => {
    if (!response) return [];
    const root = response["24_Hour_Optimization_Plan"] || response;
    return root.Plan || root.sections || root.plan || root.optimizationPlan || root.steps || [];
  };

  const [botUtlized, setBotUtlized] = useState(false);
  useEffect(() => {
    if (response?.aiSuggestion === "Our AI engine is currently resting. Please try again in a moment.") {
      setBotUtlized(true);
    } else {
      setBotUtlized(false);
    }
  }, [response]);

  useFocusEffect(
    useCallback(() => {
      setBotUtlized(false);
    }, []),
  );

  return (
    <View style={styles.container}>
      {/* ONBOARDING MODAL */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Animated.View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="access-point-network" size={42} color="#a58fff" />
            </Animated.View>
            <Text style={styles.modalTitle}>LINK REQUIRED</Text>
            <Text style={styles.modalSub}>Connect your Apple Health, Google Fit, Fitbit, or Oura Ring to begin biometric data synthesis.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowOnboarding(false);
                router.push("/(tabs)/profile");
              }}
            >
              <Text style={styles.modalBtnText}>INITIALIZE BIOMETRIC NODE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI BIO-BOT</Text>
          <Text style={styles.headerSubtitle}>Architect v3.0</Text>
        </View>
        <View style={styles.aiStatusPill}>
          <Ionicons name="sparkles" size={14} color="#a58fff" />
          <Text style={styles.aiStatusText}>ACTIVE ENGINE</Text>
        </View>
      </View>
      {botUtlized ? (
        <View style={{ padding: 10 }}>
          <View style={{ ...styles.aiStatusPill, padding: 3, marginTop: 10 }}>
            <Text style={{ ...styles.aiStatusText, fontSize: 18, color: "#a58fff" }}>
              {" "}
              <MaterialCommunityIcons name="robot-off-outline" size={18} color="#a58fff" /> Our AI engine is currently resting.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!response && !loading && (
            <View style={styles.welcomeContainer}>
              <View style={styles.robotIconContainer}>
                <MaterialCommunityIcons name="robot" size={50} color="#a58fff" />
              </View>
              <Text style={styles.welcomeTitle}>Ready to Optimize?</Text>
              <Text style={styles.welcomeDesc}>Our AI analyzes your current biometrics to craft a surgical performance protocol.</Text>

              <TouchableOpacity style={styles.magicButton} onPress={generateBlueprint}>
                <MaterialCommunityIcons name="magic-staff" size={24} color="#000" />
                <Text style={styles.magicButtonText}>Generate Blueprint</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#a58fff" size="large" />
              <Text style={styles.loadingText}>COMPILING METABOLIC DATA...</Text>
            </View>
          )}

          {response && !response.error && (
            <View>
              <View style={styles.planOverviewCard}>
                <Text style={styles.planTitle}>{response.planTitle || "Health Optimization Plan"}</Text>
                {response.dataInsights && (
                  <View style={styles.insightRow}>
                    {Object.entries(response.dataInsights).map(([key, val]) => (
                      <View key={key} style={styles.insightBadge}>
                        <Text style={styles.insightBadgeText}>{String(val)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {getPlanData().map((section, idx) => (
                <View key={idx} style={styles.planBlock}>
                  <View style={styles.blockHeader}>
                    <Feather name="clock" size={14} color="#a58fff" />
                    <Text style={styles.blockHeading}>{section.heading || section.time || section.Time_Block}</Text>
                  </View>
                  <View style={styles.actionList}>
                    {(section.Actions || section.actions)?.map((action, aIdx) => (
                      <View key={aIdx} style={styles.actionItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.actionItemText}>{typeof action === "object" ? action.Description || action.task : action}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {/* ACTION BUTTON: Switches context based on isSaved state */}
              <TouchableOpacity style={[styles.saveBtn, isSaved && styles.savedBtn]} onPress={handleSavePlan} activeOpacity={0.8}>
                <Feather name={isSaved ? "arrow-right-circle" : "bookmark"} size={18} color="#000" />
                <Text style={styles.saveBtnText}>{isSaved ? "VIEW IN BLUEPRINT" : "SAVE TO MAIN BLUEPRINT"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setResponse(null);
                  setIsSaved(false);
                }}
              >
                <Text style={styles.resetBtnText}>Discard & Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 25, marginBottom: 20 },
  headerTitle: { color: "#FFF", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { color: "#a58fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  aiStatusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#222", gap: 6 },
  aiStatusText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 60 },
  welcomeContainer: { marginTop: 40, alignItems: "center", backgroundColor: "#0A0A0A", borderRadius: 32, padding: 30, borderWidth: 1, borderColor: "#1A1A1A" },
  robotIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#a58fff10", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  welcomeTitle: { color: "#FFF", fontSize: 22, fontWeight: "800", marginBottom: 10 },
  welcomeDesc: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 30 },
  magicButton: { backgroundColor: "#a58fff", flexDirection: "row", paddingVertical: 18, paddingHorizontal: 30, borderRadius: 20, alignItems: "center", gap: 12 },
  magicButtonText: { color: "#000", fontWeight: "900", fontSize: 15 },
  planOverviewCard: { backgroundColor: "#0D0D0D", padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: "#1A1A1A" },
  planTitle: { color: "#FFF", fontSize: 20, fontWeight: "800", marginBottom: 12 },
  insightRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  insightBadge: { backgroundColor: "#a58fff20", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  insightBadgeText: { color: "#a58fff", fontSize: 10, fontWeight: "700" },
  planBlock: { marginBottom: 30, paddingLeft: 5 },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  blockHeading: { color: "#FFF", fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  actionList: { gap: 12 },
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#a58fff", marginTop: 8 },
  actionItemText: { color: "#999", fontSize: 14, lineHeight: 20, flex: 1 },
  saveBtn: { backgroundColor: "#a58fff", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 20, borderRadius: 20, gap: 10, marginTop: 10 },
  savedBtn: { backgroundColor: "#22c55e" },
  saveBtnText: { color: "#000", fontWeight: "900", fontSize: 15 },
  resetBtn: { marginTop: 20, alignItems: "center", padding: 10 },
  resetBtnText: { color: "#444", fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  loadingBox: { marginTop: 100, alignItems: "center" },
  loadingText: { color: "#a58fff", fontSize: 10, fontWeight: "800", marginTop: 25, letterSpacing: 2 },

  modalOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 25 },
  modalContent: { backgroundColor: "#080808", padding: 40, borderRadius: 40, alignItems: "center", borderWidth: 1, borderColor: "#a58fff33", width: "100%" },
  modalIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#a58fff10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#a58fff",
  },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 2, marginBottom: 12 },
  modalSub: { color: "#666", textAlign: "center", fontSize: 14, lineHeight: 22, marginBottom: 35, fontWeight: "500" },
  modalBtn: { backgroundColor: "#a58fff", paddingVertical: 18, borderRadius: 20, width: "100%", alignItems: "center" },
  modalBtnText: { color: "#000", fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  lockText: { color: "#333", fontSize: 9, fontWeight: "800", marginTop: 20, letterSpacing: 1 },
});

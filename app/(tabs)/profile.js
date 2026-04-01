import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";
import { initAppleHealth, syncAppleHealth } from "../../services/appleHealth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BACKEND_URL = "https://api.forge.ngo";
// const BACKEND_URL = "http://192.168.1.2:5000";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // UPDATED: Added oura to deviceStatus
  const [deviceStatus, setDeviceStatus] = useState({
    apple: false,
    googlefit: false,
    dexcom: false,
    fitbit: false,
    oura: false,
  });

  const [loadingStatus, setLoadingStatus] = useState(true);
  const router = useRouter();

  // RECALIBRATION STATES
  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Constants for selection
  const GOAL_OPTIONS = ["Weight Loss", "Muscle Gain", "Longevity", "Athletic Power", "Mental Focus", "Endurance"];
  const DIET_OPTIONS = ["Standard", "Vegan", "Vegetarian", "Keto", "Paleo", "Carnivore", "Pescatarian"];
  const ALLERGY_OPTIONS = ["Dairy", "Nuts", "Shellfish", "Gluten", "Soy", "Eggs", "Fish", "None"];

  const transitionTo = (step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setEditStep(step);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const loadUser = async () => {
    try {
      const res = await api.get("/me");

      console.log("Fetched user data:", res.data); // Debug log
      setUser(res.data);
      setEditForm(res.data);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data));
    } catch (e) {
      const u = await SecureStore.getItemAsync("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUser(parsed);
        setEditForm(parsed);
      }
    }
  };

  useEffect(() => {
    loadUser();
    fetchDeviceStatus();
  }, []);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        age: editForm.age ? parseInt(editForm.age) : null,
        height: editForm.height ? parseFloat(editForm.height) : null,
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
      };
      await api.post("/auth/update-profile", payload);

      // FIX: Update local state immediately so the UI reflects changes right away
      setUser(payload);

      // Update the disk cache
      await SecureStore.setItemAsync("user", JSON.stringify(payload));

      setIsEditing(false);
      setEditStep(1);

      await loadUser();
      Alert.alert("System Calibrated", "Operative parameters updated.");
    } catch (e) {
      Alert.alert("Update Failed", "Check network connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGoal = (g) => {
    let newGoals = [...(editForm.goals || [])];
    if (newGoals.includes(g)) {
      newGoals = newGoals.filter((item) => item !== g);
    } else if (newGoals.length < 3) {
      newGoals.push(g);
    }
    setEditForm({ ...editForm, goals: newGoals });
  };

  const toggleAllergy = (a) => {
    let newAllergies = [...(editForm.allergies || [])];
    if (newAllergies.includes(a)) {
      newAllergies = newAllergies.filter((item) => item !== a);
    } else {
      newAllergies.push(a);
    }
    setEditForm({ ...editForm, allergies: newAllergies });
  };
  // Helper to render profile rows
  const ProfileRow = ({ label, value, icon }) => (
    <View style={styles.profileRow}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name={icon} size={16} color="#a58fff" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, !value && styles.pendingValue]}>{value || "PENDING"}</Text>
    </View>
  );

  const fetchDeviceStatus = async () => {
    try {
      const res = await api.get("/devices/status");
      setDeviceStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch device status");
    } finally {
      setLoadingStatus(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeviceStatus();
    }, [fetchDeviceStatus]),
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    await SecureStore.deleteItemAsync("user");
    router.replace("/(auth)/login");
  };

  const runAppleSync = async () => {
    setIsSyncing(true);
    try {
      await initAppleHealth();
      await syncAppleHealth(30);
      fetchDeviceStatus();
      Alert.alert("Protocol Updated", "Apple Health biometrics synchronized.");
    } catch (e) {
      Alert.alert("Sync Failed", "Check HealthKit permissions in iOS Settings.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDirectConnect = async (provider) => {
    const token = await SecureStore.getItemAsync("jwt");
    const authUrl = `${BACKEND_URL}/auth/${provider}/?token=${token}&platform=mobile`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "iosbiotrackconnector://");
      if (result.type === "success") {
        fetchDeviceStatus();
        Alert.alert("Link Request Sent", `System is verifying ${provider} credentials.`);
      }
    } catch (error) {
      Alert.alert("Connection Error", `Could not initiate ${provider} protocol.`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Settings</Text>
        <Text style={styles.headerSubtitle}>Hardware & Operative Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
          <View style={styles.statusBadge} />
        </View>
        <Text style={styles.userName}>{user?.name || "Operative"}</Text>
        <Text style={styles.userEmail}>{user?.email || "internal.network.node"}</Text>
      </View>

      {/* NEW: OPERATIVE PROFILE SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Operative Parameters</Text>
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editLink}>RECALIBRATE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <ProfileRow label="Age" value={user?.age} icon="account-clock" />
          <ProfileRow label="Sex" value={user?.sex} icon="gender-male-female" />
          <ProfileRow label="Height" value={user?.height ? `${user.height} cm` : null} icon="human-male-height" />
          <ProfileRow label="Weight" value={user?.weight ? `${user.weight} kg` : null} icon="weight-kilogram" />
          <ProfileRow label="Diet" value={user?.diet} icon="food-apple" />

          <View style={styles.goalsContainer}>
            <Text style={styles.goalsLabel}>PRIMARY DIRECTIVES:</Text>
            <View style={styles.goalsList}>
              {user?.goals?.map((g, i) => (
                <View key={i} style={styles.goalPill}>
                  <Text style={styles.goalText}>{g.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Biometric Integrations</Text>
          {loadingStatus && <ActivityIndicator size="small" color="#a58fff" />}
        </View>

        {/* Apple Health */}
        {Platform.OS === "ios" && (
          <TouchableOpacity style={[styles.menuItem, deviceStatus.apple && styles.activeBorder]} onPress={runAppleSync} disabled={isSyncing}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#fff" }]}>
                <Ionicons name="logo-apple" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.menuText}>Apple Health</Text>
                <Text style={styles.statusSubtext}>{deviceStatus.apple ? "ACTIVE PROTOCOL" : "UNLINKED"}</Text>
              </View>
            </View>
            {isSyncing ? <ActivityIndicator size="small" color="#a58fff" /> : <MaterialIcons name="sync" size={20} color={deviceStatus.apple ? "#a58fff" : "#333"} />}
          </TouchableOpacity>
        )}

        {/* Google Fit */}

        <TouchableOpacity style={[styles.menuItem, deviceStatus.googlefit && styles.activeBorder]} onPress={() => handleDirectConnect("google")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#4285F4" }]}>
              <Ionicons name="logo-google" size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.menuText}>Google Cloud Fit</Text>
              <Text style={styles.statusSubtext}>{deviceStatus.googlefit ? "CONNECTED" : "ESTABLISH LINK"}</Text>
            </View>
          </View>
          <Ionicons name={deviceStatus.googlefit ? "checkmark-circle" : "add-circle-outline"} size={20} color={deviceStatus.googlefit ? "#a58fff" : "#444"} />
        </TouchableOpacity>

        {/* Fitbit Integration */}
        <TouchableOpacity style={[styles.menuItem, deviceStatus.fitbit && styles.activeBorder]} onPress={() => handleDirectConnect("fitbit")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#00B0B9" }]}>
              <MaterialCommunityIcons name="watch-variant" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.menuText}>Fitbit Hardware</Text>
              <Text style={styles.statusSubtext}>{deviceStatus.fitbit ? "NODE ACTIVE" : "ESTABLISH LINK"}</Text>
            </View>
          </View>
          <Ionicons name={deviceStatus.fitbit ? "checkmark-circle" : "add-circle-outline"} size={20} color={deviceStatus.fitbit ? "#a58fff" : "#444"} />
        </TouchableOpacity>

        {/* NEW: Oura Ring Integration */}
        <TouchableOpacity style={[styles.menuItem, deviceStatus.oura && styles.activeBorder]} onPress={() => handleDirectConnect("oura")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#fff" }]}>
              <MaterialCommunityIcons name="ring" size={18} color="#000" />
            </View>
            <View>
              <Text style={styles.menuText}>Oura Ring</Text>
              <Text style={styles.statusSubtext}>{deviceStatus.oura ? "SLEEP LAB ACTIVE" : "ESTABLISH LINK"}</Text>
            </View>
          </View>
          <Ionicons name={deviceStatus.oura ? "checkmark-circle" : "add-circle-outline"} size={20} color={deviceStatus.oura ? "#a58fff" : "#444"} />
        </TouchableOpacity>

        {/* Dexcom */}
        <TouchableOpacity style={[styles.menuItem, deviceStatus.dexcom && styles.activeBorder]} onPress={() => handleDirectConnect("dexcom")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#FF8C00" }]}>
              <MaterialCommunityIcons name="water" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.menuText}>Dexcom CGM</Text>
              <Text style={styles.statusSubtext}>{deviceStatus.dexcom ? "STREAMING" : "ESTABLISH LINK"}</Text>
            </View>
          </View>
          <Ionicons name={deviceStatus.dexcom ? "checkmark-circle" : "add-circle-outline"} size={20} color={deviceStatus.dexcom ? "#a58fff" : "#444"} />
        </TouchableOpacity>

        {/* QR Scanner Connection */}
        {Platform.OS === "ios" && (
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/qr-scanner")}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#a58fff" }]}>
                <MaterialCommunityIcons name="qrcode-scan" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.menuText}>Apple Terminal Sync</Text>
                <Text style={styles.statusSubtext}>SCAN WEBAPP QR CODE</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Session Management</Text>
        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={[styles.menuText, { color: "#ef4444" }]}>Terminate Session</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>BIOTRACK SYSTEM v1.0.6 | SECURE BUILD</Text>

      {/* EDIT MODAL */}
      <Modal visible={isEditing} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RECALIBRATION: STEP {editStep}/4</Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${(editStep / 4) * 100}%` }]} />
              </View>
            </View>

            <Animated.View style={{ opacity: fadeAnim, flexShrink: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* STEP 1: VITALS */}
                {editStep === 1 && (
                  <View>
                    <Text style={styles.stepLabel}>BIOMETRIC DATA</Text>
                    <Input label="AGE" value={editForm.age?.toString()} onChange={(t) => setEditForm({ ...editForm, age: t })} keyboardType="numeric" />
                    <Input label="WEIGHT (KG)" value={editForm.weight?.toString()} onChange={(t) => setEditForm({ ...editForm, weight: t })} keyboardType="numeric" />
                    <Input label="HEIGHT (CM)" value={editForm.height?.toString()} onChange={(t) => setEditForm({ ...editForm, height: t })} keyboardType="numeric" />

                    <TouchableOpacity style={styles.saveBtn} onPress={() => transitionTo(2)}>
                      <Text style={styles.saveBtnText}>NEXT PHASE</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* STEP 2: GOALS */}
                {editStep === 2 && (
                  <View>
                    <Text style={styles.stepLabel}>PRIMARY DIRECTIVES (MAX 3)</Text>
                    <View style={styles.chipGrid}>
                      {GOAL_OPTIONS.map((g) => (
                        <TouchableOpacity key={g} style={[styles.chip, editForm.goals?.includes(g) && styles.chipActive]} onPress={() => toggleGoal(g)}>
                          <Text style={[styles.chipText, editForm.goals?.includes(g) && styles.chipTextActive]}>{g.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.modalFooterRow}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => transitionTo(1)}>
                        <Text style={styles.backBtnText}>BACK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={() => transitionTo(3)}>
                        <Text style={styles.saveBtnText}>NEXT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STEP 3: NUTRITION */}
                {editStep === 3 && (
                  <View>
                    <Text style={styles.stepLabel}>DIETARY PROTOCOL</Text>
                    <View style={styles.chipGrid}>
                      {DIET_OPTIONS.map((d) => (
                        <TouchableOpacity key={d} style={[styles.chip, editForm.diet === d && styles.chipActive]} onPress={() => setEditForm({ ...editForm, diet: d })}>
                          <Text style={[styles.chipText, editForm.diet === d && styles.chipTextActive]}>{d.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.modalFooterRow}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => transitionTo(2)}>
                        <Text style={styles.backBtnText}>BACK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={() => transitionTo(4)}>
                        <Text style={styles.saveBtnText}>NEXT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STEP 4: ALLERGIES */}
                {editStep === 4 && (
                  <View>
                    <Text style={styles.stepLabel}>BIOLOGICAL ADVERSARIES (ALLERGIES)</Text>
                    <View style={styles.chipGrid}>
                      {ALLERGY_OPTIONS.map((a) => (
                        <TouchableOpacity key={a} style={[styles.chip, editForm.allergies?.includes(a) && styles.chipActive]} onPress={() => toggleAllergy(a)}>
                          <Text style={[styles.chipText, editForm.allergies?.includes(a) && styles.chipTextActive]}>{a.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isSaving}>
                      <Text style={styles.saveBtnText}>{isSaving ? "SYNCING..." : "COMMIT CHANGES"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => transitionTo(3)}>
                      <Text style={styles.cancelText}>PREVIOUS STEP</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </Animated.View>

            <TouchableOpacity
              style={styles.abortContainer}
              onPress={() => {
                setIsEditing(false);
                setEditStep(1);
              }}
            >
              <Text style={styles.abortText}>ABORT CALIBRATION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const Input = ({ label, value, onChange, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholderTextColor="#333" {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 30 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  headerSubtitle: { color: "#a58fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 },
  profileSection: { alignItems: "center", marginBottom: 40 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#111", justifyContent: "center", alignItems: "center", marginBottom: 15, borderWidth: 1, borderColor: "#a58fff" },
  statusBadge: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: "#a58fff", position: "absolute", bottom: 5, right: 5, borderWidth: 2, borderColor: "#000" },
  avatarText: { color: "#a58fff", fontSize: 36, fontWeight: "900" },
  userName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  userEmail: { color: "#666", fontSize: 13, marginTop: 4, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  section: { paddingHorizontal: 25, marginBottom: 35 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionLabel: { color: "#a58fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#080808",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 12,
  },
  activeBorder: { borderColor: "#a58fff50", backgroundColor: "#0a0a05" },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  menuText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statusSubtext: { color: "#444", fontSize: 9, fontWeight: "800", marginTop: 2 },
  logoutBtn: { borderColor: "#ef444430", marginTop: 5 },
  version: { textAlign: "center", color: "#333", fontSize: 9, fontWeight: "700", marginTop: 20, marginBottom: 40, letterSpacing: 1 },

  profileCard: { backgroundColor: "#080808", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#1a1a1a" },
  profileRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#111", paddingBottom: 10 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { color: "#666", fontSize: 12, fontWeight: "700" },
  rowValue: { color: "#fff", fontSize: 13, fontWeight: "900" },
  pendingValue: { color: "#ef4444", fontSize: 10, letterSpacing: 1 },

  goalsContainer: { marginTop: 10 },
  goalsLabel: { color: "#a58fff", fontSize: 9, fontWeight: "900", marginBottom: 8 },
  goalsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  goalPill: { backgroundColor: "#a58fff15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#a58fff30" },
  goalText: { color: "#a58fff", fontSize: 9, fontWeight: "900" },

  // Modal Styling
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: SCREEN_WIDTH * 0.9, backgroundColor: "#050505", borderRadius: 30, padding: 25, borderWidth: 1, borderColor: "#a58fff40", maxHeight: "80%" },
  modalHeader: { marginBottom: 20 },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  miniProgressBar: { height: 2, backgroundColor: "#111", marginTop: 10, borderRadius: 1 },
  miniProgressFill: { height: "100%", backgroundColor: "#a58fff" },

  // Step Content
  stepLabel: { color: "#a58fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 20, textAlign: "center" },
  inputGroup: { marginBottom: 15 },
  inputLabel: { color: "#a58fff", fontSize: 9, fontWeight: "900", marginBottom: 6 },
  input: { backgroundColor: "#080808", borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 12, padding: 15, color: "#fff", fontSize: 16, fontWeight: "700" },

  // Grid/Chips (Ported from signup.js)
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { flexBasis: "48%", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1a1a1a", backgroundColor: "#080808", alignItems: "center" },
  chipActive: { borderColor: "#a58fff", backgroundColor: "#a58fff15" },
  chipText: { color: "#444", fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: "#a58fff" },

  // Buttons
  saveBtn: { backgroundColor: "#a58fff", paddingVertical: 18, borderRadius: 15, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "#000", fontWeight: "900", letterSpacing: 1, fontSize: 14 },
  modalFooterRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  backBtn: { flex: 1, borderWidth: 1, borderColor: "#222", borderRadius: 15, justifyContent: "center", alignItems: "center" },
  backBtnText: { color: "#666", fontWeight: "800", fontSize: 12 },

  abortContainer: { marginTop: 25, borderTopWidth: 1, borderTopColor: "#111", paddingTop: 15 },
  abortText: { color: "#ef4444", textAlign: "center", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  cancelText: { color: "#666", textAlign: "center", fontSize: 10, fontWeight: "800", marginTop: 20, textTransform: "uppercase", letterSpacing: 1 },
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 30 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  headerSubtitle: { color: "#a58fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 },
  profileSection: { alignItems: "center", marginBottom: 40 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#111", justifyContent: "center", alignItems: "center", marginBottom: 15, borderWidth: 1, borderColor: "#a58fff" },
  statusBadge: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: "#a58fff", position: "absolute", bottom: 5, right: 5, borderWidth: 2, borderColor: "#000" },
  avatarText: { color: "#a58fff", fontSize: 36, fontWeight: "900" },
  userName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  userEmail: { color: "#666", fontSize: 13, marginTop: 4, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  section: { paddingHorizontal: 25, marginBottom: 35 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionLabel: { color: "#a58fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#080808",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 12,
  },
  activeBorder: { borderColor: "#a58fff50", backgroundColor: "#0a0a05" },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  menuText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statusSubtext: { color: "#444", fontSize: 9, fontWeight: "800", marginTop: 2 },
  logoutBtn: { borderColor: "#ef444430", marginTop: 5 },
  version: { textAlign: "center", color: "#333", fontSize: 9, fontWeight: "700", marginTop: 20, marginBottom: 40, letterSpacing: 1 },
  profileCard: { backgroundColor: "#080808", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#1a1a1a" },
  profileRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#111", paddingBottom: 10 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { color: "#666", fontSize: 12, fontWeight: "700" },
  rowValue: { color: "#fff", fontSize: 13, fontWeight: "900" },
  pendingValue: { color: "#ef4444", fontSize: 10, letterSpacing: 1 },
  editLink: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    backgroundColor: "#a58fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a58fff30",
  },
  goalsContainer: { marginTop: 10 },
  goalsLabel: { color: "#a58fff", fontSize: 9, fontWeight: "900", marginBottom: 8 },
  goalsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  goalPill: { backgroundColor: "#a58fff15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#a58fff30" },
  goalText: { color: "#a58fff", fontSize: 9, fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: SCREEN_WIDTH * 0.9, backgroundColor: "#050505", borderRadius: 30, padding: 25, borderWidth: 1, borderColor: "#a58fff40", maxHeight: "80%" },
  modalHeader: { marginBottom: 20 },
  modalTitle: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  miniProgressBar: { height: 2, backgroundColor: "#111", marginTop: 10, borderRadius: 1 },
  miniProgressFill: { height: "100%", backgroundColor: "#a58fff" },
  stepLabel: { color: "#a58fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 20, textAlign: "center" },
  inputGroup: { marginBottom: 15 },
  inputLabel: { color: "#a58fff", fontSize: 9, fontWeight: "900", marginBottom: 6 },
  input: { backgroundColor: "#080808", borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 12, padding: 15, color: "#fff", fontSize: 16, fontWeight: "700" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { flexBasis: "48%", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1a1a1a", backgroundColor: "#080808", alignItems: "center" },
  chipActive: { borderColor: "#a58fff", backgroundColor: "#a58fff15" },
  chipText: { color: "#444", fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: "#a58fff" },
  saveBtn: { backgroundColor: "#a58fff", paddingVertical: 18, borderRadius: 15, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "#000", fontWeight: "900", letterSpacing: 1, fontSize: 14 },
  modalFooterRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  backBtn: { flex: 1, borderWidth: 1, borderColor: "#222", borderRadius: 15, justifyContent: "center", alignItems: "center" },
  backBtnText: { color: "#666", fontWeight: "800", fontSize: 12 },
  abortContainer: { marginTop: 25, borderTopWidth: 1, borderTopColor: "#111", paddingTop: 15 },
  abortText: { color: "#ef4444", textAlign: "center", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});

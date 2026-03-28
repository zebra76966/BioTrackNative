import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";
import { initAppleHealth, syncAppleHealth } from "../../services/appleHealth";

const BACKEND_URL = "http://api.forge.ngo";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({ apple: false, googlefit: false, dexcom: false });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    fetchDeviceStatus();
  }, []);

  const loadUser = async () => {
    const u = await SecureStore.getItemAsync("user");
    if (u) setUser(JSON.parse(u));
  };

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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    await SecureStore.deleteItemAsync("user");
    router.replace("/(auth)/login");
  };

  const runAppleSync = async () => {
    setIsSyncing(true);
    try {
      await initAppleHealth();
      await syncAppleHealth(7);
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Biometric Integrations</Text>
          {loadingStatus && <ActivityIndicator size="small" color="#a58fff" />}
        </View>

        {/* Apple Health */}
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

        {/* QR Scanner Connection */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/qr-scanner")} // Ensure this matches your file path
        >
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

      <Text style={styles.version}>BIOTRACK SYSTEM v1.0.4 | SECURE BUILD</Text>
    </ScrollView>
  );
}
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
});

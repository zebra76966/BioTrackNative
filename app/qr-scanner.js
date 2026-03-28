import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../auth/api";
import { initAppleHealth, syncAppleHealth } from "../services/appleHealth";

export default function QRScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const scanLine = useRef(new Animated.Value(0)).current;
  const scanLock = useRef(false);

  useEffect(() => {
    if (!permission) requestPermission();

    Animated.loop(
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  }, [permission]);

  const handleScan = async ({ data }) => {
    if (scanLock.current || !data) return;

    // 1. Identify the token
    let token = null;

    if (data.includes("token=")) {
      // Case: Data is a full URL (e.g., iosbiotrackconnector://auth?token=XYZ)
      token = data.split("token=")[1]?.split("&")[0];
    } else if (data.length > 30 && !data.includes(" ")) {
      // Case: Data is the raw 32-character hex token itself
      token = data;
    }

    if (!token) return; // Not a valid BioTrack QR, keep scanning

    scanLock.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      setLoading(true);

      // 2. Exchange token for JWT
      const res = await api.post("/auth/qr/exchange", { token });
      const { jwt, user } = res.data;

      // 3. Update Local Storage & API Header
      // await SecureStore.setItemAsync("jwt", jwt);
      // await SecureStore.setItemAsync("user", JSON.stringify(user));
      api.defaults.headers.Authorization = `Bearer ${jwt}`;

      // 4. THE SYNC LOGIC
      // We must init to get permissions, then sync to push data to backend
      await initAppleHealth();
      await syncAppleHealth(7);

      router.replace("/(tabs)/profile");
    } catch (e) {
      console.error("QR Sync Logic Error:", e.message);
      alert("Sync failed. The token may be expired (60s limit).");

      // Unlock after delay to allow re-scanning
      setTimeout(() => {
        scanLock.current = false;
        setScanned(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera Access Required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={handleScan} />

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <View style={styles.frame}>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLine.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 260],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        <Text style={styles.hintTitle}>BioTrack Terminal Sync</Text>
        <Text style={styles.hintSub}>Align QR code within the frame</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a58fff" />
          <Text style={styles.loadingText}>Establishing Secure Link...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  frame: {
    width: 260,
    height: 260,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#a58fff",
    backgroundColor: "rgba(165, 143, 255, 0.05)",
    overflow: "hidden",
  },
  scanLine: {
    height: 3,
    width: "100%",
    backgroundColor: "#a58fff",
    shadowColor: "#a58fff",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  hintTitle: { color: "#fff", marginTop: 30, fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  hintSub: { color: "#a58fff", marginTop: 8, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  loadingContainer: { position: "absolute", bottom: 100, width: "100%", alignItems: "center" },
  loadingText: { color: "#a58fff", marginTop: 12, fontWeight: "700", fontSize: 14 },
  errorText: { color: "#fff", marginBottom: 20 },
  btn: { padding: 15, backgroundColor: "#a58fff", borderRadius: 12 },
  btnText: { fontWeight: "bold" },
});

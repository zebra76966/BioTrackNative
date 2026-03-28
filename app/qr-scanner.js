import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, TouchableOpacity, View } from "react-native";
import api from "../auth/api";
import { syncAppleHealth } from "../services/appleHealth";

export default function QRScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const scanLock = useRef(false);

  const handleScan = async ({ data }) => {
    if (scanLock.current) return;

    if (!data.startsWith("iosbiotrackconnector://auth")) return;

    scanLock.current = true; // 🔒 HARD LOCK
    setScanned(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      setLoading(true);

      const url = new URL(data);
      const token = url.searchParams.get("token");

      if (!token) throw new Error("Invalid QR");

      const res = await api.post("/auth/qr/exchange", { token });

      const { jwt, user } = res.data;

      await SecureStore.setItemAsync("jwt", jwt);
      await SecureStore.setItemAsync("user", JSON.stringify(user));

      api.defaults.headers.Authorization = `Bearer ${jwt}`;

      await syncAppleHealth(7);

      router.replace("/success");
    } catch (e) {
      console.log("QR ERROR:", e?.response?.data || e.message);

      alert("Connection failed: " + (e?.response?.data?.error || e.message || "Unknown error"));

      // 🔥 DO NOT instantly unlock → delay it
      setTimeout(() => {
        scanLock.current = false;
        setScanned(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={handleScan} />

      {/* 🔥 PREMIUM OVERLAY */}
      {/* <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject }} /> */}

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* FRAME */}
        <View
          style={{
            width: 260,
            height: 260,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#22c55e",
            overflow: "hidden",
          }}
        >
          {/* SCAN LINE */}
          <Animated.View
            style={{
              height: 2,
              width: "100%",
              backgroundColor: "#22c55e",
              transform: [
                {
                  translateY: scanLine.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 260],
                  }),
                },
              ],
            }}
          />
        </View>

        <Text style={{ color: "#fff", marginTop: 20, fontSize: 16 }}>Scan BioTrack QR</Text>

        <Text style={{ color: "#94a3b8", marginTop: 6 }}>Connect your iPhone securely</Text>
      </View>

      {/* LOADING */}
      {loading && (
        <View style={{ position: "absolute", bottom: 120, width: "100%", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ color: "#fff", marginTop: 8 }}>Connecting...</Text>
        </View>
      )}
    </View>
  );
}

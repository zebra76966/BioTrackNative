import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
// 1. IMPORT THE GESTURE HANDLER
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SimulationProvider } from "../components/SimulationContext";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const updateAuthStatus = async () => {
    const token = await SecureStore.getItemAsync("jwt");
    setHasToken(!!token);
    setIsReady(true);
  };

  useEffect(() => {
    updateAuthStatus();
  }, [segments]);

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!hasToken && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (hasToken && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [hasToken, isReady, segments]);

  if (!isReady)
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}>
        <ActivityIndicator color="#a58fff" />
      </View>
    );

  // 2. WRAP EVERYTHING IN GESTUREHANDLERROOTVIEW
  return (
    <SimulationProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" options={{ animation: "fade" }} />
          <Stack.Screen name="(auth)/signup" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        </Stack>
      </GestureHandlerRootView>
    </SimulationProvider>
  );
}

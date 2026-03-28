import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function SuccessScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await SecureStore.getItemAsync("user");
        if (u) setUser(JSON.parse(u));
      } catch (err) {
        console.log("Error loading user:", err);
      }
    };

    loadUser();

    const timer = setTimeout(() => {
      router.replace("/");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="checkmark-circle" size={90} color="#22c55e" />

      <Text
        style={{
          color: "#fff",
          fontSize: 24,
          fontWeight: "700",
          marginTop: 20,
        }}
      >
        Connected
      </Text>

      {user && <Text style={{ color: "#94a3b8", marginTop: 10 }}>Connected as {user.email}</Text>}

      <Text style={{ color: "#94a3b8", marginTop: 8 }}>Apple Health synced successfully</Text>
    </View>
  );
}

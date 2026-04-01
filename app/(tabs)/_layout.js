import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0a0a0a", borderTopColor: "#1a1a1a", height: 90, padddingBottom: Platform.OS === "ios" ? 0 : 15, marginBottom: Platform.OS === "ios" ? 0 : 2 },
        tabBarActiveTintColor: "#a58fff",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Ionicons name="flame-sharp" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <MaterialIcons name="insights" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="blueprint"
        options={{
          title: "Blueprint",
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biobot"
        options={{
          title: "BioBot",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="robot-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Biometrics",
          tabBarIcon: ({ color }) => <Ionicons name="fitness" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

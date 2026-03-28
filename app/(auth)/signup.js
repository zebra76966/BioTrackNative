import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";

export default function Signup() {
  const [form, setForm] = useState({ email: "", password: "", name: "", goal: "Weight Loss" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Inside Signup.tsx handleSignup
  const handleSignup = async () => {
    if (!form.email || !form.password) return alert("Please fill required fields");
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      await SecureStore.setItemAsync("jwt", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));

      // Direct to tabs after successful account creation
      router.replace("/(tabs)");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>BIOTRACK</Text>
        <Text style={styles.subtitle}>Create Operative Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput placeholder="e.g. John Doe" placeholderTextColor="#444" style={styles.input} onChangeText={(t) => setForm({ ...form, name: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput placeholder="name@agency.com" placeholderTextColor="#444" style={styles.input} autoCapitalize="none" onChangeText={(t) => setForm({ ...form, email: t })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Security Password</Text>
          <TextInput placeholder="••••••••" placeholderTextColor="#444" secureTextEntry style={styles.input} onChangeText={(t) => setForm({ ...form, password: t })} />
        </View>

        <Text style={styles.label}>Primary Performance Goal</Text>
        <View style={styles.goalRow}>
          {["Weight Loss", "Muscle Gain", "Longevity"].map((g) => (
            <TouchableOpacity key={g} style={[styles.goalBadge, form.goal === g && styles.activeGoal]} onPress={() => setForm({ ...form, goal: g })}>
              <Text style={[styles.goalText, form.goal === g && styles.activeGoalText]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "INITIALIZING..." : "CREATE PROFILE"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>Already have a profile? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  inner: { padding: 30, paddingTop: 100 },
  logo: { color: "#a58fff", fontSize: 32, fontWeight: "900", letterSpacing: 4, textAlign: "center" },
  subtitle: { color: "#888", textAlign: "center", marginBottom: 40, marginTop: 10, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 },
  inputGroup: { marginBottom: 20 },
  label: { color: "#a58fff", fontSize: 10, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: "#111", padding: 16, borderRadius: 12, color: "#fff", borderWidth: 1, borderColor: "#222" },
  goalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  goalBadge: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#333", flex: 0.32, alignItems: "center" },
  activeGoal: { borderColor: "#a58fff", backgroundColor: "#a58fff20" },
  goalText: { color: "#666", fontSize: 11, fontWeight: "600" },
  activeGoalText: { color: "#a58fff" },
  btn: {
    backgroundColor: "#a58fff",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#a58fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnText: { color: "#000", fontWeight: "800", letterSpacing: 1 },
  link: { color: "#555", textAlign: "center", marginTop: 25, fontSize: 13 },
});

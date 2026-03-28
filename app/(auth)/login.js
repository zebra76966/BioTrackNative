import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Inside Login.tsx handleLogin
  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      await SecureStore.setItemAsync("jwt", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));

      // Use the absolute path to the tabs group
      router.replace("/(tabs)");
    } catch (err) {
      if (err.response) {
        console.log("Server Error Data:", err.response.data);
        alert(`Error: ${err.response.data.message || "Invalid Credentials"}`);
      } else if (err.request) {
        console.log("No response received. Check your URL/HTTPS.");
        alert("Network Error: Could not reach the server.");
      } else {
        console.log("Error message:", err.message);
      }

      alert("Invalid Credentials", err);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.logo}>BIOTRACK</Text>
        <Text style={styles.subtitle}>Performance Protocol Login</Text>

        <TextInput placeholder="Email" placeholderTextColor="#666" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" placeholderTextColor="#666" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>INITIALIZE SESSION</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.link}>Create new operative profile</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  inner: { flex: 1, justifyContent: "center", padding: 30 },
  logo: { color: "#a58fff", fontSize: 32, fontWeight: "900", letterSpacing: 4, textAlign: "center" },
  subtitle: { color: "#888", textAlign: "center", marginBottom: 40, marginTop: 10, textTransform: "uppercase", fontSize: 12 },
  input: { backgroundColor: "#1a1a1a", padding: 18, borderRadius: 12, color: "#fff", marginBottom: 15, borderWidth: 1, borderColor: "#333" },
  btn: { backgroundColor: "#a58fff", padding: 18, borderRadius: 12, marginTop: 10, alignItems: "center" },
  btnText: { color: "#000", fontWeight: "800", letterSpacing: 1 },
  link: { color: "#888", textAlign: "center", marginTop: 25, fontSize: 13 },
});

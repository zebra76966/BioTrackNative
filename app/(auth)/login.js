import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter all credentials.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      await SecureStore.setItemAsync("jwt", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));
      router.replace("/(tabs)");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Protocol Authentication Failed";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        {/* Top Branding Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadge}>
            <Feather name="shield" size={32} color="#a58fff" />
          </View>
          <Text style={styles.logo}>BIOTRACK</Text>
          <Text style={styles.subtitle}>Secure Node Authentication</Text>
        </View>

        {/* Input Section */}
        <View style={styles.formSection}>
          <Input label="Access Identification" icon="mail" placeholder="operative@agency.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Input label="Security Passkey" icon="lock" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>INITIALIZE SESSION</Text>}
          </TouchableOpacity>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.link}>
              Request new <Text style={styles.linkHighlight}>operative profile</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Reusable Internal Input for consistent styling
const Input = ({ label, icon, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Feather name={icon} size={16} color="#a58fff" style={styles.inputIcon} />
      <TextInput placeholderTextColor="#444" style={styles.input} {...props} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 30 },

  headerSection: { alignItems: "center", marginBottom: 50 },
  logoBadge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#a58fff30",
    marginBottom: 20,
  },
  logo: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 6 },
  subtitle: { color: "#a58fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 2, marginTop: 8 },

  formSection: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: "#444", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080808",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, color: "#fff", fontSize: 15, fontWeight: "600" },

  btn: {
    backgroundColor: "#a58fff",
    padding: 20,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#a58fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#000", fontWeight: "900", letterSpacing: 1.5, fontSize: 13 },

  footer: { marginTop: 20 },
  link: { color: "#444", textAlign: "center", fontSize: 12, fontWeight: "700" },
  linkHighlight: { color: "#a58fff" },
});

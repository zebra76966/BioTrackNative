import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useRef, useState } from "react";
import { Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../auth/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    goals: [], // Up to 3
    age: "",
    sex: "Male",
    height: "",
    weight: "",
    diet: "Standard",
    allergies: [],
  });

  const nextStep = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep((s) => s + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const prevStep = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep((s) => s - 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleFinalSignup = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
      };

      const res = await api.post("/auth/signup", payload);

      await SecureStore.setItemAsync("jwt", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));
      router.replace("/(tabs)");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicator}>STEP {step} OF 4</Text>
      </View>

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {step === 1 && <AccountStep form={form} setForm={setForm} onNext={nextStep} />}
          {step === 2 && <GoalStep form={form} setForm={setForm} onNext={nextStep} onSkip={handleFinalSignup} onBack={prevStep} />}
          {step === 3 && <VitalStep form={form} setForm={setForm} onNext={nextStep} onBack={prevStep} />}
          {step === 4 && <NutritionStep form={form} setForm={setForm} onSubmit={handleFinalSignup} loading={loading} onBack={prevStep} />}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/** STEP 1: ACCOUNT DETAILS **/
const AccountStep = ({ form, setForm, onNext }) => (
  <View>
    <Text style={styles.title}>IDENTITY</Text>
    <Text style={styles.subtitle}>Initialize your operative credentials</Text>

    <Input label="Full Name" icon="user" placeholder="John Doe" value={form.name} onChange={(t) => setForm({ ...form, name: t })} />
    <Input label="Email Address" icon="mail" placeholder="name@agency.com" autoCapitalize="none" value={form.email} onChange={(t) => setForm({ ...form, email: t })} />
    <Input label="Security Password" icon="lock" placeholder="••••••••" secureTextEntry value={form.password} onChange={(t) => setForm({ ...form, password: t })} />

    <TouchableOpacity style={styles.primaryBtn} onPress={() => (form.email && form.password ? onNext() : alert("Fill credentials"))}>
      <Text style={styles.primaryBtnText}>CONTINUE</Text>
    </TouchableOpacity>
  </View>
);

/** STEP 2: GOALS (MAX 3) **/
const GoalStep = ({ form, setForm, onNext, onSkip, onBack }) => {
  const goals = ["Weight Loss", "Muscle Gain", "Longevity", "Athletic Power", "Mental Focus", "Endurance"];

  const toggleGoal = (g) => {
    let newGoals = [...form.goals];
    if (newGoals.includes(g)) {
      newGoals = newGoals.filter((item) => item !== g);
    } else if (newGoals.length < 3) {
      newGoals.push(g);
    }
    setForm({ ...form, goals: newGoals });
  };

  return (
    <View>
      <Text style={styles.title}>OBJECTIVES</Text>
      <Text style={styles.subtitle}>Select up to 3 primary directives</Text>

      <View style={styles.chipGrid}>
        {goals.map((g) => (
          <TouchableOpacity key={g} style={[styles.chip, form.goals.includes(g) && styles.chipActive]} onPress={() => toggleGoal(g)}>
            <Text style={[styles.chipText, form.goals.includes(g) && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>NEXT PHASE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipBtnText}>SKIP AND FINISH LATER</Text>
      </TouchableOpacity>
    </View>
  );
};

/** STEP 3: VITALS **/
const VitalStep = ({ form, setForm, onNext, onBack }) => (
  <View>
    <Text style={styles.title}>BIOMETRICS</Text>
    <Text style={styles.subtitle}>Enter physical baseline data</Text>

    <View style={styles.row}>
      <Input
        label="Age"
        placeholder="25"
        keyboardType="numeric"
        style={{ flex: 1 }} // Add this to ensure it takes up space in the row
        value={form.age}
        onChange={(t) => setForm({ ...form, age: t.replace(/[^0-9]/g, "") })}
      />
      <View style={{ width: 20 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.toggleRow}>
          {["Male", "Female"].map((s) => (
            <TouchableOpacity key={s} style={[styles.toggleBtn, form.sex === s && styles.toggleActive]} onPress={() => setForm({ ...form, sex: s })}>
              <Text style={[styles.toggleText, form.sex === s && styles.activeToggleText]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>

    <Input label="Height (cm)" placeholder="180" keyboardType="numeric" value={form.height} onChange={(t) => setForm({ ...form, height: t })} />
    <Input label="Weight (kg)" placeholder="75" keyboardType="numeric" value={form.weight} onChange={(t) => setForm({ ...form, weight: t })} />

    <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
      <Text style={styles.primaryBtnText}>ALMOST THERE</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onBack}>
      <Text style={styles.backLink}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

/** STEP 4: NUTRITION & ALLERGIES **/
const NutritionStep = ({ form, setForm, onSubmit, loading, onBack }) => {
  const diets = ["Standard", "Vegan", "Vegetarian", "Keto", "Paleo", "Carnivore", "Pescatarian"];
  const allergies = ["Dairy", "Gluten", "Nuts", "Shellfish", "Soy", "Eggs", "Fish", "None"];

  const toggleAllergy = (a) => {
    let newA = [...form.allergies];
    newA.includes(a) ? (newA = newA.filter((i) => i !== a)) : newA.push(a);
    setForm({ ...form, allergies: newA });
  };

  return (
    <View>
      <Text style={styles.title}>FUELING</Text>
      <Text style={styles.subtitle}>Dietary preference and constraints</Text>

      <Text style={styles.label}>Dietary Selection</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {diets.map((d) => (
          <TouchableOpacity key={d} style={[styles.smallChip, form.diet === d && styles.chipActive]} onPress={() => setForm({ ...form, diet: d })}>
            <Text style={[styles.chipText, form.diet === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Allergies / Intolerances</Text>
      <View style={styles.chipGrid}>
        {allergies.map((a) => (
          <TouchableOpacity key={a} style={[styles.chip, form.allergies.includes(a) && { borderColor: "#ef4444", backgroundColor: "#ef444420" }]} onPress={() => toggleAllergy(a)}>
            <Text style={[styles.chipText, form.allergies.includes(a) && { color: "#ef4444" }]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.finishBtn} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? "INITIALIZING..." : "GENERATE PROFILE"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// Reusable Input Component
// Reusable Input Component
const Input = ({ label, icon, style, onChange, ...props }) => (
  <View style={[styles.inputGroup, style]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon && <Feather name={icon} size={16} color="#a58fff" style={{ marginRight: 10 }} />}
      {/* CHANGE: Map the onChange prop to onChangeText */}
      <TextInput placeholderTextColor="#444" style={styles.input} onChangeText={onChange} {...props} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", paddingTop: 60 },
  inner: { padding: 30 },
  progressWrapper: { paddingHorizontal: 30, marginBottom: 20 },
  progressBarBackground: { height: 4, backgroundColor: "#1a1a1a", borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#a58fff" },
  stepIndicator: { color: "#444", fontSize: 10, fontWeight: "800", marginTop: 8, letterSpacing: 1 },

  title: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "#666", fontSize: 13, marginBottom: 30, marginTop: 4 },

  label: { color: "#a58fff", fontSize: 10, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  inputGroup: { marginBottom: 20 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "#222" },
  input: { flex: 1, paddingVertical: 16, color: "#fff", fontSize: 15 },

  row: { flexDirection: "row", alignItems: "center" },
  toggleRow: { flexDirection: "row", backgroundColor: "#111", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "#222" },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8 },
  toggleActive: { backgroundColor: "#a58fff" },
  toggleText: { color: "#444", fontWeight: "800", fontSize: 12 },
  activeToggleText: { color: "#000" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 25 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "#222", backgroundColor: "#0a0a0a", minWidth: "47%" },
  smallChip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: "#222", marginRight: 10 },
  chipActive: { borderColor: "#a58fff", backgroundColor: "#a58fff20" },
  chipText: { color: "#666", fontSize: 12, fontWeight: "700", textAlign: "center" },
  chipTextActive: { color: "#a58fff" },

  primaryBtn: { backgroundColor: "#a58fff", padding: 18, borderRadius: 12, marginTop: 20, alignItems: "center", shadowColor: "#a58fff", shadowRadius: 10, shadowOpacity: 0.3 },
  finishBtn: { backgroundColor: "#a58fff", padding: 18, borderRadius: 12, marginTop: 20, alignItems: "center" },
  primaryBtnText: { color: "#000", fontWeight: "900", letterSpacing: 1 },

  skipBtn: { marginTop: 15, padding: 10, alignItems: "center" },
  skipBtnText: { color: "#444", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  backLink: { color: "#444", textAlign: "center", marginTop: 20, fontSize: 12, fontWeight: "700" },
});

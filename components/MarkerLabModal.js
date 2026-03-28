import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// New reliable pure-JS slider
import { Slider } from "@miblanchard/react-native-slider";
import { useSimulation } from "./SimulationContext";

const { width } = Dimensions.get("window");

export default function MarkerLabModal({ visible, onClose }) {
  const { simulatedMarkers, applySimulation } = useSimulation();
  const [tempMarkers, setTempMarkers] = useState(simulatedMarkers);

  // Sync state when modal opens
  useEffect(() => {
    if (visible) setTempMarkers(simulatedMarkers);
  }, [visible, simulatedMarkers]);

  const handleUpdate = (id, val) => {
    // Note: this slider returns an array [value]
    const newValue = Array.isArray(val) ? val[0] : val;
    setTempMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, value: newValue } : m)));
  };

  const handleSave = () => {
    applySimulation(tempMarkers);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>MARKER LAB</Text>
            <Text style={styles.subtitle}>Simulate physiological shifts</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tempMarkers.map((m) => (
            <View key={m.id} style={styles.control}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{m.label}</Text>
                <Text style={styles.value}>
                  {m.value.toFixed(m.id === "hba1c" ? 1 : 0)}
                  <Text style={styles.unit}> {m.unit}</Text>
                </Text>
              </View>

              <Slider
                value={m.value}
                minimumValue={m.min}
                maximumValue={m.max}
                step={m.id === "hba1c" ? 0.1 : 1}
                onValueChange={(val) => handleUpdate(m.id, val)}
                minimumTrackTintColor="#a58fff"
                maximumTrackTintColor="#222"
                thumbTintColor="#fff"
                trackStyle={{ height: 4, borderRadius: 2 }}
                thumbStyle={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", elevation: 5 }}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleSave}>
            <MaterialCommunityIcons name="calculator" size={18} color="#000" />
            <Text style={styles.applyBtnText}>RECALCULATE VITALITY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: Platform.OS === "ios" ? 10 : 0,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: "#444", fontSize: 12, fontWeight: "600" },
  closeBtn: { backgroundColor: "#111", padding: 8, borderRadius: 20 },
  scroll: { paddingBottom: 120 },
  control: { marginBottom: 35 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5, alignItems: "baseline" },
  label: { color: "#666", fontWeight: "800", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  value: { color: "#a58fff", fontWeight: "900", fontSize: 20 },
  unit: { color: "#333", fontSize: 12, fontWeight: "700" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.9)",
    borderTopWidth: 1,
    borderTopColor: "#111",
  },
  applyBtn: {
    backgroundColor: "#a58fff",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  applyBtnText: { color: "#000", fontWeight: "900", letterSpacing: 1, fontSize: 13 },
});

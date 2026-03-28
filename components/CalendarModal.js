import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CLINICS = [
  { id: 1, name: "Evermen", type: "Dental Clinic", logo: require("../assets/images/logodark.png") },
  { id: 2, name: "HealthPlus +", type: "Hospital", logo: require("../assets/images/react-logo.png") },
  { id: 3, name: "Prime Diagnostics", type: "Diagnostics", logo: require("../assets/images/react-logo.png") },
];

const TIME_SLOTS = ["09:00 AM", "10:30 AM", "11:00 AM", "01:30 PM", "02:00 PM", "04:30 PM"];
const DAYS = [
  { label: "Mon", date: 27 },
  { label: "Tue", date: 28 },
  { label: "Wed", date: 29 },
  { label: "Thu", date: 30 },
  { label: "Fri", date: 31 },
];

// The new Protocol Chips
const PROTOCOL_TAGS = ["Performance", "Hair", "TRT", "Longevity", "Dental", "Bloodwork", "Recovery"];

export default function CalendarModal({ visible, onClose, initialDate }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate || null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]); // State for chips

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSchedule = () => setStep(2);

  const closeAndReset = () => {
    setStep(1);
    setSelectedClinic(null);
    setSelectedTime(null);
    setSelectedDate(initialDate);
    setSelectedTags([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
          <View style={styles.modalCard}>
            {step === 1 ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconBg}>
                      <MaterialCommunityIcons name="calendar-edit" size={20} color="#a58fff" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.modalTitle}>New Appointment</Text>
                      <TouchableOpacity onPress={() => setSelectedDate(null)}>
                        <Text style={styles.mutedText}>{selectedDate ? `Apr ${selectedDate} (Tap to change)` : "Select a date below"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <MaterialCommunityIcons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  <Text style={styles.label}>1. Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {DAYS.map((d) => (
                      <TouchableOpacity key={d.date} style={[styles.datePill, selectedDate === d.date && styles.selectedGold]} onPress={() => setSelectedDate(d.date)}>
                        <Text style={[styles.pillLabel, selectedDate === d.date && styles.blackText]}>{d.label}</Text>
                        <Text style={[styles.pillDate, selectedDate === d.date && styles.blackText]}>{d.date}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedDate && (
                    <>
                      <Text style={styles.label}>2. Select Clinic</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {CLINICS.map((c) => (
                          <TouchableOpacity key={c.id} style={[styles.clinicCard, selectedClinic?.id === c.id && styles.selectedGold]} onPress={() => setSelectedClinic(c)}>
                            <Image source={c.logo} style={styles.clinicLogo} resizeMode="contain" />
                            <Text style={[styles.clinicName, selectedClinic?.id === c.id && styles.blackText]}>{c.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {selectedClinic && (
                    <View>
                      <Text style={styles.label}>3. Available Times</Text>
                      <View style={styles.timeGrid}>
                        {TIME_SLOTS.map((time) => (
                          <TouchableOpacity key={time} style={[styles.timeSlot, selectedTime === time && styles.selectedGold]} onPress={() => setSelectedTime(time)}>
                            <Text style={[styles.timeText, selectedTime === time && styles.blackText]}>{time}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* NEW CHIPS SECTION */}
                      <Text style={styles.label}>4. Protocol Categories</Text>
                      <View style={styles.chipGrid}>
                        {PROTOCOL_TAGS.map((tag) => (
                          <TouchableOpacity key={tag} style={[styles.chip, selectedTags.includes(tag) && styles.selectedChip]} onPress={() => toggleTag(tag)}>
                            <Text style={[styles.chipText, selectedTags.includes(tag) && styles.blackText]}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.primaryBtn, (!selectedClinic || !selectedTime || !selectedDate) && styles.disabledBtn]}
                    onPress={handleSchedule}
                    disabled={!selectedClinic || !selectedTime || !selectedDate}
                  >
                    <Text style={styles.primaryBtnText}>Confirm Appointment</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <View style={styles.successState}>
                <MaterialCommunityIcons name="check-decagram" size={60} color="#a58fff" />
                <Text style={styles.successTitle}>Appointment Scheduled</Text>
                <Text style={styles.successSub}>
                  {selectedTags.join(", ")} Clinic: {selectedClinic?.name}
                </Text>
                <Text style={styles.successSub}>This is a work in progress feature contact - Rohit (zebcorp76@gmail.com)</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={closeAndReset}>
                  <Text style={styles.secondaryBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#0F0F0F", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, borderWidth: 1, borderColor: "#222", height: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  iconBg: { backgroundColor: "#a58fff15", padding: 8, borderRadius: 10 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  mutedText: { color: "#a58fff", fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
  closeBtn: { backgroundColor: "#222", padding: 5, borderRadius: 20 },
  label: { color: "#666", fontSize: 10, fontWeight: "900", marginBottom: 12, marginTop: 25, letterSpacing: 1, textTransform: "uppercase" },
  horizontalScroll: { flexDirection: "row", marginBottom: 5 },
  datePill: { width: 65, height: 75, backgroundColor: "#161616", borderRadius: 15, marginRight: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#222" },
  pillLabel: { color: "#555", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  pillDate: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4 },
  clinicCard: { width: 120, backgroundColor: "#161616", padding: 15, borderRadius: 20, marginRight: 12, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  clinicLogo: { width: 35, height: 35, marginBottom: 10, borderRadius: 8 },
  clinicName: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },
  selectedGold: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  blackText: { color: "#000" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeSlot: { paddingVertical: 12, borderRadius: 12, backgroundColor: "#161616", borderWidth: 1, borderColor: "#222", width: "31%", alignItems: "center" },
  timeText: { color: "#888", fontSize: 11, fontWeight: "700" },

  // CHIP STYLES
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#161616", borderWidth: 1, borderColor: "#222" },
  selectedChip: { backgroundColor: "#a58fff", borderColor: "#a58fff" },
  chipText: { color: "#888", fontSize: 12, fontWeight: "700" },

  primaryBtn: { backgroundColor: "#a58fff", padding: 18, borderRadius: 15, marginTop: 30, alignItems: "center" },
  disabledBtn: { backgroundColor: "#222", opacity: 0.5 },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  successState: { alignItems: "center", justifyContent: "center", flex: 1 },
  successTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 20 },
  successSub: { color: "#666", fontSize: 14, textAlign: "center", marginTop: 8 },
  secondaryBtn: { marginTop: 40 },
  secondaryBtnText: { color: "#666", fontWeight: "700" },
});

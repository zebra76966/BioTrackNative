import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CalendarModal from "./CalendarModal";

const DUMMY_APPOINTMENTS = [
  {
    title: "Dental Checkup",
    doctor: "Dr. Jane Cooper",
    day: 18, // Added numeric day for easy filtering
    date: "Apr 18",
    time: "10:20 AM",
    status: "confirmed",
    avatar: "https://i.pravatar.cc/80?img=12",
  },
  {
    title: "Bloodwork Panel",
    doctor: "Dr. Emily Watson",
    day: 19,
    date: "Apr 19",
    time: "09:00 AM",
    status: "confirmed",
    avatar: "https://i.pravatar.cc/80?img=22",
  },
  {
    title: "Recovery Session",
    doctor: "Coach Alex",
    day: 19,
    date: "Apr 19",
    time: "18:00 PM",
    status: "confirmed",
    avatar: "https://i.pravatar.cc/80?img=45",
  },
  {
    title: "Physiotherapy",
    doctor: "Dr. Sam Wilson",
    day: 21,
    date: "Apr 21",
    time: "11:30 AM",
    status: "confirmed",
    avatar: "https://i.pravatar.cc/80?img=11",
  },
];

export default function CheckupSchedule() {
  // Set default to 19 to match your dummy data
  const [activeDate, setActiveDate] = useState(19);
  const days = [17, 18, 19, 20, 21, 22, 23];
  const [modalVisible, setModalVisible] = useState(false);

  // FILTER LOGIC: Only show appointments matching the activeDate
  const filteredAppointments = DUMMY_APPOINTMENTS.filter((appt) => appt.day === activeDate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Checkup Schedule</Text>
          <Text style={styles.subtitle}>Calendar synced ✓</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.showMore}>Schedule +</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {days.map((d) => (
          <TouchableOpacity key={d} onPress={() => setActiveDate(d)} style={[styles.datePill, activeDate === d && styles.activePill]}>
            <Text style={[styles.dayText, activeDate === d && styles.activeText]}>{d === 19 ? "TOD" : "DAY"}</Text>
            <Text style={[styles.dateText, activeDate === d && styles.activeText]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.appointmentList}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((item, index) => (
            <View key={index} style={styles.apptCard}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.apptTitle}>{item.title}</Text>
                <Text style={styles.apptDoctor}>{item.doctor}</Text>
                <Text style={styles.apptTime}>
                  {item.date} • {item.time}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#D4AF37" />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No protocols scheduled for this date</Text>
          </View>
        )}
      </View>

      <CalendarModal visible={modalVisible} initialDate={activeDate} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { color: "#555", fontSize: 11, fontWeight: "600" },
  showMore: { color: "#D4AF37", fontSize: 11, fontWeight: "700" },
  dateRow: { gap: 10, paddingBottom: 15 },
  datePill: {
    backgroundColor: "#121212",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    minWidth: 55,
  },
  activePill: { backgroundColor: "#D4AF37", borderColor: "#D4AF37" },
  dayText: { color: "#666", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  activeText: { color: "#000" },
  appointmentList: { gap: 10 },
  apptCard: {
    flexDirection: "row",
    backgroundColor: "#121212",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
  info: { flex: 1 },
  apptTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  apptDoctor: { color: "#888", fontSize: 12 },
  apptTime: { color: "#D4AF37", fontSize: 11, marginTop: 2, fontWeight: "600" },
  statusBadge: { padding: 4 },
  emptyState: {
    padding: 20,
    backgroundColor: "#0a0a0a",
    borderRadius: 15,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  emptyText: { color: "#444", fontSize: 12, fontWeight: "600" },
});

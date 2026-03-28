import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function OverallHealthCard({ score }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - score / 100), { duration: 1500 }),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.gaugeBox}>
          <Svg width="120" height="120" viewBox="0 0 120 120">
            <Circle cx="60" cy="60" r={radius} stroke="#222" strokeWidth="8" fill="none" />
            <AnimatedCircle
              cx="60"
              cy="60"
              r={radius}
              stroke="#a58fff"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </Svg>
          <View style={styles.scoreOverlay}>
            <Text style={styles.scoreText}>{Math.round(score)}</Text>
            <Text style={styles.scoreLabel}>VITALITY</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.statusTitle}>Metabolic Status: Optimal</Text>
          <Text style={styles.description}>Your markers suggest high insulin sensitivity and hormonal balance.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111", borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: "#222" },
  content: { flexDirection: "row", alignItems: "center", gap: 20 },
  gaugeBox: { width: 120, height: 120, justifyContent: "center", alignItems: "center" },
  scoreOverlay: { position: "absolute", alignItems: "center" },
  scoreText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  scoreLabel: { color: "#a58fff", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  info: { flex: 1 },
  statusTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  description: { color: "#666", fontSize: 12, lineHeight: 18 },
});

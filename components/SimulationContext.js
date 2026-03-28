// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { createContext, useContext, useEffect, useState } from "react";

// const SimulationContext = createContext();

// export const initialMarkers = [
//   { id: "ldl", label: "LDL Cholesterol", min: 50, max: 200, unit: "mg/dL", value: 106 },
//   { id: "hdl", label: "HDL Cholesterol", min: 20, max: 100, unit: "mg/dL", value: 45 },
//   { id: "trt", label: "Total Testosterone", min: 200, max: 1200, unit: "ng/dL", value: 650 },
//   { id: "hba1c", label: "HbA1c (Glucose)", min: 4, max: 10, unit: "%", value: 5.2 },
//   { id: "cortisol", label: "Cortisol", min: 5, max: 25, unit: "mcg/dL", value: 12 },
// ];

// export function SimulationProvider({ children }) {
//   const [simulatedMarkers, setSimulatedMarkers] = useState(initialMarkers);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const saved = await AsyncStorage.getItem("biotrack_sim_data");
//         if (saved) {
//           setSimulatedMarkers(JSON.parse(saved));
//         }
//       } catch (e) {
//         console.error("Failed to load simulation data", e);
//       }
//     };
//     loadData();
//   }, []);

//   const applySimulation = async (newMarkers) => {
//     try {
//       setSimulatedMarkers(newMarkers);
//       await AsyncStorage.setItem("biotrack_sim_data", JSON.stringify(newMarkers));
//     } catch (e) {
//       console.error("Failed to save simulation data", e);
//     }
//   };

//   return <SimulationContext.Provider value={{ simulatedMarkers, applySimulation }}>{children}</SimulationContext.Provider>;
// }

// export const useSimulation = () => useContext(SimulationContext);

// TEMPORARY BYPASS FOR SimulationContext.js
import { createContext, useContext, useState } from "react";

const SimulationContext = createContext();

export const initialMarkers = [
  { id: "ldl", label: "LDL Cholesterol", min: 50, max: 200, unit: "mg/dL", value: 106 },
  { id: "hdl", label: "HDL Cholesterol", min: 20, max: 100, unit: "mg/dL", value: 45 },
  { id: "trt", label: "Total Testosterone", min: 200, max: 1200, unit: "ng/dL", value: 650 },
  { id: "hba1c", label: "HbA1c (Glucose)", min: 4, max: 10, unit: "%", value: 5.2 },
  { id: "cortisol", label: "Cortisol", min: 5, max: 25, unit: "mcg/dL", value: 12 },
];

export function SimulationProvider({ children }) {
  const [simulatedMarkers, setSimulatedMarkers] = useState(initialMarkers);

  // We commented out the AsyncStorage logic to stop the crash
  const applySimulation = (newMarkers) => {
    setSimulatedMarkers(newMarkers);
    // await AsyncStorage.setItem(...) <-- Skip this for now
  };

  return <SimulationContext.Provider value={{ simulatedMarkers, applySimulation }}>{children}</SimulationContext.Provider>;
}

export const useSimulation = () => useContext(SimulationContext);

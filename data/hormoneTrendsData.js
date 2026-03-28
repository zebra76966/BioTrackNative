export const hormoneTrends = {
  testosterone: {
    label: "Testosterone",
    unit: "ng/dL",
    color: "#7c4dff",
    gradient: ["rgba(124,77,255,0.35)", "rgba(124,77,255,0.05)"],

    // REAL values (single mode)
    data: [620, 710, 680, 540, 590, 720, 690],

    // NORMALIZED (0–100 scale for ALL mode)
    normalized: [65, 78, 72, 50, 58, 82, 74],
  },

  estradiol: {
    label: "Estradiol (E2)",
    unit: "pg/mL",
    color: "#f2994a",
    gradient: ["rgba(242,153,74,0.35)", "rgba(242,153,74,0.05)"],
    data: [38, 42, 35, 29, 33, 41, 37],
    normalized: [60, 70, 55, 40, 48, 68, 58],
  },

  cortisol: {
    label: "Cortisol",
    unit: "µg/dL",
    color: "#27ae60",
    gradient: ["rgba(39,174,96,0.35)", "rgba(39,174,96,0.05)"],
    data: [14, 16, 15, 13, 12, 14, 15],
    normalized: [58, 68, 63, 52, 48, 58, 63],
  },
};

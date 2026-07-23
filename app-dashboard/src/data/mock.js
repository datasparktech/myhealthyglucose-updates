// Mock data shaped to mirror the mobile app's Firestore/Supabase records.
// Swap these arrays for live queries (see src/lib/supabase.js) once the app
// is syncing to Supabase — the component props stay identical.

export const patient = {
  name: "Keyur Shah",
  firstName: "Keyur",
  condition: "Type 2 Diabetes",
  since: "2022",
  avatarInitials: "KS",
  targetLow: 70,
  targetHigh: 180,
  device: "Dexcom G7",
};

// A day of CGM-style readings (mg/dL), every ~30 min.
export const glucoseToday = [
  { t: "12a", v: 118 }, { t: "1a", v: 110 }, { t: "2a", v: 104 },
  { t: "3a", v: 99 }, { t: "4a", v: 96 }, { t: "5a", v: 101 },
  { t: "6a", v: 112 }, { t: "7a", v: 134 }, { t: "8a", v: 168 },
  { t: "9a", v: 152 }, { t: "10a", v: 128 }, { t: "11a", v: 116 },
  { t: "12p", v: 142 }, { t: "1p", v: 176 }, { t: "2p", v: 158 },
  { t: "3p", v: 138 }, { t: "4p", v: 124 }, { t: "5p", v: 130 },
  { t: "6p", v: 149 }, { t: "7p", v: 172 }, { t: "8p", v: 154 },
  { t: "9p", v: 132 }, { t: "10p", v: 121 }, { t: "11p", v: 115 },
];

// 14-day average glucose for the trend card.
export const glucose14d = [
  { d: "Jul 10", v: 141 }, { d: "Jul 11", v: 137 }, { d: "Jul 12", v: 145 },
  { d: "Jul 13", v: 132 }, { d: "Jul 14", v: 129 }, { d: "Jul 15", v: 138 },
  { d: "Jul 16", v: 126 }, { d: "Jul 17", v: 133 }, { d: "Jul 18", v: 124 },
  { d: "Jul 19", v: 130 }, { d: "Jul 20", v: 122 }, { d: "Jul 21", v: 128 },
  { d: "Jul 22", v: 119 }, { d: "Jul 23", v: 125 },
];

// Time-in-range breakdown (share of readings).
export const timeInRange = [
  { label: "Low", range: "<70", pct: 4, color: "#D9482B" },
  { label: "In range", range: "70–180", pct: 78, color: "#0EA99A" },
  { label: "High", range: ">180", pct: 18, color: "#E0A03A" },
];

// Sparkline helpers (small series for the stat cards).
export const sparkGlucose = [128, 132, 126, 133, 124, 122, 125];
export const sparkA1c = [7.1, 7.0, 6.9, 6.8, 6.7, 6.6, 6.5];
export const sparkCarbs = [180, 210, 165, 190, 172, 205, 168];
export const sparkSteps = [4200, 6100, 5300, 7400, 6800, 8100, 7250];

export const stats = {
  currentGlucose: 125,
  currentTrend: "steady", // rising | falling | steady
  currentDelta: -3,
  timeInRange: 78,
  estA1c: 6.5,
  a1cDelta: -0.2,
  avgGlucose: 125,
  avgDelta: -4,
};

export const meals = [
  { name: "Oatmeal + Blueberries", time: "7:45 AM", carbs: 42, cal: 320, tag: "Breakfast" },
  { name: "Grilled Chicken Salad", time: "12:30 PM", carbs: 18, cal: 410, tag: "Lunch" },
  { name: "Apple + Almonds", time: "3:15 PM", carbs: 25, cal: 190, tag: "Snack" },
  { name: "Dal, Roti & Sabzi", time: "7:40 PM", carbs: 55, cal: 520, tag: "Dinner" },
];

export const medications = [
  { name: "Metformin", dose: "500 mg", time: "8:00 AM", taken: true },
  { name: "Metformin", dose: "500 mg", time: "8:00 PM", taken: false },
  { name: "Vitamin D3", dose: "2000 IU", time: "9:00 AM", taken: true },
];

export const appointments = [
  { day: "28", month: "Jul", title: "Endocrinologist Review", doctor: "Dr. Mehta", type: "In-person" },
  { day: "05", month: "Aug", title: "Quarterly A1c Lab", doctor: "City Diagnostics", type: "Lab" },
];

export const activity = {
  steps: 7250,
  stepGoal: 10000,
  activeMinutes: 42,
  carbsToday: 140,
  carbGoal: 200,
  caloriesToday: 1440,
};

export const insights = [
  {
    tone: "good",
    text: "Time in range up 6% vs last week. Post-dinner spikes are smaller.",
  },
  {
    tone: "warn",
    text: "Lunch on Jul 21 spiked to 176 — high-carb meal without a walk after.",
  },
  {
    tone: "info",
    text: "Evening dose of Metformin still pending. Reminder set for 8:00 PM.",
  },
];

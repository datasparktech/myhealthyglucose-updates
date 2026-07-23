// Turns the mobile app's single Firestore document (users/{uid}/appData/main)
// into the shapes the dashboard components render. The app stores glucose in
// mg/dL integers, food/meds as arrays, etc. — see the record shapes below.
//
//   glucose : [{ id, value(mg/dL), context, ts }]
//   hba1c   : [{ id, value(%), date("YYYY-MM-DD") }]
//   food    : [{ id, name, carbs, cal, qty, day("YYYY-MM-DD"), ts, meal }]
//   meds    : [{ id, name, dosage, times:[...], notes }]
//   medLog  : [{ id, medId, date("YYYY-MM-DD"), time, ts }]
//   targets : { carbs, calories }

const DAY = 86400000;
const dayKey = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
const clampArr = (a) => (Array.isArray(a) ? a : []);

function hourLabel(ts) {
  const h = new Date(ts).getHours();
  const ampm = h < 12 ? "a" : "p";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${ampm}`;
}
function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function dateLabel(ts) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

// Pull the active profile's records, supporting both the v2 multi-profile format
// and the legacy flat fields.
function activeRecords(main) {
  const flat = {
    glucose: clampArr(main.glucose),
    hba1c: clampArr(main.hba1c),
    food: clampArr(main.food),
    meds: clampArr(main.meds),
    medLog: clampArr(main.medLog),
    bloodPressure: clampArr(main.bloodPressure),
    targets: main.targets || { carbs: 150, calories: 1800 },
    medicalProfile: main.medicalProfile || {},
    settings: main.settings || {},
  };
  const pid = main.activeProfileId;
  const pd = main.profileData && pid ? main.profileData[pid] : null;
  if (main.schemaVersion >= 2 && pd) {
    return {
      glucose: clampArr(pd["glucose-logs"]),
      hba1c: clampArr(pd["hba1c-logs"]),
      food: clampArr(pd["food-log"]),
      meds: clampArr(pd["medications"]),
      medLog: clampArr(pd["med-log"]),
      bloodPressure: clampArr(pd["blood-pressure"]),
      targets: pd["targets"] || flat.targets,
      medicalProfile: pd["medical-profile"] || flat.medicalProfile,
      settings: flat.settings,
    };
  }
  return flat;
}

export function buildDashboard(main, user) {
  const name = user?.displayName || user?.name || "You";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "U";

  const empty = {
    ready: false,
    patient: { name, firstName: name.split(" ")[0], condition: "Diabetes Management",
      avatarInitials: initials, targetLow: 70, targetHigh: 180, device: "—", since: "" },
  };
  if (!main) return empty;

  const r = activeRecords(main);
  const glucose = [...r.glucose].filter((g) => g && g.ts != null).sort((a, b) => a.ts - b.ts);
  const now = Date.now();

  const targetLow = r.settings?.glucoseLow || r.targets?.glucoseLow || 70;
  const targetHigh = r.settings?.glucoseHigh || r.targets?.glucoseHigh || 180;

  const diabetesType = r.medicalProfile?.diabetesType;
  const condition = diabetesType
    ? (String(diabetesType).match(/1|2/) ? `Type ${String(diabetesType).match(/1|2/)[0]} Diabetes` : diabetesType)
    : "Diabetes Management";

  const patient = {
    name, firstName: name.split(" ")[0], condition, avatarInitials: initials,
    targetLow, targetHigh,
    device: glucose.length ? "Glucose Log" : "—",
    since: "",
  };

  if (!glucose.length) {
    return { ...empty, patient, ready: true, hasGlucose: false };
  }

  // Windows
  const last24 = glucose.filter((g) => now - g.ts <= DAY);
  const todaySeries = (last24.length ? last24 : glucose.slice(-24)).map((g) => ({
    label: hourLabel(g.ts), v: g.value, ts: g.ts,
  }));

  // 14-day daily averages
  const byDay = {};
  glucose.forEach((g) => { (byDay[dayKey(g.ts)] ||= []).push(g.value); });
  const days14 = [];
  for (let i = 13; i >= 0; i--) {
    const k = dayKey(now - i * DAY);
    if (byDay[k]) days14.push({ label: dateLabel(now - i * DAY), v: Math.round(mean(byDay[k])) });
  }

  // Stats
  const latest = glucose[glucose.length - 1];
  const prev = glucose[glucose.length - 2];
  const win14 = glucose.filter((g) => now - g.ts <= 14 * DAY).map((g) => g.value);
  const prev14 = glucose.filter((g) => now - g.ts > 14 * DAY && now - g.ts <= 28 * DAY).map((g) => g.value);
  const avg14 = Math.round(mean(win14.length ? win14 : glucose.map((g) => g.value)));
  const avgPrev = Math.round(mean(prev14));
  const gmi = (avg) => +(3.31 + 0.02392 * avg).toFixed(1);

  // Time in range over last 14 days (fallback: all)
  const tirSet = win14.length ? win14 : glucose.map((g) => g.value);
  const lowN = tirSet.filter((v) => v < targetLow).length;
  const highN = tirSet.filter((v) => v > targetHigh).length;
  const inN = tirSet.length - lowN - highN;
  const pct = (n) => (tirSet.length ? Math.round((n / tirSet.length) * 100) : 0);
  let inPct = pct(inN), lowPct = pct(lowN), highPct = pct(highN);
  const drift = 100 - (inPct + lowPct + highPct);
  inPct += drift; // keep the three summing to 100
  const timeInRange = [
    { label: "Low", range: `<${targetLow}`, pct: lowPct, color: "#D9482B" },
    { label: "In range", range: `${targetLow}–${targetHigh}`, pct: inPct, color: "#0EA99A" },
    { label: "High", range: `>${targetHigh}`, pct: highPct, color: "#E0A03A" },
  ];

  const stats = {
    currentGlucose: latest.value,
    currentDelta: prev ? latest.value - prev.value : 0,
    timeInRange: inPct,
    estA1c: gmi(avg14),
    a1cDelta: prev14.length ? +(gmi(avg14) - gmi(avgPrev)).toFixed(1) : 0,
    avgGlucose: avg14,
    avgDelta: prev14.length ? avg14 - avgPrev : 0,
  };

  // Sparklines from the last 7 daily averages
  const sparkG = days14.slice(-7).map((d) => d.v);
  const sparkGlucose = sparkG.length ? sparkG : [latest.value];

  // Meals: today's food entries
  const foodToday = clampArr(r.food)
    .filter((f) => f && (f.day === dayKey() || (f.ts && now - f.ts <= DAY)))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const meals = foodToday.map((f) => ({
    name: f.name || "Food",
    time: f.ts ? timeLabel(f.ts) : "",
    tag: f.meal || "Meal",
    carbs: Math.round((f.carbs || 0) * (f.qty || 1)),
    cal: Math.round((f.cal || 0) * (f.qty || 1)),
  }));
  const carbsToday = meals.reduce((s, m) => s + m.carbs, 0);
  const caloriesToday = meals.reduce((s, m) => s + m.cal, 0);

  // Medications scheduled today
  const tKey = dayKey();
  const medications = [];
  clampArr(r.meds).forEach((m) => {
    const times = Array.isArray(m.times) && m.times.length ? m.times : [null];
    times.forEach((time) => {
      const taken = clampArr(r.medLog).some(
        (l) => l.medId === m.id && l.date === tKey && (time == null || l.time === time)
      );
      medications.push({ name: m.name || "Medication", dose: m.dosage || "", time: time || "", taken });
    });
  });
  medications.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const medsTaken = medications.filter((m) => m.taken).length;

  const activity = {
    carbsToday, carbGoal: r.targets?.carbs || 150,
    caloriesToday, calGoal: r.targets?.calories || 1800,
    readingsToday: last24.length, readingGoal: 4,
  };

  // Rule-based insights
  const insights = [];
  if (inPct >= 70) insights.push({ tone: "good", text: `Time in range is ${inPct}% over the last 14 days — on target. Keep it up.` });
  else insights.push({ tone: "warn", text: `Time in range is ${inPct}%. Aim for 70%+ — watch post-meal spikes.` });
  const lastHigh = [...glucose].reverse().find((g) => g.value > targetHigh);
  if (lastHigh) insights.push({ tone: "warn", text: `Last high reading was ${lastHigh.value} mg/dL on ${dateLabel(lastHigh.ts)}.` });
  const dueMeds = medications.filter((m) => !m.taken).length;
  if (dueMeds > 0) insights.push({ tone: "info", text: `${dueMeds} medication dose${dueMeds > 1 ? "s" : ""} still due today.` });
  else if (medications.length) insights.push({ tone: "good", text: "All medications for today are logged. Nice consistency." });
  while (insights.length < 3) insights.push({ tone: "info", text: "Log meals and readings in the app to see richer insights here." });

  return {
    ready: true, hasGlucose: true,
    patient, stats, timeInRange, activity, meals, medications, medsTaken,
    glucoseToday: todaySeries,
    glucose14d: days14.length ? days14 : todaySeries.map((p) => ({ label: p.label, v: p.v })),
    sparkGlucose,
    insights: insights.slice(0, 3),
    updatedAt: main.updatedAt || null,
  };
}

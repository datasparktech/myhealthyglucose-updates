// Turns the mobile app's single Firestore document (users/{uid}/appData/main)
// into a model the web pages render.
//
//   glucose : [{ id, value(mg/dL), context, ts }]
//   hba1c   : [{ id, value(%), date("YYYY-MM-DD") }]
//   food    : [{ id, name, carbs, cal, qty, day, ts, meal }]
//   meds    : [{ id, name, dosage, times:[...], notes }]
//   medLog  : [{ id, medId, date, time, ts }]
//   bloodPressure : [{ id, systolic, diastolic, pulse, ts }]
//   appointments  : [{ id, title, doctorId, date, time, location, notes }]
//   doctors       : [{ id, name, specialty, phone, address, notes }]
//   emergencyContacts   : [{ id, name, relation, phone }]
//   preventiveScreenings: [{ id, label, frequencyMonths, lastDone, custom }]
//   footChecks    : [{ id, ts, note, photoPath, concerning }]

export const DAY = 86400000;
export const MMOL = 18.0182;
export const dayKey = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
export const clampArr = (a) => (Array.isArray(a) ? a : []);
export const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
export const gmi = (avg) => +(3.31 + 0.02392 * avg).toFixed(1);

export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function hourLabel(ts) {
  const h = new Date(ts).getHours();
  const ampm = h < 12 ? "a" : "p";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${ampm}`;
}
export function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function dateLabel(ts) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
export function fullDateLabel(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function glucoseState(v, low, high) {
  if (v < low) return "low";
  if (v > high) return "high";
  return "in";
}
export const STATE_COLOR = { low: "#D9482B", in: "#0EA99A", high: "#E0A03A" };

export function glucoseStats(values, low, high) {
  const vals = values.filter((v) => typeof v === "number");
  const n = vals.length;
  if (!n) return { count: 0, avg: 0, gmi: 0, min: 0, max: 0, std: 0, inPct: 0, lowPct: 0, highPct: 0 };
  const avg = mean(vals);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const std = Math.sqrt(mean(vals.map((v) => (v - avg) ** 2)));
  const lowN = vals.filter((v) => v < low).length;
  const highN = vals.filter((v) => v > high).length;
  const inN = n - lowN - highN;
  const pct = (x) => Math.round((x / n) * 100);
  let inPct = pct(inN), lowPct = pct(lowN), highPct = pct(highN);
  inPct += 100 - (inPct + lowPct + highPct);
  return { count: n, avg: Math.round(avg), gmi: gmi(avg), min, max, std: Math.round(std), inPct, lowPct, highPct };
}

/* ------------------------------- extract ------------------------------- */

export function extractRecords(main) {
  const flat = {
    glucose: clampArr(main.glucose),
    hba1c: clampArr(main.hba1c),
    food: clampArr(main.food),
    meds: clampArr(main.meds),
    medLog: clampArr(main.medLog),
    bloodPressure: clampArr(main.bloodPressure),
    appointments: clampArr(main.appointments),
    doctors: clampArr(main.doctors),
    emergencyContacts: clampArr(main.emergencyContacts),
    preventiveScreenings: clampArr(main.preventiveScreenings),
    footChecks: clampArr(main.footChecks),
    labResults: clampArr(main.labResults),
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
      appointments: clampArr(pd["appointments"]),
      doctors: clampArr(pd["doctors"]),
      emergencyContacts: clampArr(pd["emergency-contacts"]),
      preventiveScreenings: clampArr(pd["preventive-screenings"]),
      footChecks: clampArr(pd["foot-checks"]),
      labResults: clampArr(pd["lab-results"]),
      targets: pd["targets"] || flat.targets,
      medicalProfile: pd["medical-profile"] || flat.medicalProfile,
      settings: flat.settings,
    };
  }
  return flat;
}

/* ------------------------------ analytics ------------------------------ */

// Distinct glucose context tags (e.g. Fasting, Before Meal, Bedtime).
export function distinctContexts(glucose) {
  const set = new Set();
  glucose.forEach((g) => { if (g.context) set.add(g.context); });
  return Array.from(set);
}

// Ambulatory Glucose Profile: percentile bands by hour of day.
export function agpProfile(glucose) {
  const bins = Array.from({ length: 24 }, () => []);
  glucose.forEach((g) => { bins[new Date(g.ts).getHours()].push(g.value); });
  return bins.map((vals, h) => {
    const s = [...vals].sort((a, b) => a - b);
    const p = (q) => Math.round(percentile(s, q));
    const ampm = h < 12 ? "a" : "p";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return {
      hour: h, label: h % 3 === 0 ? `${h12}${ampm}` : "",
      count: s.length,
      p05: s.length ? p(5) : null, p25: s.length ? p(25) : null, p50: s.length ? p(50) : null,
      p75: s.length ? p(75) : null, p95: s.length ? p(95) : null,
      band90: s.length ? [p(5), p(95)] : null,
      band50: s.length ? [p(25), p(75)] : null,
    };
  });
}

// Daily time-in-range for a calendar heatmap (most recent `weeks`).
export function heatmap(glucose, low, high, weeks = 13) {
  const byDay = {};
  glucose.forEach((g) => {
    const k = dayKey(g.ts);
    (byDay[k] ||= []).push(g.value);
  });
  const now = Date.now();
  // Align to weeks: start from the Sunday `weeks` weeks ago.
  const today = new Date(now);
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const dt = new Date(start.getTime() + i * DAY);
    const k = dayKey(dt);
    const vals = byDay[k] || [];
    const future = dt.getTime() > now;
    let inPct = null;
    if (vals.length) {
      const inN = vals.filter((v) => v >= low && v <= high).length;
      inPct = Math.round((inN / vals.length) * 100);
    }
    cells.push({ key: k, ts: dt.getTime(), count: vals.length, inPct, future, dow: dt.getDay() });
  }
  return cells;
}

// Simple, explainable pattern detection.
export function patternAlerts(glucose, low, high) {
  const alerts = [];
  const inWindow = (g, dowSet, h0, h1) => {
    const d = new Date(g.ts);
    const dow = d.getDay(), h = d.getHours();
    return (!dowSet || dowSet.has(dow)) && h >= h0 && h < h1;
  };
  const rate = (subset, pred) => {
    const s = subset.filter(Boolean);
    if (s.length < 3) return null;
    const n = s.filter(pred).length;
    return { n, total: s.length, pct: Math.round((n / s.length) * 100) };
  };

  // Weekend morning highs
  const weekend = new Set([0, 6]);
  const wm = glucose.filter((g) => inWindow(g, weekend, 5, 11));
  const wmHigh = rate(wm, (g) => g.value > high);
  if (wmHigh && wmHigh.pct >= 40)
    alerts.push({ id: "wend-am", tone: "warn", title: "Weekend morning highs",
      text: `${wmHigh.n} of ${wmHigh.total} weekend-morning readings were above ${high} mg/dL.`,
      filter: { label: "Weekend mornings", days: [0, 6], h0: 5, h1: 11 } });

  // Overnight lows
  const on = glucose.filter((g) => inWindow(g, null, 0, 6));
  const onLow = rate(on, (g) => g.value < low);
  if (onLow && onLow.n >= 2)
    alerts.push({ id: "overnight-low", tone: "danger", title: "Overnight lows",
      text: `${onLow.n} low reading${onLow.n > 1 ? "s" : ""} between midnight and 6am. Review evening dosing.`,
      filter: { label: "Overnight (12–6am)", days: null, h0: 0, h1: 6 } });

  // Post-dinner highs
  const pd = glucose.filter((g) => inWindow(g, null, 19, 23));
  const pdHigh = rate(pd, (g) => g.value > high);
  if (pdHigh && pdHigh.pct >= 45)
    alerts.push({ id: "post-dinner", tone: "warn", title: "Post-dinner spikes",
      text: `${pdHigh.pct}% of evening readings (7–11pm) were above ${high} mg/dL.`,
      filter: { label: "Evenings (7–11pm)", days: null, h0: 19, h1: 23 } });

  // Trend: last 7d vs prior 7d
  const now = Date.now();
  const w1 = glucose.filter((g) => now - g.ts <= 7 * DAY).map((g) => g.value);
  const w2 = glucose.filter((g) => now - g.ts > 7 * DAY && now - g.ts <= 14 * DAY).map((g) => g.value);
  if (w1.length >= 5 && w2.length >= 5) {
    const d = Math.round(mean(w1) - mean(w2));
    if (Math.abs(d) >= 8)
      alerts.push({ id: "trend", tone: d < 0 ? "good" : "warn",
        title: d < 0 ? "Improving average" : "Rising average",
        text: `Your 7-day average is ${d < 0 ? "down" : "up"} ${Math.abs(d)} mg/dL vs the week before.`,
        filter: null });
  }
  return alerts;
}

export function upcomingAppointments(appointments, doctors) {
  const byId = Object.fromEntries(clampArr(doctors).map((d) => [d.id, d]));
  const parse = (a) => {
    const t = a.date ? new Date(`${a.date}T${a.time || "00:00"}`).getTime() : null;
    return { ...a, ts: t, doctorName: byId[a.doctorId]?.name || "", specialty: byId[a.doctorId]?.specialty || "" };
  };
  const now = Date.now() - DAY; // include today
  return clampArr(appointments).map(parse).filter((a) => a.ts && a.ts >= now).sort((a, b) => a.ts - b.ts);
}

function screeningStatus(s) {
  if (!s.lastDone) return { due: true, label: "Due" };
  const last = new Date(s.lastDone).getTime();
  const dueAt = last + (s.frequencyMonths || 12) * 30 * DAY;
  const due = Date.now() >= dueAt;
  return { due, label: due ? "Due" : `Next ${new Date(dueAt).toLocaleDateString([], { month: "short", year: "numeric" })}` };
}
export { screeningStatus };

/* ------------------------------ overview ------------------------------- */

function buildOverview(r, patient) {
  const now = Date.now();
  const glucose = [...r.glucose].filter((g) => g && g.ts != null).sort((a, b) => a.ts - b.ts);
  const { targetLow, targetHigh } = patient;

  const last24 = glucose.filter((g) => now - g.ts <= DAY);
  const todaySeries = (last24.length ? last24 : glucose.slice(-24)).map((g) => ({ label: hourLabel(g.ts), v: g.value, ts: g.ts }));

  const byDay = {};
  glucose.forEach((g) => { (byDay[dayKey(g.ts)] ||= []).push(g.value); });
  const days14 = [];
  for (let i = 13; i >= 0; i--) {
    const k = dayKey(now - i * DAY);
    if (byDay[k]) days14.push({ label: dateLabel(now - i * DAY), v: Math.round(mean(byDay[k])) });
  }

  const latest = glucose[glucose.length - 1];
  const prev = glucose[glucose.length - 2];
  const win14 = glucose.filter((g) => now - g.ts <= 14 * DAY).map((g) => g.value);
  const prev14 = glucose.filter((g) => now - g.ts > 14 * DAY && now - g.ts <= 28 * DAY).map((g) => g.value);
  const s = glucoseStats(win14.length ? win14 : glucose.map((g) => g.value), targetLow, targetHigh);
  const avgPrev = Math.round(mean(prev14));

  const timeInRange = [
    { label: "Low", range: `<${targetLow}`, pct: s.lowPct, color: "#D9482B" },
    { label: "In range", range: `${targetLow}–${targetHigh}`, pct: s.inPct, color: "#0EA99A" },
    { label: "High", range: `>${targetHigh}`, pct: s.highPct, color: "#E0A03A" },
  ];

  const stats = {
    currentGlucose: latest.value,
    currentDelta: prev ? latest.value - prev.value : 0,
    timeInRange: s.inPct,
    estA1c: s.gmi,
    a1cDelta: prev14.length ? +(s.gmi - gmi(avgPrev)).toFixed(1) : 0,
    avgGlucose: s.avg,
    avgDelta: prev14.length ? s.avg - avgPrev : 0,
  };

  const sparkG = days14.slice(-7).map((d) => d.v);
  const sparkGlucose = sparkG.length ? sparkG : [latest.value];

  const foodToday = clampArr(r.food)
    .filter((f) => f && (f.day === dayKey() || (f.ts && now - f.ts <= DAY)))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const meals = foodToday.map((f) => ({
    name: f.name || "Food", time: f.ts ? timeLabel(f.ts) : "", tag: f.meal || "Meal",
    carbs: Math.round((f.carbs || 0) * (f.qty || 1)), cal: Math.round((f.cal || 0) * (f.qty || 1)),
  }));
  const carbsToday = meals.reduce((sum, m) => sum + m.carbs, 0);
  const caloriesToday = meals.reduce((sum, m) => sum + m.cal, 0);

  const tKey = dayKey();
  const medications = [];
  clampArr(r.meds).forEach((m) => {
    const times = Array.isArray(m.times) && m.times.length ? m.times : [null];
    times.forEach((time) => {
      const taken = clampArr(r.medLog).some((l) => l.medId === m.id && l.date === tKey && (time == null || l.time === time));
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

  const insights = [];
  if (s.inPct >= 70) insights.push({ tone: "good", text: `Time in range is ${s.inPct}% over the last 14 days — on target. Keep it up.` });
  else insights.push({ tone: "warn", text: `Time in range is ${s.inPct}%. Aim for 70%+ — watch post-meal spikes.` });
  const lastHigh = [...glucose].reverse().find((g) => g.value > targetHigh);
  if (lastHigh) insights.push({ tone: "warn", text: `Last high reading was ${lastHigh.value} mg/dL on ${dateLabel(lastHigh.ts)}.` });
  const dueMeds = medications.filter((m) => !m.taken).length;
  if (dueMeds > 0) insights.push({ tone: "info", text: `${dueMeds} medication dose${dueMeds > 1 ? "s" : ""} still due today.` });
  else if (medications.length) insights.push({ tone: "good", text: "All medications for today are logged. Nice consistency." });
  while (insights.length < 3) insights.push({ tone: "info", text: "Log meals and readings in the app to see richer insights here." });

  const appts = upcomingAppointments(r.appointments, r.doctors).slice(0, 3);

  return {
    stats, timeInRange, activity, meals, medications, medsTaken,
    glucoseToday: todaySeries,
    glucose14d: days14.length ? days14 : todaySeries.map((p) => ({ label: p.label, v: p.v })),
    sparkGlucose, insights: insights.slice(0, 3), appointments: appts,
  };
}

/* -------------------------------- model -------------------------------- */

export function buildModel(main, user) {
  const name = user?.displayName || user?.name || "You";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "U";
  const basePatient = {
    name, firstName: name.split(" ")[0] || name, email: user?.email || "",
    condition: "Diabetes Management", avatarInitials: initials,
    targetLow: 70, targetHigh: 180, device: "—", since: "",
  };

  if (!main) return { ready: true, hasGlucose: false, patient: basePatient, records: emptyRecords() };

  const r = extractRecords(main);
  const targetLow = r.settings?.glucoseLow || r.targets?.glucoseLow || 70;
  const targetHigh = r.settings?.glucoseHigh || r.targets?.glucoseHigh || 180;
  const diabetesType = r.medicalProfile?.diabetesType;
  const condition = diabetesType
    ? (String(diabetesType).match(/1|2/) ? `Type ${String(diabetesType).match(/1|2/)[0]} Diabetes` : String(diabetesType))
    : "Diabetes Management";

  const glucose = [...r.glucose].filter((g) => g && g.ts != null).sort((a, b) => a.ts - b.ts);
  const patient = { ...basePatient, condition, targetLow, targetHigh, device: glucose.length ? "Glucose Log" : "—" };

  const records = {
    glucose, hba1c: clampArr(r.hba1c), food: clampArr(r.food), meds: clampArr(r.meds),
    medLog: clampArr(r.medLog), bloodPressure: clampArr(r.bloodPressure),
    appointments: clampArr(r.appointments), doctors: clampArr(r.doctors),
    emergencyContacts: clampArr(r.emergencyContacts), preventiveScreenings: clampArr(r.preventiveScreenings),
    footChecks: clampArr(r.footChecks), labResults: clampArr(r.labResults),
    targets: r.targets || { carbs: 150, calories: 1800 },
    medicalProfile: r.medicalProfile || {}, settings: r.settings || {},
  };

  const hasGlucose = glucose.length > 0;
  return {
    ready: true, hasGlucose, patient, records,
    overview: hasGlucose ? buildOverview(records, patient) : null,
    updatedAt: main.updatedAt || null,
  };
}

function emptyRecords() {
  return {
    glucose: [], hba1c: [], food: [], meds: [], medLog: [], bloodPressure: [],
    appointments: [], doctors: [], emergencyContacts: [], preventiveScreenings: [], footChecks: [], labResults: [],
    targets: { carbs: 150, calories: 1800 }, medicalProfile: {}, settings: {},
  };
}

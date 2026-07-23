import { db } from "./firebase.js";
import { doc, runTransaction } from "firebase/firestore";

// Web write-back. The mobile app keeps ALL data in one document
// (users/{uid}/appData/main) and overwrites it wholesale on sync. To write
// safely from the web we use a Firestore transaction: read the current doc,
// mutate only the relevant arrays, and write the full doc back atomically
// (Firestore retries automatically if another writer touched it in between).
//
// We update BOTH the v2 multi-profile format (profileData[pid][scopedKey],
// which the current app reads) AND the legacy flat field, so any app version
// picks up the change.

const genId = () => `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const ref = (uid) => doc(db, "users", uid, "appData", "main");
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

async function mutate(uid, fn) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref(uid));
    const data = snap.exists() ? snap.data() : {};
    fn(data);
    data.updatedAt = Date.now();
    tx.set(ref(uid), data);
  });
}

function activePid(data) {
  return data.schemaVersion >= 2 ? data.activeProfileId : null;
}

// Apply `updater(arr) -> newArr` to both the scoped (v2) and flat arrays.
function updateList(data, scopedKey, flatKey, updater) {
  const pid = activePid(data);
  if (pid) {
    data.profileData = data.profileData || {};
    data.profileData[pid] = data.profileData[pid] || {};
    const cur = Array.isArray(data.profileData[pid][scopedKey]) ? data.profileData[pid][scopedKey] : [];
    data.profileData[pid][scopedKey] = updater(cur.slice());
  }
  const flat = Array.isArray(data[flatKey]) ? data[flatKey] : [];
  data[flatKey] = updater(flat.slice());
}

const append = (item) => (arr) => [...arr, item];

/* ------------------------------ public API ----------------------------- */

export function addGlucose(uid, { value, context, ts }) {
  const item = { id: genId(), value: Math.round(Number(value)), context: context || "", ts: ts || Date.now() };
  return mutate(uid, (data) => updateList(data, "glucose-logs", "glucose", append(item)));
}

export function addFood(uid, { name, carbs, cal, meal, ts }) {
  const when = ts || Date.now();
  const item = { id: genId(), name: name || "Food", carbs: Number(carbs) || 0, cal: Number(cal) || 0, qty: 1, meal: meal || "Snack", day: dayKey(when), ts: when };
  return mutate(uid, (data) => updateList(data, "food-log", "food", append(item)));
}

export function addBloodPressure(uid, { systolic, diastolic, pulse, ts }) {
  const item = { id: genId(), systolic: Number(systolic), diastolic: Number(diastolic), pulse: pulse ? Number(pulse) : null, ts: ts || Date.now() };
  return mutate(uid, (data) => updateList(data, "blood-pressure", "bloodPressure", append(item)));
}

export function addKetone(uid, { value, ts }) {
  const item = { id: genId(), value: Number(value), ts: ts || Date.now() };
  return mutate(uid, (data) => updateList(data, "ketone-log", "ketoneLog", append(item)));
}

// Delete an entry by id from a given record kind.
const KEYS = {
  glucose: ["glucose-logs", "glucose"],
  food: ["food-log", "food"],
  bp: ["blood-pressure", "bloodPressure"],
  ketone: ["ketone-log", "ketoneLog"],
};
export function removeRecord(uid, kind, id) {
  const [scoped, flat] = KEYS[kind] || [];
  if (!scoped) return Promise.resolve();
  return mutate(uid, (data) => updateList(data, scoped, flat, (arr) => arr.filter((x) => x.id !== id)));
}

// Toggle a medication dose for today (add a med-log entry if missing, remove if present).
export function toggleMedDose(uid, { medId, date, time }) {
  const matches = (l) => l.medId === medId && l.date === date && (time == null || l.time === time);
  const toggle = (arr) =>
    arr.some(matches) ? arr.filter((l) => !matches(l)) : [...arr, { id: genId(), medId, date, time: time || null, ts: Date.now() }];
  return mutate(uid, (data) => updateList(data, "med-log", "medLog", toggle));
}

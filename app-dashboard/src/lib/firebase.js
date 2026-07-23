import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Public web config — the SAME Firebase project the mobile app uses.
// This is not a secret (security is enforced by Firestore rules, not by hiding
// this object), which is why the app ships it publicly too.
const firebaseConfig = {
  apiKey: "AIzaSyBujtG9ZeWfb9izMu1YWhYsCkomJi6LWQ0",
  authDomain: "myhealthyglucose.firebaseapp.com",
  projectId: "myhealthyglucose",
  storageBucket: "myhealthyglucose.firebasestorage.app",
  messagingSenderId: "689493699901",
  appId: "1:689493699901:web:c1f1d82bfe4b5f980d2954",
  measurementId: "G-RJ0JR6V7X8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

// Reads the single app-data document the mobile app writes:
//   users/{uid}/appData/main
export async function fetchUserData(uid) {
  const ref = doc(db, "users", uid, "appData", "main");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

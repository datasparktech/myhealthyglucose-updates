import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  LayoutGrid, LineChart as LineIcon, UtensilsCrossed, Pill, FileText, Settings as SettingsIcon,
  Bell, Search, LogOut, ChevronRight, HeartPulse, Loader2, Menu, X,
  Activity, Stethoscope, Gauge, ChefHat, User, RefreshCw, Sun, Moon,
} from "lucide-react";
import { watchAuth, signInWithGoogle, signOut, fetchUserData } from "./lib/firebase.js";
import { buildModel, screeningStatus } from "./data/transform.js";
import { useUnit } from "./lib/units.js";
import Overview from "./pages/Overview.jsx";
import GlucoseLog from "./pages/GlucoseLog.jsx";
import Patterns from "./pages/Patterns.jsx";
import Meals from "./pages/Meals.jsx";
import Recipes from "./pages/Recipes.jsx";
import Medications from "./pages/Medications.jsx";
import Vitals from "./pages/Vitals.jsx";
import Care from "./pages/Care.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid, Comp: Overview },
  { key: "glucose", label: "Glucose Log", icon: LineIcon, Comp: GlucoseLog },
  { key: "patterns", label: "Patterns", icon: Activity, Comp: Patterns },
  { key: "meals", label: "Meals", icon: UtensilsCrossed, Comp: Meals },
  { key: "recipes", label: "Recipes", icon: ChefHat, Comp: Recipes },
  { key: "meds", label: "Medications", icon: Pill, Comp: Medications },
  { key: "vitals", label: "Vitals & Labs", icon: Gauge, Comp: Vitals },
  { key: "care", label: "Care & Records", icon: Stethoscope, Comp: Care },
  { key: "reports", label: "Reports", icon: FileText, Comp: Reports },
  { key: "profile", label: "Health Profile", icon: User, Comp: Profile },
  { key: "settings", label: "Settings", icon: SettingsIcon, Comp: SettingsPage },
];

const todayStr = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/* -------------------------------- app ---------------------------------- */

export default function App() {
  const [authState, setAuthState] = useState("checking");
  const [user, setUser] = useState(null);
  const [raw, setRaw] = useState(undefined);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("mhg-theme") === "dark"; } catch { return false; } });

  useEffect(() => {
    const el = document.documentElement;
    if (dark) el.classList.add("dark"); else el.classList.remove("dark");
    try { localStorage.setItem("mhg-theme", dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);

  useEffect(() => watchAuth((u) => {
    if (u) { setUser(u); setAuthState("in"); }
    else { setUser(null); setAuthState("out"); setRaw(undefined); }
  }), []);

  useEffect(() => {
    if (authState !== "in" || !user) return;
    let alive = true;
    setLoadingData(true); setError("");
    fetchUserData(user.uid)
      .then((d) => { if (alive) setRaw(d); })
      .catch((e) => { if (alive) setError(String(e?.message || e)); })
      .finally(() => { if (alive) setLoadingData(false); });
    return () => { alive = false; };
  }, [authState, user]);

  const handleSignIn = async () => {
    setSigningIn(true); setError("");
    try { await signInWithGoogle(); }
    catch (e) { setError(`${e?.code ? `[${e.code}] ` : ""}${e?.message || "Sign-in failed"}`); }
    finally { setSigningIn(false); }
  };

  const reload = useCallback(async () => {
    if (!user) return;
    try { const d = await fetchUserData(user.uid); setRaw(d); }
    catch (e) { setError(String(e?.message || e)); }
  }, [user]);

  const model = useMemo(() => (user ? buildModel(raw, user) : null), [raw, user]);

  if (authState === "checking") return <FullLoader label="Checking your session…" />;
  if (authState === "out") return <LoginScreen onSignIn={handleSignIn} error={error} busy={signingIn} />;
  if (loadingData || raw === undefined) return <FullLoader />;

  return <Shell model={model} user={user} error={error} onSignOut={() => signOut()} reload={reload} dark={dark} setDark={setDark} />;
}

/* ------------------------------- shell --------------------------------- */

function Shell({ model, user, error, onSignOut, reload, dark, setDark }) {
  const [route, setRoute] = useState("overview");
  const [drawer, setDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const u = useUnit();
  const p = model.patient;

  const doRefresh = async () => {
    setRefreshing(true);
    const start = Date.now();
    try { await reload(); }
    finally { const wait = 600 - (Date.now() - start); setTimeout(() => setRefreshing(false), wait > 0 ? wait : 0); }
  };

  // Global search index across the user's data + pages.
  const searchIndex = useMemo(() => {
    const r = model.records || {};
    const idx = [];
    NAV.forEach((n) => idx.push({ label: n.label, sub: "Page", tab: n.key }));
    (r.food || []).forEach((f) => f?.name && idx.push({ label: f.name, sub: "Meal", tab: "meals" }));
    (r.meds || []).forEach((m) => m?.name && idx.push({ label: m.name, sub: "Medication", tab: "meds" }));
    (r.recipes || []).forEach((x) => x?.name && idx.push({ label: x.name, sub: "Recipe", tab: "recipes" }));
    (r.doctors || []).forEach((d) => d?.name && idx.push({ label: d.name, sub: d.specialty || "Doctor", tab: "care" }));
    (r.appointments || []).forEach((a) => a?.title && idx.push({ label: a.title, sub: "Appointment", tab: "care" }));
    const seen = new Set(), uniq = [];
    idx.forEach((it) => { const k = `${it.tab}|${it.label.toLowerCase()}`; if (!seen.has(k)) { seen.add(k); uniq.push(it); } });
    return uniq;
  }, [model]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return searchIndex.filter((it) => it.label.toLowerCase().includes(s) || (it.sub || "").toLowerCase().includes(s)).slice(0, 8);
  }, [q, searchIndex]);

  // Notifications derived from the user's data.
  const notifs = useMemo(() => {
    const out = [];
    const o = model.overview;
    if (o?.caution) out.push({ tone: o.caution.level, title: o.caution.title, text: o.caution.text, tab: "overview" });
    const due = (o?.medications || []).filter((m) => !m.taken).length;
    if (due > 0) out.push({ tone: "warn", title: `${due} medication dose${due > 1 ? "s" : ""} due today`, text: "Review today's schedule.", tab: "meds" });
    (o?.appointments || []).slice(0, 2).forEach((a) => out.push({ tone: "info", title: `Upcoming: ${a.title || "Appointment"}`, text: new Date(a.ts).toLocaleDateString(), tab: "care" }));
    (model.records?.preventiveScreenings || []).forEach((s) => { if (screeningStatus(s).due) out.push({ tone: "warn", title: `Screening due: ${s.label}`, text: "", tab: "care" }); });
    return out;
  }, [model]);

  const goSearch = (tab) => { setRoute(tab); setQ(""); };
  const active = NAV.find((n) => n.key === route) || NAV[0];
  const PageComp = active.Comp;

  const go = (key) => { setRoute(key); setDrawer(false); };

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      {/* Desktop sidebar */}
      <Sidebar route={route} onGo={go} onSignOut={onSignOut} className="sticky top-0 hidden h-screen lg:flex" />

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full animate-slideIn">
            <Sidebar route={route} onGo={go} onSignOut={onSignOut} className="flex h-full"
              header={<button onClick={() => setDrawer(false)} className="ml-auto text-muted"><X size={20} /></button>} />
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-5 sm:px-5 lg:px-8">
        {/* Topbar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted lg:hidden">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                {greeting()}, {p.firstName} 👋
              </h1>
              <p className="text-xs text-muted sm:text-sm">Your health snapshot for {todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => setQ(""), 150)}
                placeholder="Search…"
                className="w-44 rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 xl:w-56" />
              {q.trim() && (
                <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
                  {results.length ? results.map((it, i) => (
                    <button key={i} onMouseDown={() => goSearch(it.tab)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-canvas">
                      <span className="truncate font-semibold text-ink">{it.label}</span>
                      <span className="ml-auto whitespace-nowrap text-[11px] text-muted">{it.sub}</span>
                    </button>
                  )) : <div className="px-3 py-3 text-xs text-muted">No matches.</div>}
                </div>
              )}
            </div>
            <button onClick={doRefresh} title="Refresh data"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:text-brand-dark">
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setDark(!dark)} title="Toggle dark mode"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:text-brand-dark">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={u.toggle} title="Toggle glucose units"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-brand-dark transition hover:bg-brand-faint active:scale-95">
              {u.unitLabel}
            </button>
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} title="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:text-brand-dark">
                <Bell size={18} />
                {notifs.length > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
                    <div className="border-b border-line px-3 py-2 text-xs font-bold text-ink">Notifications</div>
                    {notifs.length ? notifs.map((n, i) => {
                      const c = n.tone === "danger" ? "text-danger" : n.tone === "warn" ? "text-warn" : "text-brand-dark";
                      return (
                        <button key={i} onClick={() => { setRoute(n.tab); setNotifOpen(false); }}
                          className="block w-full border-b border-line/60 px-3 py-2.5 text-left transition last:border-0 hover:bg-canvas">
                          <div className={`text-xs font-bold ${c}`}>{n.title}</div>
                          {n.text && <div className="mt-0.5 text-[11px] leading-snug text-muted">{n.text}</div>}
                        </button>
                      );
                    }) : <div className="px-3 py-5 text-center text-xs text-muted">You're all caught up ✓</div>}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3">
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="h-8 w-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">{p.avatarInitials}</div>}
              <div className="hidden leading-tight sm:block">
                <div className="text-xs font-bold text-ink">{p.name}</div>
                <div className="text-[10px] text-muted">{p.condition}</div>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            <X size={16} /> Couldn't load data: {error}
          </div>
        )}

        {/* Page */}
        <div key={route} className="page-enter mt-6">
          <PageComp model={model} user={user} reload={reload} onSignOut={onSignOut} />
        </div>

        <footer className="mt-8 pb-2 text-center text-xs text-muted">
          MyHealthyGlucose · Live data from your account · Not a substitute for medical advice.
        </footer>
      </main>
    </div>
  );
}

function Sidebar({ route, onGo, onSignOut, className = "", header }) {
  return (
    <aside className={`w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-4 py-6 ${className}`}>
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-soft">
          <HeartPulse size={20} strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold text-brand-dark">MyHealthy<span className="text-brand">Glucose</span></div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Health Dashboard</div>
        </div>
        {header}
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map(({ key, label, icon: Icon }) => {
          const on = route === key;
          return (
            <button key={key} onClick={() => onGo(key)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
              ${on ? "bg-brand text-white shadow-soft" : "text-muted hover:bg-brand-faint hover:text-brand-dark"}`}>
              <Icon size={18} strokeWidth={2.2} />{label}
              <ChevronRight size={16} className={`ml-auto transition-transform ${on ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-danger/10 hover:text-danger">
          <LogOut size={18} strokeWidth={2.2} /> Sign out
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------- screens ------------------------------- */

function LoginScreen({ onSignIn, error, busy }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-sans">
      <div className="animate-pop w-full max-w-sm rounded-3xl bg-surface p-8 shadow-card ring-1 ring-line/70">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-soft">
            <HeartPulse size={28} strokeWidth={2.3} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-brand-dark">MyHealthy<span className="text-brand">Glucose</span></h1>
          <p className="mt-1 text-sm text-muted">Sign in to view your health dashboard</p>
        </div>
        <button onClick={onSignIn} disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface py-3 text-sm font-bold text-ink shadow-soft transition-all duration-200 hover:bg-canvas active:scale-[0.98] disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleGlyph />}
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        {error && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          Use the same Google account as the MyHealthyGlucose app. Your data stays private to you.
        </p>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16z" />
      <path fill="#FBBC05" d="M10.5 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.9-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.4 0-11.7-3.7-13.5-8.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function FullLoader({ label = "Loading your dashboard…" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas font-sans">
      <Loader2 size={28} className="animate-spin text-brand" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, PieChart, Pie, Cell,
} from "recharts";
import {
  Droplet, LayoutGrid, LineChart as LineIcon, UtensilsCrossed, Pill,
  FileText, Settings, Bell, Search, LogOut, TrendingUp, TrendingDown,
  Minus, Activity, Flame, Target, CalendarClock, Crown, ChevronRight,
  CheckCircle2, Circle, Sparkles, AlertTriangle, Info, HeartPulse,
  Loader2, ClipboardList,
} from "lucide-react";
import { watchAuth, signInWithGoogle, signOut, fetchUserData } from "./lib/firebase.js";
import { buildDashboard } from "./data/transform.js";

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "glucose", label: "Glucose Log", icon: LineIcon },
  { key: "meals", label: "Meals", icon: UtensilsCrossed },
  { key: "meds", label: "Medications", icon: Pill },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
];

const todayStr = new Date().toLocaleDateString([], {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

/* ------------------------------ primitives ----------------------------- */

function TrendChip({ delta, unit = "", invert = false }) {
  const up = delta > 0, flat = delta === 0;
  const good = invert ? !up : up;
  const color = flat ? "text-muted bg-line/60"
    : good ? "text-brand-dark bg-brand-faint" : "text-danger bg-danger/10";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon size={13} strokeWidth={2.5} />{up ? "+" : ""}{delta}{unit}
    </span>
  );
}

function Spark({ data, color = "#0EA99A", id }) {
  const series = (data || []).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={series} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sp-${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ icon: Icon, label, value, unit, chip, spark, sparkColor, id }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line/70">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-faint text-brand-dark">
          <Icon size={18} strokeWidth={2.2} />
        </div>
        {chip}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tracking-tight text-ink">{value}</span>
        {unit && <span className="text-sm font-semibold text-muted">{unit}</span>}
      </div>
      <div className="mt-2 -mx-1"><Spark data={spark} color={sparkColor} id={id} /></div>
    </div>
  );
}

function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-card ring-1 ring-line/70 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function GoalRow({ icon: Icon, label, value, goal, pct }) {
  const clamped = Math.min(pct || 0, 100);
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={15} className="text-brand-dark" />
        <span className="font-semibold text-ink">{label}</span>
        <span className="ml-auto font-bold text-ink">{value}</span>
        <span className="text-xs text-muted">/ {goal}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function makeGlucoseTooltip(low, high) {
  return function GlucoseTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    const state = v < low ? "Low" : v > high ? "High" : "In range";
    const color = v < low ? "#D9482B" : v > high ? "#E0A03A" : "#0EA99A";
    return (
      <div className="rounded-lg bg-ink px-3 py-2 text-white shadow-lg">
        <div className="text-lg font-bold leading-none">{v} <span className="text-xs font-normal opacity-70">mg/dL</span></div>
        <div className="mt-1 text-xs font-semibold" style={{ color }}>{state}</div>
      </div>
    );
  };
}

/* ------------------------------- screens ------------------------------- */

function LoginScreen({ onSignIn, error, busy }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-sans">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card ring-1 ring-line/70">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-soft">
            <HeartPulse size={28} strokeWidth={2.3} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-brand-dark">MyHealthy<span className="text-brand">Glucose</span></h1>
          <p className="mt-1 text-sm text-muted">Sign in to view your health dashboard</p>
        </div>
        <button onClick={onSignIn} disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-canvas disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleGlyph />}
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        {error && (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
        )}
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

/* -------------------------------- app ---------------------------------- */

export default function App() {
  const [authState, setAuthState] = useState("checking"); // checking | out | in
  const [user, setUser] = useState(null);
  const [raw, setRaw] = useState(undefined); // undefined = not loaded, null = no doc
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

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
    catch (e) {
      const code = e?.code ? `[${e.code}] ` : "";
      setError(`${code}${e?.message || "Sign-in failed"}`);
    } finally { setSigningIn(false); }
  };

  const d = useMemo(() => (user ? buildDashboard(raw, user) : null), [raw, user]);

  if (authState === "checking") return <FullLoader label="Checking your session…" />;
  if (authState === "out") return <LoginScreen onSignIn={handleSignIn} error={error} busy={signingIn} />;
  if (loadingData || raw === undefined) return <FullLoader />;

  return <Dashboard d={d} user={user} error={error} onSignOut={() => signOut()} />;
}

function Dashboard({ d, user, error, onSignOut }) {
  const [active, setActive] = useState("overview");
  const [range, setRange] = useState("today");
  const p = d.patient;
  const GlucoseTooltip = useMemo(() => makeGlucoseTooltip(p.targetLow, p.targetHigh), [p]);
  const chartData = range === "today" ? d.glucoseToday : d.glucose14d;
  const hasData = d.hasGlucose;

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-soft">
            <HeartPulse size={20} strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold text-brand-dark">MyHealthy<span className="text-brand">Glucose</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Health Dashboard</div>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ key, label, icon: Icon }) => {
            const on = active === key;
            return (
              <button key={key} onClick={() => setActive(key)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
                ${on ? "bg-brand text-white shadow-soft" : "text-muted hover:bg-brand-faint hover:text-brand-dark"}`}>
                <Icon size={18} strokeWidth={2.2} />{label}
                {on && <ChevronRight size={16} className="ml-auto" />}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-dark to-brand p-4 text-white">
            <Crown size={20} className="mb-2" />
            <div className="text-sm font-bold">Go Premium</div>
            <p className="mt-0.5 text-xs text-white/80">Unlock AI insights, PDF reports &amp; Dexcom sync.</p>
            <button className="mt-3 w-full rounded-lg bg-white/95 py-2 text-xs font-bold text-brand-dark hover:bg-white">Upgrade</button>
          </div>
          <button onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-danger/10 hover:text-danger">
            <LogOut size={18} strokeWidth={2.2} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-5 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Good day, {p.firstName} 👋
            </h1>
            <p className="text-sm text-muted">Your health snapshot for {todayStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input placeholder="Search logs, meals…"
                className="w-56 rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-muted hover:text-brand-dark">
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3">
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
            <AlertTriangle size={16} /> Couldn't load data: {error}
          </div>
        )}

        {!hasData ? (
          <EmptyState name={p.firstName} />
        ) : (
          <>
            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard id="glc" icon={Droplet} label="Current Glucose" value={d.stats.currentGlucose}
                unit="mg/dL" sparkColor="#0EA99A" spark={d.sparkGlucose}
                chip={<TrendChip delta={d.stats.currentDelta} invert />} />
              <StatCard id="tir" icon={Target} label="Time in Range" value={d.stats.timeInRange}
                unit="%" sparkColor="#3FC9BA" spark={d.sparkGlucose}
                chip={<TrendChip delta={0} unit="%" />} />
              <StatCard id="a1c" icon={Activity} label="Est. A1c (GMI)" value={d.stats.estA1c}
                unit="%" sparkColor="#0A5B62" spark={d.sparkGlucose}
                chip={<TrendChip delta={d.stats.a1cDelta} unit="%" invert />} />
              <StatCard id="avg" icon={TrendingUp} label="Avg Glucose (14d)" value={d.stats.avgGlucose}
                unit="mg/dL" sparkColor="#E0A03A" spark={d.sparkGlucose}
                chip={<TrendChip delta={d.stats.avgDelta} invert />} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Left */}
              <div className="space-y-4 xl:col-span-2">
                <Card title="Glucose Trend"
                  subtitle={`Target range ${p.targetLow}–${p.targetHigh} mg/dL`}
                  action={
                    <div className="flex rounded-lg bg-canvas p-0.5 ring-1 ring-line">
                      {["today", "14d"].map((rk) => (
                        <button key={rk} onClick={() => setRange(rk)}
                          className={`rounded-md px-3 py-1 text-xs font-bold transition
                          ${range === rk ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                          {rk === "today" ? "Recent" : "14 Days"}
                        </button>
                      ))}
                    </div>
                  }>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0A5B62" /><stop offset="100%" stopColor="#0EA99A" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                      <ReferenceArea y1={p.targetLow} y2={p.targetHigh} fill="#0EA99A" fillOpacity={0.07} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false}
                        tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                      <YAxis domain={[60, 220]} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={42} />
                      <Tooltip content={<GlucoseTooltip />} />
                      <Line type="monotone" dataKey="v" stroke="url(#glLine)" strokeWidth={3}
                        dot={false} activeDot={{ r: 5, fill: "#0A5B62" }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/20" /> Target band</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand-dark" /> Glucose (mg/dL)</span>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card title="Today's Meals" subtitle={`${d.activity.carbsToday}g carbs · ${d.activity.caloriesToday} kcal`}>
                    {d.meals.length ? (
                      <ul className="space-y-3">
                        {d.meals.map((m, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-faint text-brand-dark">
                              <UtensilsCrossed size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-ink">{m.name}</div>
                              <div className="text-xs text-muted">{m.tag}{m.time ? ` · ${m.time}` : ""}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-ink">{m.carbs}g</div>
                              <div className="text-[10px] text-muted">carbs</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <Muted>No meals logged today.</Muted>}
                  </Card>

                  <Card title="Medications" subtitle={d.medications.length ? `${d.medsTaken} of ${d.medications.length} taken today` : "No medications"}>
                    {d.medications.length ? (
                      <ul className="space-y-3">
                        {d.medications.map((m, i) => (
                          <li key={i} className="flex items-center gap-3">
                            {m.taken ? <CheckCircle2 size={20} className="text-brand" /> : <Circle size={20} className="text-line" />}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-ink">{m.name}</div>
                              <div className="text-xs text-muted">{[m.dose, m.time].filter(Boolean).join(" · ")}</div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.taken ? "bg-brand-faint text-brand-dark" : "bg-warn/15 text-warn"}`}>
                              {m.taken ? "Taken" : "Due"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : <Muted>Add medications in the app to track doses.</Muted>}
                  </Card>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand text-lg font-extrabold text-white">
                      {p.avatarInitials}
                    </div>
                    <div>
                      <div className="text-base font-bold text-ink">{p.name}</div>
                      <div className="text-xs text-muted">{p.condition}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "In range", v: `${d.stats.timeInRange}%` },
                      { k: "Est. A1c", v: `${d.stats.estA1c}%` },
                      { k: "Avg", v: d.stats.avgGlucose },
                    ].map((s) => (
                      <div key={s.k} className="rounded-xl bg-canvas py-2.5">
                        <div className="text-sm font-extrabold text-brand-dark">{s.v}</div>
                        <div className="text-[10px] font-medium text-muted">{s.k}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Time in Range" subtitle="Last 14 days">
                  <div className="flex items-center gap-4">
                    <div className="relative h-32 w-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={d.timeInRange} dataKey="pct" innerRadius={44} outerRadius={62}
                            paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                            {d.timeInRange.map((s) => <Cell key={s.label} fill={s.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-ink">{d.stats.timeInRange}%</span>
                        <span className="text-[10px] font-medium text-muted">in range</span>
                      </div>
                    </div>
                    <ul className="flex-1 space-y-2">
                      {d.timeInRange.map((s) => (
                        <li key={s.label} className="flex items-center gap-2 text-sm">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                          <span className="font-semibold text-ink">{s.label}</span>
                          <span className="text-xs text-muted">{s.range}</span>
                          <span className="ml-auto font-bold text-ink">{s.pct}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card title="Today's Targets">
                  <div className="space-y-3">
                    <GoalRow icon={Flame} label="Carbs" value={`${d.activity.carbsToday}g`}
                      goal={`${d.activity.carbGoal}g`} pct={Math.round((d.activity.carbsToday / d.activity.carbGoal) * 100)} />
                    <GoalRow icon={UtensilsCrossed} label="Calories" value={d.activity.caloriesToday}
                      goal={d.activity.calGoal} pct={Math.round((d.activity.caloriesToday / d.activity.calGoal) * 100)} />
                    <GoalRow icon={ClipboardList} label="Readings" value={d.activity.readingsToday}
                      goal={d.activity.readingGoal} pct={Math.round((d.activity.readingsToday / d.activity.readingGoal) * 100)} />
                  </div>
                </Card>
              </div>
            </div>

            {/* Insights */}
            <Card title="Insights" subtitle="From your recent logs" className="mt-4"
              action={<Sparkles size={16} className="text-brand" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {d.insights.map((ins, i) => {
                  const map = {
                    good: { Icon: CheckCircle2, c: "text-brand-dark", bg: "bg-brand-faint" },
                    warn: { Icon: AlertTriangle, c: "text-warn", bg: "bg-warn/10" },
                    info: { Icon: Info, c: "text-brand-dark", bg: "bg-canvas" },
                  }[ins.tone];
                  const { Icon, c, bg } = map;
                  return (
                    <div key={i} className={`flex gap-3 rounded-xl p-3.5 ${bg}`}>
                      <Icon size={18} className={`mt-0.5 shrink-0 ${c}`} />
                      <p className="text-xs leading-relaxed text-ink">{ins.text}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        <footer className="mt-6 pb-2 text-center text-xs text-muted">
          MyHealthyGlucose · Live data from your account · Not a substitute for medical advice.
        </footer>
      </main>
    </div>
  );
}

function Muted({ children }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

function EmptyState({ name }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-card ring-1 ring-line/70">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-faint text-brand-dark">
        <Droplet size={30} strokeWidth={2} />
      </div>
      <h2 className="mt-5 text-lg font-bold text-ink">No readings synced yet, {name}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Log glucose readings, meals, and medications in the MyHealthyGlucose app.
        Once they sync, your live dashboard will appear here automatically.
      </p>
    </div>
  );
}

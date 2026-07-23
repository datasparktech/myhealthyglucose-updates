import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, PieChart, Pie, Cell,
} from "recharts";
import {
  Droplet, LayoutGrid, LineChart as LineIcon, UtensilsCrossed, Pill,
  FileText, Settings, Bell, Search, LogOut, TrendingUp, TrendingDown,
  Minus, Activity, Footprints, Flame, Target, CalendarClock, Crown,
  ChevronRight, CheckCircle2, Circle, Sparkles, AlertTriangle, Info,
  HeartPulse,
} from "lucide-react";
import {
  patient, glucoseToday, glucose14d, timeInRange, sparkGlucose, sparkA1c,
  sparkCarbs, sparkSteps, stats, meals, medications, appointments, activity,
  insights,
} from "./data/mock.js";

/* ------------------------------- helpers ------------------------------- */

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "glucose", label: "Glucose Log", icon: LineIcon },
  { key: "meals", label: "Meals", icon: UtensilsCrossed },
  { key: "meds", label: "Medications", icon: Pill },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
];

function TrendChip({ delta, unit = "", invert = false }) {
  const up = delta > 0;
  const flat = delta === 0;
  // For glucose, down is usually good — `invert` flips the color meaning.
  const good = invert ? !up : up;
  const color = flat
    ? "text-muted bg-line/60"
    : good
    ? "text-brand-dark bg-brand-faint"
    : "text-danger bg-danger/10";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon size={13} strokeWidth={2.5} />
      {up ? "+" : ""}{delta}{unit}
    </span>
  );
}

function Spark({ data, color = "#0EA99A", id }) {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={series} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#sp-${id})`} dot={false} />
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
      <div className="mt-2 -mx-1">
        <Spark data={spark} color={sparkColor} id={id} />
      </div>
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

function GlucoseTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const state = v < patient.targetLow ? "Low" : v > patient.targetHigh ? "High" : "In range";
  const color = v < patient.targetLow ? "#D9482B" : v > patient.targetHigh ? "#E0A03A" : "#0EA99A";
  return (
    <div className="rounded-lg bg-ink px-3 py-2 text-white shadow-lg">
      <div className="text-lg font-bold leading-none">{v} <span className="text-xs font-normal opacity-70">mg/dL</span></div>
      <div className="mt-1 text-xs font-semibold" style={{ color }}>{state}</div>
    </div>
  );
}

/* -------------------------------- app ---------------------------------- */

export default function App() {
  const [active, setActive] = useState("overview");
  const [range, setRange] = useState("today");
  const chartData = range === "today"
    ? glucoseToday.map((d) => ({ label: d.t, v: d.v }))
    : glucose14d.map((d) => ({ label: d.d, v: d.v }));

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      {/* ---------------------------- Sidebar --------------------------- */}
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
                <Icon size={18} strokeWidth={2.2} />
                {label}
                {on && <ChevronRight size={16} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-dark to-brand p-4 text-white">
            <Crown size={20} className="mb-2" />
            <div className="text-sm font-bold">Go Premium</div>
            <p className="mt-0.5 text-xs text-white/80">Unlock AI insights, PDF reports & Dexcom sync.</p>
            <button className="mt-3 w-full rounded-lg bg-white/95 py-2 text-xs font-bold text-brand-dark hover:bg-white">
              Upgrade
            </button>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-danger/10 hover:text-danger">
            <LogOut size={18} strokeWidth={2.2} /> Sign out
          </button>
        </div>
      </aside>

      {/* ------------------------------ Main ---------------------------- */}
      <main className="flex-1 px-5 py-6 lg:px-8">
        {/* Topbar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Good morning, {patient.firstName} 👋
            </h1>
            <p className="text-sm text-muted">
              Here's your health snapshot for Thursday, July 23, 2026
            </p>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                {patient.avatarInitials}
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-xs font-bold text-ink">{patient.name}</div>
                <div className="text-[10px] text-muted">{patient.condition}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard id="glc" icon={Droplet} label="Current Glucose" value={stats.currentGlucose}
            unit="mg/dL" sparkColor="#0EA99A" spark={sparkGlucose}
            chip={<TrendChip delta={stats.currentDelta} unit="" invert />} />
          <StatCard id="tir" icon={Target} label="Time in Range" value={stats.timeInRange}
            unit="%" sparkColor="#3FC9BA" spark={[70, 72, 74, 73, 76, 77, 78]}
            chip={<TrendChip delta={6} unit="%" />} />
          <StatCard id="a1c" icon={Activity} label="Est. A1c" value={stats.estA1c}
            unit="%" sparkColor="#0A5B62" spark={sparkA1c}
            chip={<TrendChip delta={stats.a1cDelta} unit="%" invert />} />
          <StatCard id="avg" icon={TrendingUp} label="Avg Glucose (14d)" value={stats.avgGlucose}
            unit="mg/dL" sparkColor="#E0A03A" spark={sparkGlucose}
            chip={<TrendChip delta={stats.avgDelta} unit="" invert />} />
        </div>

        {/* Main grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Left column */}
          <div className="space-y-4 xl:col-span-2">
            <Card
              title="Glucose Trend"
              subtitle={`Target range ${patient.targetLow}–${patient.targetHigh} mg/dL · ${patient.device}`}
              action={
                <div className="flex rounded-lg bg-canvas p-0.5 ring-1 ring-line">
                  {["today", "14d"].map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition
                      ${range === r ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                      {r === "today" ? "Today" : "14 Days"}
                    </button>
                  ))}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0A5B62" />
                      <stop offset="100%" stopColor="#0EA99A" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                  <ReferenceArea y1={patient.targetLow} y2={patient.targetHigh}
                    fill="#0EA99A" fillOpacity={0.07} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6D" }}
                    axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis domain={[60, 200]} tick={{ fontSize: 11, fill: "#5A6D6D" }}
                    axisLine={false} tickLine={false} width={42} />
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

            {/* Meals + Meds */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card title="Today's Meals" subtitle={`${activity.carbsToday}g carbs · ${activity.caloriesToday} kcal`}
                action={<button className="text-xs font-bold text-brand-dark hover:underline">View all</button>}>
                <ul className="space-y-3">
                  {meals.map((m) => (
                    <li key={m.name + m.time} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-faint text-brand-dark">
                        <UtensilsCrossed size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">{m.name}</div>
                        <div className="text-xs text-muted">{m.tag} · {m.time}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-ink">{m.carbs}g</div>
                        <div className="text-[10px] text-muted">carbs</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Medications" subtitle="2 of 3 taken today"
                action={<button className="text-xs font-bold text-brand-dark hover:underline">Manage</button>}>
                <ul className="space-y-3">
                  {medications.map((m, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {m.taken
                        ? <CheckCircle2 size={20} className="text-brand" />
                        : <Circle size={20} className="text-line" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">{m.name}</div>
                        <div className="text-xs text-muted">{m.dose} · {m.time}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.taken ? "bg-brand-faint text-brand-dark" : "bg-warn/15 text-warn"}`}>
                        {m.taken ? "Taken" : "Due"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Patient card */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand text-lg font-extrabold text-white">
                  {patient.avatarInitials}
                </div>
                <div>
                  <div className="text-base font-bold text-ink">{patient.name}</div>
                  <div className="text-xs text-muted">{patient.condition} · since {patient.since}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { k: "In range", v: `${stats.timeInRange}%` },
                  { k: "Est. A1c", v: `${stats.estA1c}%` },
                  { k: "Avg", v: stats.avgGlucose },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-canvas py-2.5">
                    <div className="text-sm font-extrabold text-brand-dark">{s.v}</div>
                    <div className="text-[10px] font-medium text-muted">{s.k}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Time in range donut */}
            <Card title="Time in Range" subtitle="Last 24 hours">
              <div className="flex items-center gap-4">
                <div className="relative h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeInRange} dataKey="pct" innerRadius={44} outerRadius={62}
                        paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                        {timeInRange.map((s) => <Cell key={s.label} fill={s.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-ink">{stats.timeInRange}%</span>
                    <span className="text-[10px] font-medium text-muted">in range</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2">
                  {timeInRange.map((s) => (
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

            {/* Activity */}
            <Card title="Activity & Goals">
              <div className="space-y-3">
                <GoalRow icon={Footprints} label="Steps" value={activity.steps.toLocaleString()}
                  goal={activity.stepGoal} pct={Math.round((activity.steps / activity.stepGoal) * 100)} />
                <GoalRow icon={Flame} label="Carbs" value={`${activity.carbsToday}g`}
                  goal={`${activity.carbGoal}g`} pct={Math.round((activity.carbsToday / activity.carbGoal) * 100)} />
                <GoalRow icon={Activity} label="Active min" value={`${activity.activeMinutes}m`}
                  goal="60m" pct={Math.round((activity.activeMinutes / 60) * 100)} />
              </div>
            </Card>

            {/* Appointments */}
            <Card title="Upcoming" subtitle="Appointments & labs"
              action={<CalendarClock size={16} className="text-muted" />}>
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li key={a.title} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-brand-faint">
                      <span className="text-sm font-extrabold leading-none text-brand-dark">{a.day}</span>
                      <span className="text-[9px] font-bold uppercase text-brand">{a.month}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{a.title}</div>
                      <div className="text-xs text-muted">{a.doctor}</div>
                    </div>
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold text-muted">{a.type}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Insights strip */}
        <Card title="AI Insights" subtitle="Personalized from your recent logs" className="mt-4"
          action={<Sparkles size={16} className="text-brand" />}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {insights.map((ins, i) => {
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

        <footer className="mt-6 pb-2 text-center text-xs text-muted">
          MyHealthyGlucose · Data shown is a preview. Not a substitute for medical advice.
        </footer>
      </main>
    </div>
  );
}

function GoalRow({ icon: Icon, label, value, goal, pct }) {
  const clamped = Math.min(pct, 100);
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={15} className="text-brand-dark" />
        <span className="font-semibold text-ink">{label}</span>
        <span className="ml-auto font-bold text-ink">{value}</span>
        <span className="text-xs text-muted">/ {goal}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand"
          style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

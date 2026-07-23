import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, PieChart, Pie, Cell,
} from "recharts";
import {
  Droplet, Target, Activity, TrendingUp, UtensilsCrossed, Flame, ClipboardList,
  CheckCircle2, Circle, Sparkles, AlertTriangle, Info,
} from "lucide-react";
import { Card, StatCard, TrendChip, Segmented, Muted, EmptyState, AnimatedNumber } from "../components/ui.jsx";

function tooltipFactory(low, high) {
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

export default function Overview({ model }) {
  const p = model.patient;
  const o = model.overview;
  const [range, setRange] = useState("today");
  const Tip = useMemo(() => tooltipFactory(p.targetLow, p.targetHigh), [p]);

  if (!model.hasGlucose) {
    return (
      <EmptyState icon={Droplet} title={`No readings synced yet, ${p.firstName}`}>
        Log glucose readings, meals, and medications in the MyHealthyGlucose app.
        Once they sync, your live dashboard appears here automatically.
      </EmptyState>
    );
  }

  const chartData = range === "today" ? o.glucoseToday : o.glucose14d;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard id="glc" delay={0} icon={Droplet} label="Current Glucose" value={o.stats.currentGlucose}
          unit="mg/dL" sparkColor="#0EA99A" spark={o.sparkGlucose} chip={<TrendChip delta={o.stats.currentDelta} invert />} />
        <StatCard id="tir" delay={60} icon={Target} label="Time in Range" value={o.stats.timeInRange}
          unit="%" sparkColor="#3FC9BA" spark={o.sparkGlucose} chip={<TrendChip delta={0} unit="%" />} />
        <StatCard id="a1c" delay={120} icon={Activity} label="Est. A1c (GMI)" value={o.stats.estA1c} decimals={1}
          unit="%" sparkColor="#0A5B62" spark={o.sparkGlucose} chip={<TrendChip delta={o.stats.a1cDelta} unit="%" invert />} />
        <StatCard id="avg" delay={180} icon={TrendingUp} label="Avg Glucose (14d)" value={o.stats.avgGlucose}
          unit="mg/dL" sparkColor="#E0A03A" spark={o.sparkGlucose} chip={<TrendChip delta={o.stats.avgDelta} invert />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left */}
        <div className="space-y-4 xl:col-span-2">
          <Card title="Glucose Trend" subtitle={`Target range ${p.targetLow}–${p.targetHigh} mg/dL`}
            action={<Segmented value={range} onChange={setRange}
              options={[{ value: "today", label: "Recent" }, { value: "14d", label: "14 Days" }]} />}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="glLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0A5B62" /><stop offset="100%" stopColor="#0EA99A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                <ReferenceArea y1={p.targetLow} y2={p.targetHigh} fill="#0EA99A" fillOpacity={0.07} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" minTickGap={18} />
                <YAxis domain={[60, 220]} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="v" stroke="url(#glLine)" strokeWidth={3} dot={false}
                  activeDot={{ r: 5, fill: "#0A5B62" }} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/20" /> Target band</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand-dark" /> Glucose (mg/dL)</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Today's Meals" subtitle={`${o.activity.carbsToday}g carbs · ${o.activity.caloriesToday} kcal`} hover>
              {o.meals.length ? (
                <ul className="space-y-3">
                  {o.meals.map((m, i) => (
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

            <Card title="Medications" subtitle={o.medications.length ? `${o.medsTaken} of ${o.medications.length} taken today` : "No medications"} hover>
              {o.medications.length ? (
                <ul className="space-y-3">
                  {o.medications.map((m, i) => (
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
          <Card hover>
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
                { k: "In range", v: `${o.stats.timeInRange}%` },
                { k: "Est. A1c", v: `${o.stats.estA1c}%` },
                { k: "Avg", v: o.stats.avgGlucose },
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
                    <Pie data={o.timeInRange} dataKey="pct" innerRadius={44} outerRadius={62}
                      paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                      {o.timeInRange.map((s) => <Cell key={s.label} fill={s.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-ink"><AnimatedNumber value={o.stats.timeInRange} />%</span>
                  <span className="text-[10px] font-medium text-muted">in range</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2">
                {o.timeInRange.map((s) => (
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
              <GoalRow icon={Flame} label="Carbs" value={`${o.activity.carbsToday}g`} goal={`${o.activity.carbGoal}g`}
                pct={Math.round((o.activity.carbsToday / o.activity.carbGoal) * 100)} />
              <GoalRow icon={UtensilsCrossed} label="Calories" value={o.activity.caloriesToday} goal={o.activity.calGoal}
                pct={Math.round((o.activity.caloriesToday / o.activity.calGoal) * 100)} />
              <GoalRow icon={ClipboardList} label="Readings" value={o.activity.readingsToday} goal={o.activity.readingGoal}
                pct={Math.round((o.activity.readingsToday / o.activity.readingGoal) * 100)} />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Insights" subtitle="From your recent logs" action={<Sparkles size={16} className="text-brand" />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {o.insights.map((ins, i) => {
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
    </div>
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
        <div className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-700" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

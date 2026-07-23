import React, { useMemo, useState } from "react";
import {
  ComposedChart, Area, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend,
} from "recharts";
import { Activity, CalendarDays, Tag, FlaskConical, UtensilsCrossed } from "lucide-react";
import { Card, Muted, EmptyState, PageHeader, fieldCls } from "../components/ui.jsx";
import { agpProfile, heatmap, distinctContexts, dateLabel, clampArr } from "../data/transform.js";
import { useUnit } from "../lib/units.js";

const shortHour = (h) => { const a = h < 12 ? "a" : "p"; const x = h % 12 === 0 ? 12 : h % 12; return `${x}${a}`; };

function AgpTooltip({ active, payload, unitLabel }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.p50 == null) return null;
  return (
    <div className="rounded-lg bg-ink px-3 py-2 text-white shadow-lg">
      <div className="text-xs font-semibold opacity-70">{shortHour(d.hour)}</div>
      <div className="text-base font-bold">Median {d.dp50} <span className="text-[10px] font-normal opacity-70">{unitLabel}</span></div>
      <div className="mt-0.5 text-[11px] opacity-80">IQR {d.dp25}–{d.dp75} · Range {d.dp05}–{d.dp95}</div>
    </div>
  );
}

export default function Patterns({ model }) {
  const p = model.patient;
  const glucose = model.records.glucose;
  const u = useUnit();
  const [activeCtx, setActiveCtx] = useState(() => new Set());

  const contexts = useMemo(() => distinctContexts(glucose), [glucose]);
  const filtered = useMemo(
    () => (activeCtx.size ? glucose.filter((g) => activeCtx.has(g.context)) : glucose),
    [glucose, activeCtx]
  );

  const agp = useMemo(() => agpProfile(filtered).map((b) => ({
    ...b, label: shortHour(b.hour),
    dp05: u.conv(b.p05), dp25: u.conv(b.p25), dp50: u.conv(b.p50), dp75: u.conv(b.p75), dp95: u.conv(b.p95),
    band90: b.band90 ? [u.conv(b.band90[0]), u.conv(b.band90[1])] : null,
    band50: b.band50 ? [u.conv(b.band50[0]), u.conv(b.band50[1])] : null,
    median: b.p50 == null ? null : u.conv(b.p50),
  })), [filtered, u]);

  const cells = useMemo(() => heatmap(glucose, p.targetLow, p.targetHigh, 13), [glucose, p]);
  const monthsSpan = cells.length ? `${new Date(cells[0].ts).toLocaleDateString([], { month: "short" })} – ${new Date(cells[cells.length - 1].ts).toLocaleDateString([], { month: "short" })}` : "";

  const toggleCtx = (c) => setActiveCtx((prev) => {
    const n = new Set(prev);
    n.has(c) ? n.delete(c) : n.add(c);
    return n;
  });

  if (!model.hasGlucose) {
    return <EmptyState icon={Activity} title="Not enough data for patterns yet">Once you have a few days of readings, your Ambulatory Glucose Profile and patterns appear here.</EmptyState>;
  }

  const heatColor = (c) => {
    if (c.future || c.inPct == null) return "#EEF6F4";
    if (c.inPct >= 70) return "#0EA99A";
    if (c.inPct >= 50) return "#7FD6C8";
    if (c.inPct >= 30) return "#E0A03A";
    return "#D9482B";
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Patterns" subtitle="Ambulatory Glucose Profile, daily heatmap & simulator" />

      {contexts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted"><Tag size={13} /> Filter:</span>
          {contexts.map((c) => {
            const on = activeCtx.has(c);
            return (
              <button key={c} onClick={() => toggleCtx(c)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 active:scale-95
                  ${on ? "bg-brand text-white shadow-soft" : "bg-surface text-muted ring-1 ring-line hover:text-brand-dark"}`}>
                #{c}
              </button>
            );
          })}
          {activeCtx.size > 0 && (
            <button onClick={() => setActiveCtx(new Set())} className="text-xs font-semibold text-brand-dark underline">Clear</button>
          )}
        </div>
      )}

      <Card title="Ambulatory Glucose Profile (AGP)" subtitle={`Median & variability by time of day · ${filtered.length} readings`}
        action={<Activity size={16} className="text-brand" />}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={agp} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
            <ReferenceArea y1={u.conv(p.targetLow)} y2={u.conv(p.targetHigh)} fill="#0EA99A" fillOpacity={0.06} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis domain={u.domain} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<AgpTooltip unitLabel={u.unitLabel} />} />
            <Area dataKey="band90" stroke="none" fill="#0EA99A" fillOpacity={0.12} connectNulls isAnimationActive={false} />
            <Area dataKey="band50" stroke="none" fill="#0EA99A" fillOpacity={0.28} connectNulls isAnimationActive={false} />
            <Line dataKey="median" stroke="#0A5B62" strokeWidth={2.75} dot={false} connectNulls isAnimationActive />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-dark" /> Median</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/30" /> 25–75%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/15" /> 5–95%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/10" /> Target band</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Daily Time-in-Range" subtitle={monthsSpan} className="lg:col-span-2"
          action={<CalendarDays size={16} className="text-brand" />}>
          <div className="overflow-x-auto pb-1">
            <div className="grid gap-1" style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", width: "max-content" }}>
              {cells.map((c) => (
                <div key={c.key} title={`${new Date(c.ts).toLocaleDateString()} · ${c.count ? `${c.inPct}% in range (${c.count} readings)` : "no data"}`}
                  className="h-4 w-4 rounded-[3px] transition-transform hover:scale-125"
                  style={{ background: heatColor(c) }} />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
            Less in-range
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#D9482B" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#E0A03A" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#7FD6C8" }} />
            <span className="h-3 w-3 rounded-[3px]" style={{ background: "#0EA99A" }} />
            More in-range
          </div>
        </Card>

        <Simulator patient={p} unit={u} glucose={glucose} />
      </div>

      <MealCompare glucose={glucose} food={model.records.food} patient={p} unit={u} />
    </div>
  );
}

function MealCompare({ glucose, food, patient, unit }) {
  const meals = useMemo(
    () => clampArr(food).filter((f) => f && f.ts && (f.name || f.carbs != null)).sort((a, b) => b.ts - a.ts).slice(0, 40),
    [food]
  );
  const [selA, setSelA] = useState("");
  const [selB, setSelB] = useState("");

  if (meals.length < 2) {
    return (
      <Card title="Meal vs. Spike" subtitle="Compare post-meal glucose" action={<UtensilsCrossed size={16} className="text-brand" />}>
        <Muted>Log at least two meals with glucose readings around them to compare their curves.</Muted>
      </Card>
    );
  }

  const mealA = meals.find((m) => m.id === selA) || meals[0];
  const mealB = meals.find((m) => m.id === selB) || meals[1];
  const WIN = 3 * 3600 * 1000;
  const curve = (meal) => (meal ? glucose.filter((g) => g.ts >= meal.ts && g.ts <= meal.ts + WIN).sort((a, b) => a.ts - b.ts).map((g) => ({ t: Math.round((g.ts - meal.ts) / 60000), v: g.value })) : []);
  const ca = curve(mealA), cb = curve(mealB);
  const map = {};
  ca.forEach((p) => { (map[p.t] = map[p.t] || { t: p.t }).a = unit.conv(p.v); });
  cb.forEach((p) => { (map[p.t] = map[p.t] || { t: p.t }).b = unit.conv(p.v); });
  const data = Object.values(map).sort((x, y) => x.t - y.t);
  const peak = (c) => (c.length ? Math.max(...c.map((p) => p.v)) : null);
  const label = (m) => `${m.name} · ${dateLabel(m.ts)}${m.carbs != null ? ` (${Math.round((m.carbs || 0) * (m.qty || 1))}g)` : ""}`;

  return (
    <Card title="Meal vs. Spike" subtitle="Post-meal glucose, first 3 hours" action={<UtensilsCrossed size={16} className="text-brand" />}>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-dark">● Meal A</span>
          <select className={fieldCls} value={mealA.id} onChange={(e) => setSelA(e.target.value)}>
            {meals.map((m) => <option key={m.id} value={m.id}>{label(m)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-warn">● Meal B</span>
          <select className={fieldCls} value={mealB.id} onChange={(e) => setSelB(e.target.value)}>
            {meals.map((m) => <option key={m.id} value={m.id}>{label(m)}</option>)}
          </select>
        </label>
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
            <ReferenceArea y1={unit.conv(patient.targetLow)} y2={unit.conv(patient.targetHigh)} fill="#0EA99A" fillOpacity={0.06} />
            <XAxis dataKey="t" type="number" domain={[0, 180]} tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} />
            <YAxis domain={unit.domain} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={42} />
            <Tooltip formatter={(val, name) => [`${val} ${unit.unitLabel}`, name === "a" ? "Meal A" : "Meal B"]} labelFormatter={(l) => `${l} min after`} contentStyle={{ borderRadius: 10, border: "1px solid #DCEEEC", fontSize: 12 }} />
            <Legend formatter={(v) => (v === "a" ? "Meal A" : "Meal B")} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="a" stroke="#0A5B62" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
            <Line type="monotone" dataKey="b" stroke="#E0A03A" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ) : <Muted>No glucose readings found in the 3 hours after these meals.</Muted>}
      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl bg-canvas py-2"><div className="font-extrabold text-brand-dark">{peak(ca) != null ? `${unit.conv(peak(ca))} ${unit.unitLabel}` : "—"}</div><div className="text-muted">Meal A peak</div></div>
        <div className="rounded-xl bg-canvas py-2"><div className="font-extrabold text-warn">{peak(cb) != null ? `${unit.conv(peak(cb))} ${unit.unitLabel}` : "—"}</div><div className="text-muted">Meal B peak</div></div>
      </div>
    </Card>
  );
}

function Simulator({ patient, unit, glucose }) {
  const [carbs, setCarbs] = useState(45);
  const [fiber, setFiber] = useState(6);
  const [exercise, setExercise] = useState(0);

  // Baseline: recent fasting-ish average (or overall average).
  const baseline = useMemo(() => {
    const fasting = glucose.filter((g) => /fast/i.test(g.context || ""));
    const src = (fasting.length ? fasting : glucose).map((g) => g.value);
    return src.length ? Math.round(src.reduce((s, v) => s + v, 0) / src.length) : 110;
  }, [glucose]);

  const netCarbs = Math.max(carbs - 0.5 * fiber, 0);
  const rise = netCarbs * 3.2 - exercise * 0.5; // heuristic mg/dL
  const peak = Math.max(Math.round(baseline + rise), baseline);
  const state = peak > patient.targetHigh ? "high" : peak < patient.targetLow ? "low" : "in";
  const color = state === "high" ? "#E0A03A" : state === "low" ? "#D9482B" : "#0EA99A";
  const pct = Math.min(Math.round((peak / 260) * 100), 100);

  const Slider = ({ label, value, set, min, max, unitLbl }) => (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="font-bold text-brand-dark">{value} {unitLbl}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand" />
    </div>
  );

  return (
    <Card title="What-If Simulator" subtitle="Rough estimate" action={<FlaskConical size={16} className="text-brand" />}>
      <div className="mb-4 text-center">
        <div className="text-4xl font-extrabold" style={{ color }}>{unit.conv(peak)}</div>
        <div className="text-[11px] font-medium text-muted">est. peak {unit.unitLabel}</div>
        <div className="mx-auto mt-3 h-2 w-full overflow-hidden rounded-full bg-line/70">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <div className="space-y-3">
        <Slider label="Carbs" value={carbs} set={setCarbs} min={0} max={120} unitLbl="g" />
        <Slider label="Fiber" value={fiber} set={setFiber} min={0} max={30} unitLbl="g" />
        <Slider label="Walk after" value={exercise} set={setExercise} min={0} max={60} unitLbl="min" />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Heuristic estimate from your ~{unit.conv(baseline)} {unit.unitLabel} baseline. Individual responses vary —
        not medical advice.
      </p>
    </Card>
  );
}

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import { Droplet, TrendingUp, Target, Activity, ArrowDown, ArrowUp, Gauge } from "lucide-react";
import { Card, Segmented, Muted, EmptyState, PageHeader } from "../components/ui.jsx";
import {
  glucoseStats, glucoseState, STATE_COLOR, dateLabel, timeLabel, fullDateLabel, dayKey, mean, DAY,
} from "../data/transform.js";
import { useUnit } from "../lib/units.js";

const RANGES = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
];
const FILTERS = [
  { value: "all", label: "All" },
  { value: "in", label: "In range" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
];
const TILE_ACCENT = [
  "bg-brand-faint text-brand-dark",
  "bg-violet-100 text-violet-600",
  "bg-sky-100 text-sky-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-indigo-100 text-indigo-600",
];

export default function GlucoseLog({ model }) {
  const p = model.patient;
  const u = useUnit();
  const [days, setDays] = useState(14);
  const [filter, setFilter] = useState("all");
  const glucose = model.records.glucose;
  const now = Date.now();

  const inRange = useMemo(() => glucose.filter((g) => now - g.ts <= days * DAY), [glucose, days, now]);
  const stats = useMemo(() => glucoseStats(inRange.map((g) => g.value), p.targetLow, p.targetHigh), [inRange, p]);

  const chart = useMemo(() => {
    const byDay = {};
    inRange.forEach((g) => { (byDay[dayKey(g.ts)] ||= []).push(g.value); });
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const k = dayKey(now - i * DAY);
      if (byDay[k]) out.push({ label: dateLabel(now - i * DAY), v: u.conv(Math.round(mean(byDay[k]))) });
    }
    return out;
  }, [inRange, days, now, u]);

  const readings = useMemo(() => {
    const list = [...inRange].sort((a, b) => b.ts - a.ts);
    if (filter === "all") return list.slice(0, 60);
    return list.filter((g) => glucoseState(g.value, p.targetLow, p.targetHigh) === filter).slice(0, 60);
  }, [inRange, filter, p]);

  if (!model.hasGlucose) {
    return <EmptyState icon={Droplet} title="No glucose readings yet">Log readings in the app and they'll show up here.</EmptyState>;
  }

  const gl = u.unitLabel;
  const lowD = u.conv(p.targetLow), highD = u.conv(p.targetHigh);
  const tiles = [
    { icon: Activity, label: "Average", value: u.conv(stats.avg), unit: gl },
    { icon: Gauge, label: "Est. A1c (GMI)", value: stats.gmi, unit: "%" },
    { icon: Target, label: "Time in Range", value: stats.inPct, unit: "%" },
    { icon: TrendingUp, label: "Variability (SD)", value: u.conv(stats.std), unit: gl },
    { icon: ArrowDown, label: "Lowest", value: u.conv(stats.min), unit: gl },
    { icon: ArrowUp, label: "Highest", value: u.conv(stats.max), unit: gl },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Glucose Log" subtitle={`${stats.count} readings in the last ${days} days`}
        action={<Segmented value={days} onChange={setDays} options={RANGES} />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => (
          <div key={t.label} style={{ animationDelay: `${i * 50}ms` }}
            className="animate-fadeUp rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_26px_rgba(10,91,98,0.12)]">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${TILE_ACCENT[i % 6]}`}><t.icon size={16} /></div>
            <div className="mt-2 text-2xl font-extrabold text-ink">{t.value}</div>
            <div className="text-[11px] font-medium text-muted">{t.label} <span className="opacity-70">{t.unit}</span></div>
          </div>
        ))}
      </div>

      <Card title="Daily Average Trend" subtitle={`Target ${lowD}–${highD} ${gl}`}>
        {chart.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chart} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="glLine2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0A5B62" /><stop offset="100%" stopColor="#0EA99A" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
              <ReferenceArea y1={lowD} y2={highD} fill="#0EA99A" fillOpacity={0.07} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false}
                interval="preserveStartEnd" minTickGap={22} />
              <YAxis domain={u.domain} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip formatter={(v) => [`${v} ${gl}`, "Avg"]} labelStyle={{ color: "#5A6D6D" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #DCEEEC", fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke="url(#glLine2)" strokeWidth={3} dot={{ r: 2.5, fill: "#0A5B62" }}
                activeDot={{ r: 5 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        ) : <Muted>No readings in this range.</Muted>}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Distribution" subtitle="Share of readings" className="lg:col-span-1">
          <div className="space-y-4 pt-1">
            {[
              { k: "In range", pct: stats.inPct, color: STATE_COLOR.in, sub: `${lowD}–${highD}` },
              { k: "High", pct: stats.highPct, color: STATE_COLOR.high, sub: `>${highD}` },
              { k: "Low", pct: stats.lowPct, color: STATE_COLOR.low, sub: `<${lowD}` },
            ].map((b) => (
              <div key={b.k}>
                <div className="mb-1 flex items-center text-sm">
                  <span className="font-semibold text-ink">{b.k}</span>
                  <span className="ml-2 text-xs text-muted">{b.sub}</span>
                  <span className="ml-auto font-bold text-ink">{b.pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line/70">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Readings" subtitle="Most recent first" className="lg:col-span-2"
          action={<Segmented value={filter} onChange={setFilter} options={FILTERS} />}>
          {readings.length ? (
            <ul className="divide-y divide-line/70">
              {readings.map((g) => {
                const st = glucoseState(g.value, p.targetLow, p.targetHigh);
                return (
                  <li key={g.id || g.ts} className="flex items-center gap-3 py-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATE_COLOR[st] }} />
                    <span className="w-14 text-lg font-extrabold text-ink">{u.conv(g.value)}</span>
                    <span className="text-xs text-muted">{gl}</span>
                    <span className="ml-3 truncate text-xs font-medium text-muted">{g.context || "—"}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-muted">{fullDateLabel(g.ts)} · {timeLabel(g.ts)}</span>
                  </li>
                );
              })}
            </ul>
          ) : <Muted>No readings match this filter.</Muted>}
        </Card>
      </div>
    </div>
  );
}

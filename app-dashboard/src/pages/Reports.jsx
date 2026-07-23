import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  FileText, Printer, FileSpreadsheet, Sparkles, CheckSquare, Square, AlertTriangle,
  CheckCircle2, Info, X,
} from "lucide-react";
import { Card, Segmented, Button, EmptyState, PageHeader, Badge } from "../components/ui.jsx";
import { glucoseStats, patternAlerts, dayKey, fullDateLabel, timeLabel, DAY, clampArr, mean } from "../data/transform.js";
import { useUnit } from "../lib/units.js";

const RANGES = [{ value: 14, label: "14 Days" }, { value: 30, label: "30 Days" }, { value: 90, label: "90 Days" }];
const SECTIONS = [
  { key: "summary", label: "14-day average & eA1c" },
  { key: "tir", label: "Time-in-range chart" },
  { key: "highsLows", label: "Highs & lows breakdown" },
  { key: "raw", label: "Detailed logbook table" },
];

export default function Reports({ model }) {
  const p = model.patient;
  const u = useUnit();
  const [days, setDays] = useState(30);
  const [sections, setSections] = useState({ summary: true, tir: true, highsLows: true, raw: false });
  const [focus, setFocus] = useState(null); // pattern-alert window filter
  const now = Date.now();

  const glucose = clampArr(model.records.glucose);
  const food = clampArr(model.records.food);
  const medLog = clampArr(model.records.medLog);
  const meds = clampArr(model.records.meds);

  const gInRange = useMemo(() => glucose.filter((g) => now - g.ts <= days * DAY), [glucose, days, now]);
  const stats = useMemo(() => glucoseStats(gInRange.map((g) => g.value), p.targetLow, p.targetHigh), [gInRange, p]);
  const alerts = useMemo(() => patternAlerts(glucose, p.targetLow, p.targetHigh), [glucose, p]);

  const avgCarbs = useMemo(() => {
    const perDay = {};
    food.filter((f) => (f.ts ? now - f.ts <= days * DAY : true)).forEach((f) => {
      const k = f.day || dayKey(f.ts);
      perDay[k] = (perDay[k] || 0) + Math.round((f.carbs || 0) * (f.qty || 1));
    });
    const vals = Object.values(perDay);
    return vals.length ? Math.round(mean(vals)) : 0;
  }, [food, days, now]);

  const adherence = useMemo(() => {
    const perDay = meds.reduce((s, m) => s + (Array.isArray(m.times) && m.times.length ? m.times.length : 1), 0);
    if (!perDay) return null;
    let sum = 0;
    for (let i = 0; i < days; i++) sum += Math.min(medLog.filter((l) => l.date === dayKey(now - i * DAY)).length / perDay, 1);
    return Math.round((sum / days) * 100);
  }, [meds, medLog, days, now]);

  const inFocus = (g) => {
    if (!focus) return true;
    const d = new Date(g.ts), dow = d.getDay(), h = d.getHours();
    return (!focus.days || focus.days.includes(dow)) && h >= focus.h0 && h < focus.h1;
  };
  const rawRows = useMemo(
    () => [...gInRange].filter(inFocus).sort((a, b) => b.ts - a.ts),
    [gInRange, focus]
  );

  if (!model.hasGlucose) {
    return <EmptyState icon={FileText} title="No data to report yet">Once you have readings, generate and export summary reports here.</EmptyState>;
  }

  const exportCsv = () => {
    const rows = [["Date", "Time", `Glucose (${u.unitLabel})`, "Context"]];
    rawRows.forEach((g) => {
      const d = new Date(g.ts);
      rows.push([d.toLocaleDateString(), d.toLocaleTimeString(), u.conv(g.value), (g.context || "").replace(/,/g, " ")]);
    });
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `glucose-${days}d-${dayKey()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (k) => setSections((s) => ({ ...s, [k]: !s[k] }));
  const tir = [
    { label: "In range", pct: stats.inPct, color: "#0EA99A" },
    { label: "High", pct: stats.highPct, color: "#E0A03A" },
    { label: "Low", pct: stats.lowPct, color: "#D9482B" },
  ];
  const metrics = [
    sections.summary && { label: `Average glucose`, value: `${u.conv(stats.avg)} ${u.unitLabel}` },
    sections.summary && { label: "Estimated A1c (GMI)", value: `${stats.gmi}%` },
    { label: "Time in range", value: `${stats.inPct}%` },
    { label: "Variability (SD)", value: `${u.conv(stats.std)} ${u.unitLabel}` },
    { label: "Lowest / Highest", value: `${u.conv(stats.min)} / ${u.conv(stats.max)}` },
    { label: "Total readings", value: stats.count },
    { label: "Avg daily carbs", value: `${avgCarbs} g` },
    ...(adherence != null ? [{ label: "Med adherence", value: `${adherence}%` }] : []),
  ].filter(Boolean);

  const ALERT_ICON = { good: CheckCircle2, warn: AlertTriangle, danger: AlertTriangle, info: Info };
  const ALERT_BG = { good: "bg-brand-faint", warn: "bg-warn/10", danger: "bg-danger/10", info: "bg-canvas" };
  const ALERT_FG = { good: "text-brand-dark", warn: "text-warn", danger: "text-danger", info: "text-brand-dark" };

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Build a doctor-ready summary, then export"
        action={
          <div className="no-print flex items-center gap-2">
            <Segmented value={days} onChange={setDays} options={RANGES} />
            <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={exportCsv}>CSV</Button>
            <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
          </div>
        } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Builder controls */}
        <div className="no-print space-y-4">
          <Card title="Include sections">
            <ul className="space-y-1">
              {SECTIONS.map((s) => {
                const on = sections[s.key];
                return (
                  <li key={s.key}>
                    <button onClick={() => toggle(s.key)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-canvas">
                      {on ? <CheckSquare size={18} className="text-brand" /> : <Square size={18} className="text-line" />}
                      <span className={`font-semibold ${on ? "text-ink" : "text-muted"}`}>{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Smart Pattern Alerts" subtitle="Tap to filter the logbook" action={<Sparkles size={16} className="text-brand" />}>
            {alerts.length ? (
              <div className="space-y-2.5">
                {alerts.map((a) => {
                  const Icon = ALERT_ICON[a.tone] || Info;
                  const activeFocus = focus && a.filter && focus.label === a.filter.label;
                  return (
                    <button key={a.id} onClick={() => a.filter && setFocus(activeFocus ? null : a.filter)}
                      disabled={!a.filter}
                      className={`flex w-full gap-2.5 rounded-xl p-3 text-left transition ${ALERT_BG[a.tone]} ${a.filter ? "hover:ring-2 hover:ring-brand/30" : ""} ${activeFocus ? "ring-2 ring-brand" : ""}`}>
                      <Icon size={17} className={`mt-0.5 shrink-0 ${ALERT_FG[a.tone]}`} />
                      <div>
                        <div className="text-xs font-bold text-ink">{a.title}</div>
                        <div className="text-[11px] leading-relaxed text-muted">{a.text}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : <p className="py-4 text-center text-xs text-muted">No notable patterns detected. Nice and steady.</p>}
          </Card>
        </div>

        {/* Live preview */}
        <Card className="print-full lg:col-span-2">
          <div className="mb-5 flex items-start justify-between border-b border-line pb-4">
            <div>
              <div className="text-lg font-extrabold text-brand-dark">MyHealthyGlucose — Health Summary</div>
              <div className="text-sm text-muted">{p.name}{p.email ? ` · ${p.email}` : ""} · {p.condition}</div>
            </div>
            <div className="text-right text-xs text-muted">
              <div>Period: last {days} days</div>
              <div>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-canvas p-3.5">
                <div className="text-lg font-extrabold text-ink">{m.value}</div>
                <div className="mt-0.5 text-[11px] font-medium text-muted">{m.label}</div>
              </div>
            ))}
          </div>

          {sections.tir && (
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tir} dataKey="pct" innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                      {tir.map((s) => <Cell key={s.label} fill={s.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-ink">{stats.inPct}%</span>
                  <span className="text-[10px] text-muted">in range</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2 text-sm font-bold text-ink">Time in range ({p.targetLow}–{p.targetHigh} mg/dL)</div>
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div style={{ width: `${stats.lowPct}%`, background: "#D9482B" }} />
                  <div style={{ width: `${stats.inPct}%`, background: "#0EA99A" }} />
                  <div style={{ width: `${stats.highPct}%`, background: "#E0A03A" }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                  <span>Low {stats.lowPct}%</span><span>In range {stats.inPct}%</span><span>High {stats.highPct}%</span>
                </div>
              </div>
            </div>
          )}

          {sections.highsLows && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <HL label="Low events" value={rowsCount(gInRange, (g) => g.value < p.targetLow)} color="#D9482B" />
              <HL label="In-range readings" value={rowsCount(gInRange, (g) => g.value >= p.targetLow && g.value <= p.targetHigh)} color="#0EA99A" />
              <HL label="High events" value={rowsCount(gInRange, (g) => g.value > p.targetHigh)} color="#E0A03A" />
            </div>
          )}

          {sections.raw && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-bold text-ink">Logbook</div>
                {focus && <Badge tone="warn">Filtered: {focus.label}</Badge>}
                {focus && <button onClick={() => setFocus(null)} className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark"><X size={11} />clear</button>}
                <span className="ml-auto text-[11px] text-muted">{rawRows.length} readings</span>
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                    <tr className="border-b border-line"><th className="py-2 font-semibold">Date & time</th><th className="py-2 font-semibold">Glucose</th><th className="py-2 font-semibold">Context</th></tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 300).map((g) => (
                      <tr key={g.id || g.ts} className="border-b border-line/60">
                        <td className="py-2 text-muted">{fullDateLabel(g.ts)} · {timeLabel(g.ts)}</td>
                        <td className="py-2 font-bold text-ink">{u.conv(g.value)} <span className="text-xs font-normal text-muted">{u.unitLabel}</span></td>
                        <td className="py-2 text-muted">{g.context || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="mt-6 text-[11px] leading-relaxed text-muted">
            Estimated A1c is derived from average glucose (GMI) and may differ from a lab HbA1c.
            Informational only — not a substitute for professional medical advice.
          </p>
        </Card>
      </div>
    </div>
  );
}

function rowsCount(arr, pred) { return arr.filter(pred).length; }

function HL({ label, value, color }) {
  return (
    <div className="rounded-xl border border-line p-3 text-center">
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium text-muted">{label}</div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import { Card, Segmented, Button, EmptyState, PageHeader } from "../components/ui.jsx";
import { glucoseStats, dayKey, fullDateLabel, timeLabel, DAY, clampArr, mean } from "../data/transform.js";

const RANGES = [
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
];

export default function Reports({ model }) {
  const p = model.patient;
  const [days, setDays] = useState(30);
  const now = Date.now();
  const glucose = clampArr(model.records.glucose);
  const food = clampArr(model.records.food);
  const medLog = clampArr(model.records.medLog);
  const meds = clampArr(model.records.meds);

  const gInRange = useMemo(() => glucose.filter((g) => now - g.ts <= days * DAY), [glucose, days, now]);
  const stats = useMemo(() => glucoseStats(gInRange.map((g) => g.value), p.targetLow, p.targetHigh), [gInRange, p]);

  const avgCarbs = useMemo(() => {
    const perDay = {};
    food.filter((f) => f.ts ? now - f.ts <= days * DAY : true).forEach((f) => {
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
    for (let i = 0; i < days; i++) {
      const taken = medLog.filter((l) => l.date === dayKey(now - i * DAY)).length;
      sum += Math.min(taken / perDay, 1);
    }
    return Math.round((sum / days) * 100);
  }, [meds, medLog, days, now]);

  if (!model.hasGlucose) {
    return <EmptyState icon={FileText} title="No data to report yet">Once you have readings, generate and export summary reports here.</EmptyState>;
  }

  const exportCsv = () => {
    const rows = [["Date", "Time", "Glucose (mg/dL)", "Context"]];
    [...gInRange].sort((a, b) => b.ts - a.ts).forEach((g) => {
      const d = new Date(g.ts);
      rows.push([d.toLocaleDateString(), d.toLocaleTimeString(), g.value, (g.context || "").replace(/,/g, " ")]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glucose-${days}d-${dayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metrics = [
    { label: "Average glucose", value: `${stats.avg} mg/dL` },
    { label: "Estimated A1c (GMI)", value: `${stats.gmi}%` },
    { label: "Time in range", value: `${stats.inPct}%` },
    { label: "Time high", value: `${stats.highPct}%` },
    { label: "Time low", value: `${stats.lowPct}%` },
    { label: "Glucose variability (SD)", value: `${stats.std} mg/dL` },
    { label: "Lowest / Highest", value: `${stats.min} / ${stats.max}` },
    { label: "Total readings", value: stats.count },
    { label: "Avg daily carbs", value: `${avgCarbs} g` },
    ...(adherence != null ? [{ label: "Medication adherence", value: `${adherence}%` }] : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Summaries you can share with your doctor"
        action={
          <div className="no-print flex items-center gap-2">
            <Segmented value={days} onChange={setDays} options={RANGES} />
            <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={exportCsv}>CSV</Button>
            <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
          </div>
        } />

      <Card className="print-full">
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-canvas p-3.5">
              <div className="text-lg font-extrabold text-ink">{m.value}</div>
              <div className="mt-0.5 text-[11px] font-medium text-muted">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm font-bold text-ink">Target range</div>
          <div className="flex h-4 overflow-hidden rounded-full">
            <div style={{ width: `${stats.lowPct}%`, background: "#D9482B" }} />
            <div style={{ width: `${stats.inPct}%`, background: "#0EA99A" }} />
            <div style={{ width: `${stats.highPct}%`, background: "#E0A03A" }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>Low {stats.lowPct}%</span>
            <span>In range {p.targetLow}–{p.targetHigh}: {stats.inPct}%</span>
            <span>High {stats.highPct}%</span>
          </div>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-muted">
          Estimated A1c is derived from average glucose (Glucose Management Indicator) and may differ
          from a lab HbA1c. This summary is informational and not a substitute for professional medical advice.
        </p>
      </Card>

      <Card title="Reading Detail" subtitle={`${gInRange.length} readings · last ${days} days`} className="no-print">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 font-semibold">Date & time</th>
                <th className="py-2 font-semibold">Glucose</th>
                <th className="py-2 font-semibold">Context</th>
              </tr>
            </thead>
            <tbody>
              {[...gInRange].sort((a, b) => b.ts - a.ts).slice(0, 200).map((g) => (
                <tr key={g.id || g.ts} className="border-b border-line/60">
                  <td className="py-2 text-muted">{fullDateLabel(g.ts)} · {timeLabel(g.ts)}</td>
                  <td className="py-2 font-bold text-ink">{g.value} <span className="text-xs font-normal text-muted">mg/dL</span></td>
                  <td className="py-2 text-muted">{g.context || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

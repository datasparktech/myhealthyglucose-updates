import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { HeartPulse, Activity, Droplets, Gauge, Plus } from "lucide-react";
import { Card, Muted, EmptyState, PageHeader, Badge, Button, Modal, Field, fieldCls } from "../components/ui.jsx";
import { dateLabel, fullDateLabel, timeLabel, clampArr } from "../data/transform.js";
import { addBloodPressure, addKetone } from "../lib/writes.js";

const ketoneLevel = (v) => {
  if (v == null) return { label: "—", tone: "neutral" };
  if (v >= 1.5) return { label: "High", tone: "danger" };
  if (v >= 0.6) return { label: "Elevated", tone: "warn" };
  return { label: "Normal", tone: "good" };
};

export default function Vitals({ model, user, reload }) {
  const r = model.records;
  const bp = useMemo(() => [...clampArr(r.bloodPressure)].filter((b) => b.ts).sort((a, b) => a.ts - b.ts), [r]);
  const a1c = useMemo(() => [...clampArr(r.hba1c)].filter((h) => h.value != null).sort((a, b) => new Date(a.date) - new Date(b.date)), [r]);
  const ketones = useMemo(() => [...clampArr(r.ketoneLog)].filter((k) => k.ts).sort((a, b) => b.ts - a.ts), [r]);

  const [modal, setModal] = useState(null); // 'bp' | 'ketone' | null
  const [bpForm, setBpForm] = useState({ sys: "", dia: "", pulse: "" });
  const [kForm, setKForm] = useState({ value: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const openBp = () => { setBpForm({ sys: "", dia: "", pulse: "" }); setErr(""); setModal("bp"); };
  const openK = () => { setKForm({ value: "" }); setErr(""); setModal("ketone"); };
  const saveBp = async () => {
    if (!bpForm.sys || !bpForm.dia) { setErr("Enter systolic and diastolic."); return; }
    setSaving(true); setErr("");
    try { await addBloodPressure(user.uid, { systolic: bpForm.sys, diastolic: bpForm.dia, pulse: bpForm.pulse }); await reload(); setModal(null); }
    catch (e) { setErr(String(e?.message || e)); } finally { setSaving(false); }
  };
  const saveK = async () => {
    if (!kForm.value) { setErr("Enter a ketone value."); return; }
    setSaving(true); setErr("");
    try { await addKetone(user.uid, { value: kForm.value }); await reload(); setModal(null); }
    catch (e) { setErr(String(e?.message || e)); } finally { setSaving(false); }
  };

  const addButtons = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" icon={Plus} onClick={openBp}>BP</Button>
      <Button variant="outline" size="sm" icon={Plus} onClick={openK}>Ketone</Button>
    </div>
  );
  const modals = (
    <>
      <Modal open={modal === "bp"} onClose={() => setModal(null)} title="Add blood pressure">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Systolic"><input type="number" autoFocus className={fieldCls} value={bpForm.sys} onChange={(e) => setBpForm({ ...bpForm, sys: e.target.value })} placeholder="120" /></Field>
            <Field label="Diastolic"><input type="number" className={fieldCls} value={bpForm.dia} onChange={(e) => setBpForm({ ...bpForm, dia: e.target.value })} placeholder="80" /></Field>
            <Field label="Pulse"><input type="number" className={fieldCls} value={bpForm.pulse} onChange={(e) => setBpForm({ ...bpForm, pulse: e.target.value })} placeholder="—" /></Field>
          </div>
          {err && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button size="sm" onClick={saveBp} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={modal === "ketone"} onClose={() => setModal(null)} title="Add ketone reading">
        <div className="space-y-3">
          <Field label="Ketones (mmol/L)"><input type="number" step="any" autoFocus className={fieldCls} value={kForm.value} onChange={(e) => setKForm({ value: e.target.value })} placeholder="e.g. 0.4" /></Field>
          {err && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button size="sm" onClick={saveK} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );

  if (!bp.length && !a1c.length && !ketones.length) {
    return (
      <div className="space-y-4">
        <PageHeader title="Vitals & Labs" subtitle="No vitals yet" action={addButtons} />
        <EmptyState icon={HeartPulse} title="No vitals logged yet">Add blood pressure or ketones, or log in the app.</EmptyState>
        {modals}
      </div>
    );
  }

  const bpChart = bp.slice(-30).map((b) => ({ label: dateLabel(b.ts), sys: b.systolic, dia: b.diastolic }));
  const latestBp = bp[bp.length - 1];
  const a1cChart = a1c.slice(-12).map((h) => ({ label: h.date ? dateLabel(new Date(h.date).getTime()) : "", v: h.value }));
  const latestA1c = a1c[a1c.length - 1];
  const latestK = ketones[0];
  const kLevel = ketoneLevel(latestK?.value ?? latestK?.level);

  const avgBp = latestBp ? bpStatus(latestBp.systolic, latestBp.diastolic) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Vitals & Labs" subtitle="Blood pressure, ketones & A1c" action={addButtons} />
      {modals}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={HeartPulse} accent="bg-rose-100 text-rose-600" label="Blood pressure"
          value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"} sub={avgBp?.label || "mmHg"} />
        <MiniStat icon={Activity} accent="bg-violet-100 text-violet-600" label="Latest A1c"
          value={latestA1c ? `${latestA1c.value}%` : "—"} sub={latestA1c?.date ? dateLabel(new Date(latestA1c.date).getTime()) : "no labs"} />
        <MiniStat icon={Droplets} accent="bg-sky-100 text-sky-600" label="Ketones"
          value={latestK ? (latestK.value ?? latestK.level ?? "—") : "—"} sub={kLevel.label} />
        <MiniStat icon={Gauge} accent="bg-amber-100 text-amber-600" label="BP readings" value={bp.length} sub="logged" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Blood Pressure" subtitle={latestBp ? `Latest ${latestBp.systolic}/${latestBp.diastolic} mmHg${latestBp.pulse ? ` · ${latestBp.pulse} bpm` : ""}` : "No readings"}
          action={<HeartPulse size={16} className="text-rose-500" />} className="xl:col-span-2">
          {bpChart.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={bpChart} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5A6D6D" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis domain={[50, 180]} tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={38} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DCEEEC", fontSize: 12 }} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="sys" name="Systolic" stroke="#E11D48" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Muted>Log blood pressure in the app to see trends.</Muted>}
        </Card>

        <Card title="A1c History" subtitle={latestA1c ? `Latest ${latestA1c.value}%` : "No labs"} action={<Activity size={16} className="text-violet-500" />}>
          {a1cChart.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={a1cChart} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5A6D6D" }} axisLine={false} tickLine={false} />
                <YAxis domain={[5, 10]} tick={{ fontSize: 10, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip formatter={(v) => [`${v}%`, "A1c"]} contentStyle={{ borderRadius: 10, border: "1px solid #DCEEEC", fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: "#7C3AED" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Muted>No A1c labs logged.</Muted>}
        </Card>
      </div>

      {ketones.length > 0 && (
        <Card title="Ketone Log" subtitle="Most recent first" action={<Droplets size={16} className="text-sky-500" />}>
          <ul className="divide-y divide-line/70">
            {ketones.slice(0, 20).map((k) => {
              const lv = ketoneLevel(k.value ?? k.level);
              return (
                <li key={k.id || k.ts} className="flex items-center gap-3 py-2.5">
                  <Droplets size={16} className="text-sky-500" />
                  <span className="text-lg font-extrabold text-ink">{k.value ?? k.level ?? "—"}</span>
                  <span className="text-xs text-muted">mmol/L</span>
                  <span className="ml-3"><Badge tone={lv.tone}>{lv.label}</Badge></span>
                  <span className="ml-auto text-xs text-muted">{fullDateLabel(k.ts)} · {timeLabel(k.ts)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function bpStatus(sys, dia) {
  if (sys >= 140 || dia >= 90) return { label: "High", tone: "danger" };
  if (sys >= 130 || dia >= 80) return { label: "Elevated", tone: "warn" };
  if (sys < 90 || dia < 60) return { label: "Low", tone: "warn" };
  return { label: "Normal", tone: "good" };
}

function MiniStat({ icon: Icon, label, value, sub, accent = "bg-brand-faint text-brand-dark" }) {
  return (
    <div className="animate-fadeUp rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_26px_rgba(10,91,98,0.12)]">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}><Icon size={16} /></div>
      <div className="mt-2 text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-[11px] font-medium text-muted">{label} <span className="opacity-70">· {sub}</span></div>
    </div>
  );
}

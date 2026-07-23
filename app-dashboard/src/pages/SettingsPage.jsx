import React, { useState } from "react";
import {
  User, HeartPulse, LogOut, Shield, FileText, Smartphone, Database, CheckCircle2, Pencil,
} from "lucide-react";
import { Card, Button, PageHeader, Badge, Modal, Field, fieldCls } from "../components/ui.jsx";
import { updateTargets } from "../lib/writes.js";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

export default function SettingsPage({ model, user, onSignOut, reload }) {
  const p = model.patient;
  const t = model.records.targets || {};
  const updated = model.updatedAt ? new Date(model.updatedAt).toLocaleString() : "—";

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ carbs: "", calories: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const openEdit = () => { setForm({ carbs: String(t.carbs ?? 150), calories: String(t.calories ?? 1800) }); setErr(""); setShow(true); };
  const save = async () => {
    setSaving(true); setErr("");
    try { await updateTargets(user.uid, { carbs: Number(form.carbs) || 0, calories: Number(form.calories) || 0 }); await reload(); setShow(false); }
    catch (e) { setErr(String(e?.message || e)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Account, health profile & preferences" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Account" action={<User size={16} className="text-brand" />}>
          <div className="flex items-center gap-4">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="h-14 w-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand text-lg font-extrabold text-white">{p.avatarInitials}</div>}
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-ink">{p.name}</div>
              <div className="truncate text-sm text-muted">{p.email || "Signed in with Google"}</div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="danger" icon={LogOut} onClick={onSignOut}>Sign out</Button>
          </div>
        </Card>

        <Card title="Health Profile"
          action={<button onClick={openEdit} className="flex items-center gap-1 text-xs font-bold text-brand-dark hover:underline"><Pencil size={13} /> Edit goals</button>}>
          <Row label="Condition" value={p.condition} />
          <Row label="Target range" value={`${p.targetLow}–${p.targetHigh} mg/dL`} />
          <Row label="Daily carb goal" value={`${t.carbs ?? 150} g`} />
          <Row label="Daily calorie goal" value={`${t.calories ?? 1800} kcal`} />
          <p className="mt-3 text-[11px] text-muted">Carb & calorie goals are editable here; glucose target range is set in the app.</p>
        </Card>

        <Modal open={show} onClose={() => setShow(false)} title="Edit daily goals">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily carbs (g)"><input type="number" autoFocus className={fieldCls} value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} /></Field>
              <Field label="Daily calories"><input type="number" className={fieldCls} value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></Field>
            </div>
            {err && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{err}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShow(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save goals"}</Button>
            </div>
          </div>
        </Modal>

        <Card title="Data & Sync" action={<Database size={16} className="text-brand" />}>
          <Row label="Source" value={<span className="inline-flex items-center gap-1"><CheckCircle2 size={13} className="text-brand" /> Firebase (live)</span>} />
          <Row label="Glucose unit" value="mg/dL" />
          <Row label="Last synced" value={updated} />
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-canvas p-3 text-xs text-muted">
            <Smartphone size={15} className="text-brand-dark" />
            Your data is entered in the MyHealthyGlucose mobile app and viewed here. Web editing is coming soon.
          </div>
        </Card>

        <Card title="About & Legal" action={<Shield size={16} className="text-brand" />}>
          <Row label="App" value="MyHealthyGlucose Web" />
          <Row label="Version" value="1.0.0" />
          <div className="mt-3 flex flex-col gap-2">
            <a href="https://myhealthyglucose.datasparktech.com/privacy-policy.html" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas">
              <FileText size={15} className="text-brand-dark" /> Privacy Policy
            </a>
            <a href="https://myhealthyglucose.datasparktech.com/terms-of-service.html" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas">
              <FileText size={15} className="text-brand-dark" /> Terms of Service
            </a>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2 text-xs text-muted">
        <Badge tone="good">Live</Badge> Not a substitute for professional medical advice.
      </div>
    </div>
  );
}

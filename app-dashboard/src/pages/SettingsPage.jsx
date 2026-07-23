import React from "react";
import {
  User, Target, HeartPulse, LogOut, Shield, FileText, Smartphone, Database, CheckCircle2,
} from "lucide-react";
import { Card, Button, PageHeader, Badge } from "../components/ui.jsx";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

export default function SettingsPage({ model, user, onSignOut }) {
  const p = model.patient;
  const t = model.records.targets || {};
  const updated = model.updatedAt ? new Date(model.updatedAt).toLocaleString() : "—";

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

        <Card title="Health Profile" action={<HeartPulse size={16} className="text-brand" />}>
          <Row label="Condition" value={p.condition} />
          <Row label="Target range" value={`${p.targetLow}–${p.targetHigh} mg/dL`} />
          <Row label="Daily carb goal" value={`${t.carbs ?? 150} g`} />
          <Row label="Daily calorie goal" value={`${t.calories ?? 1800} kcal`} />
          <p className="mt-3 text-[11px] text-muted">Edit these in the mobile app — changes sync here automatically.</p>
        </Card>

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

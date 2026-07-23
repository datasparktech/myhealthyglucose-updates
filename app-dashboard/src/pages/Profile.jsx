import React, { useMemo } from "react";
import {
  User, Radio, Syringe, Droplet, Footprints, AlertTriangle, HeartPulse, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, Muted, PageHeader, Badge } from "../components/ui.jsx";
import { dayKey, dateLabel, fullDateLabel, timeLabel, clampArr } from "../data/transform.js";

function ageFrom(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

export default function Profile({ model }) {
  const p = model.patient;
  const r = model.records;
  const mp = r.medicalProfile || {};
  const dex = r.dexcom || {};
  const sick = r.sickDayMode || {};
  const meds = clampArr(r.meds);
  const sites = clampArr(r.injectionSites);
  const goals = r.goals || {};

  const medName = (id) => meds.find((m) => m.id === id)?.name || "Injection";
  const siteRotation = useMemo(() => {
    const m = {};
    sites.forEach((s) => { const k = s.site || "Unknown"; m[k] = m[k] || { site: k, count: 0, last: 0 }; m[k].count++; m[k].last = Math.max(m[k].last, s.ts || 0); });
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [sites]);
  const recentInjections = useMemo(() => [...sites].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6), [sites]);

  const today = goals[dayKey()] || {};
  const age = ageFrom(mp.dob);

  const rows = [
    mp.diabetesType && { k: "Diabetes type", v: /1|2/.test(String(mp.diabetesType)) ? `Type ${String(mp.diabetesType).match(/1|2/)[0]}` : mp.diabetesType },
    mp.diagnosisYear && { k: "Diagnosed", v: mp.diagnosisYear },
    age != null && { k: "Age", v: `${age}` },
    mp.bloodType && { k: "Blood type", v: mp.bloodType },
    p.targetLow && { k: "Target range", v: `${p.targetLow}–${p.targetHigh} mg/dL` },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <PageHeader title="Health Profile" subtitle="Medical details, devices & routines" />

      {sick.active && (
        <div className="animate-fadeUp flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle size={19} /></div>
          <div>
            <div className="text-sm font-bold text-amber-700">Sick-day mode is on</div>
            <div className="text-xs text-ink/70">{sick.startedAt ? `Active since ${fullDateLabel(sick.startedAt)}. ` : ""}Check glucose and ketones more often, and stay hydrated.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Medical Profile" action={<User size={16} className="text-brand" />}>
            <div className="flex items-center gap-4 border-b border-line pb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand text-lg font-extrabold text-white">{p.avatarInitials}</div>
              <div><div className="text-base font-bold text-ink">{p.name}</div><div className="text-xs text-muted">{p.condition}</div></div>
            </div>
            {rows.length ? (
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {rows.map((row) => (
                  <div key={row.k} className="flex flex-col border-b border-line/60 py-2">
                    <span className="text-[11px] text-muted">{row.k}</span>
                    <span className="text-sm font-bold text-ink">{row.v}</span>
                  </div>
                ))}
              </div>
            ) : <Muted>Fill in your medical profile in the app.</Muted>}
            {(mp.allergies || mp.conditions) && (
              <div className="mt-3 space-y-2">
                {mp.allergies && <InfoLine label="Allergies" value={mp.allergies} tone="danger" />}
                {mp.conditions && <InfoLine label="Conditions" value={mp.conditions} tone="neutral" />}
              </div>
            )}
          </Card>

          <Card title="Injection Site Rotation" subtitle="Spread injections to protect your skin" action={<Syringe size={16} className="text-brand" />}>
            {sites.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {siteRotation.map((s) => (
                    <div key={s.site} className="rounded-xl bg-canvas px-3 py-2 text-center">
                      <div className="text-sm font-extrabold text-brand-dark">{s.count}</div>
                      <div className="text-[11px] font-semibold text-ink">{s.site}</div>
                      <div className="text-[10px] text-muted">last {s.last ? dateLabel(s.last) : "—"}</div>
                    </div>
                  ))}
                </div>
                <ul className="mt-3 divide-y divide-line/70">
                  {recentInjections.map((s) => (
                    <li key={s.id || s.ts} className="flex items-center gap-2 py-2 text-sm">
                      <Syringe size={14} className="text-brand-dark" />
                      <span className="font-semibold text-ink">{s.site}</span>
                      <span className="text-xs text-muted">{medName(s.medId)}</span>
                      <span className="ml-auto text-xs text-muted">{s.ts ? `${fullDateLabel(s.ts)} · ${timeLabel(s.ts)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : <Muted>No injections logged.</Muted>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Connected Devices" action={<Radio size={16} className="text-brand" />}>
            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
              {dex.connected ? <CheckCircle2 size={22} className="text-brand" /> : <XCircle size={22} className="text-line" />}
              <div className="flex-1">
                <div className="text-sm font-bold text-ink">Dexcom CGM</div>
                <div className="text-xs text-muted">
                  {dex.connected ? `Connected${dex.lastSync ? ` · synced ${dateLabel(dex.lastSync)}` : ""}` : "Not connected"}
                </div>
              </div>
              <Badge tone={dex.connected ? "good" : "neutral"}>{dex.connected ? "Live" : "Off"}</Badge>
            </div>
            {dex.connected && dex.latest != null && (
              <div className="mt-2 text-center text-xs text-muted">Latest CGM value: <span className="font-bold text-ink">{dex.latest} mg/dL</span></div>
            )}
            <p className="mt-2 text-[11px] text-muted">Manage device connections in the mobile app.</p>
          </Card>

          <Card title="Today's Goals" action={<HeartPulse size={16} className="text-brand" />}>
            <div className="space-y-3">
              <GoalRow icon={Droplet} color="text-sky-500" label="Water" value={`${today.water || 0}`} unit="glasses" />
              <GoalRow icon={Footprints} color="text-emerald-500" label="Steps" value={(today.steps || 0).toLocaleString()} unit="" />
              {today.caloriesBurned != null && <GoalRow icon={HeartPulse} color="text-rose-500" label="Calories burned" value={today.caloriesBurned} unit="kcal" />}
            </div>
            <p className="mt-3 text-[11px] text-muted">Activity syncs from your phone's health data.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value, tone }) {
  return (
    <div className={`rounded-xl p-3 ${tone === "danger" ? "bg-danger/5" : "bg-canvas"}`}>
      <div className={`text-[11px] font-bold ${tone === "danger" ? "text-danger" : "text-muted"}`}>{label}</div>
      <div className="text-sm text-ink">{value}</div>
    </div>
  );
}

function GoalRow({ icon: Icon, color, label, value, unit }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className={color} />
      <span className="font-semibold text-ink">{label}</span>
      <span className="ml-auto font-extrabold text-ink">{value}</span>
      {unit && <span className="text-xs text-muted">{unit}</span>}
    </div>
  );
}

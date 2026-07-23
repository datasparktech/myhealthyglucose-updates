import React, { useMemo, useState } from "react";
import { Pill, Clock, CheckCircle2, Circle, Flame, CalendarCheck, StickyNote } from "lucide-react";
import { Card, Muted, EmptyState, PageHeader, Badge } from "../components/ui.jsx";
import { dayKey, dateLabel, fullDateLabel, DAY, clampArr } from "../data/transform.js";
import { toggleMedDose } from "../lib/writes.js";

export default function Medications({ model, user, reload }) {
  const [busy, setBusy] = useState(null);
  const meds = clampArr(model.records.meds).filter((m) => m && m.name);
  const medLog = clampArr(model.records.medLog);
  const now = Date.now();
  const tKey = dayKey();

  const scheduledPerDay = useMemo(
    () => meds.reduce((s, m) => s + (Array.isArray(m.times) && m.times.length ? m.times.length : 1), 0),
    [meds]
  );

  const schedule = useMemo(() => {
    const rows = [];
    meds.forEach((m) => {
      const times = Array.isArray(m.times) && m.times.length ? m.times : [null];
      times.forEach((time) => {
        const taken = medLog.some((l) => l.medId === m.id && l.date === tKey && (time == null || l.time === time));
        rows.push({ id: `${m.id}-${time}`, medId: m.id, rawTime: time, name: m.name, dose: m.dosage || "", time: time || "", taken });
      });
    });
    return rows.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }, [meds, medLog, tKey]);

  const takenToday = schedule.filter((s) => s.taken).length;

  const onToggle = async (row) => {
    if (busy) return;
    setBusy(row.id);
    try { await toggleMedDose(user.uid, { medId: row.medId, date: dayKey(), time: row.rawTime }); await reload(); }
    catch (e) { /* reload surfaces errors */ }
    finally { setBusy(null); }
  };

  const dayRatio = (k) => {
    if (!scheduledPerDay) return 0;
    const taken = medLog.filter((l) => l.date === k).length;
    return Math.min(taken / scheduledPerDay, 1);
  };

  const week = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const ts = now - i * DAY;
      arr.push({ ts, key: dayKey(ts), ratio: dayRatio(dayKey(ts)) });
    }
    return arr;
  }, [medLog, scheduledPerDay, now]);

  const adherence = (nDays) => {
    let sum = 0;
    for (let i = 0; i < nDays; i++) sum += dayRatio(dayKey(now - i * DAY));
    return Math.round((sum / nDays) * 100);
  };

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 90; i++) {
      const r = dayRatio(dayKey(now - i * DAY));
      if (i === 0 && r < 1) continue; // today may be incomplete — don't break the streak yet
      if (r >= 1) s += 1; else break;
    }
    return s;
  }, [medLog, scheduledPerDay, now]);

  const history = useMemo(() => {
    const byId = Object.fromEntries(meds.map((m) => [m.id, m]));
    return [...medLog]
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, 30)
      .map((l) => ({ ...l, name: byId[l.medId]?.name || "Medication", dose: byId[l.medId]?.dosage || "" }));
  }, [medLog, meds]);

  if (!meds.length) {
    return <EmptyState icon={Pill} title="No medications yet">Add medications and schedules in the app to track your doses and adherence here.</EmptyState>;
  }

  const ratioColor = (r) => (r >= 1 ? "#0EA99A" : r > 0 ? "#E0A03A" : "#DCEEEC");

  return (
    <div className="space-y-4">
      <PageHeader title="Medications" subtitle={`${meds.length} medication${meds.length === 1 ? "" : "s"} · ${takenToday}/${schedule.length} taken today`} />

      {/* Adherence tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={CalendarCheck} label="Today" value={`${takenToday}/${schedule.length}`} accent="bg-brand-faint text-brand-dark" />
        <MiniStat icon={CheckCircle2} label="7-day adherence" value={`${adherence(7)}%`} accent="bg-sky-100 text-sky-600" />
        <MiniStat icon={CheckCircle2} label="30-day adherence" value={`${adherence(30)}%`} accent="bg-violet-100 text-violet-600" />
        <MiniStat icon={Flame} label="Day streak" value={streak} accent="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Today's Schedule" subtitle={new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}>
            {schedule.length ? (
              <>
                <ul className="space-y-2.5">
                  {schedule.map((s) => (
                    <li key={s.id}>
                      <button onClick={() => onToggle(s)} disabled={busy === s.id}
                        className="flex w-full items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 text-left transition hover:bg-brand-faint disabled:opacity-60">
                        {s.taken ? <CheckCircle2 size={20} className="text-brand" /> : <Circle size={20} className="text-line" />}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-ink">{s.name}</div>
                          <div className="text-xs text-muted">{s.dose}</div>
                        </div>
                        {s.time && <span className="flex items-center gap-1 text-xs font-semibold text-muted"><Clock size={12} />{s.time}</span>}
                        <Badge tone={s.taken ? "good" : "warn"}>{s.taken ? "Taken" : "Due"}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-center text-[11px] text-muted">Tap a dose to mark it taken or undo.</p>
              </>
            ) : <Muted>No doses scheduled today.</Muted>}
          </Card>

          <Card title="Your Medications" subtitle="Names, doses & schedule">
            <ul className="divide-y divide-line/70">
              {meds.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-faint text-brand-dark"><Pill size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink">{m.name} {m.dosage && <span className="font-medium text-muted">· {m.dosage}</span>}</div>
                    {Array.isArray(m.times) && m.times.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {m.times.map((t, i) => <span key={i} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">{t}</span>)}
                      </div>
                    )}
                    {m.notes && <div className="mt-1 flex items-start gap-1 text-xs text-muted"><StickyNote size={12} className="mt-0.5" />{m.notes}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="This Week" subtitle="Doses taken per day">
            <div className="flex items-end justify-between gap-1.5">
              {week.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-24 w-full items-end rounded-lg bg-canvas">
                    <div className="w-full rounded-lg transition-all duration-700"
                      style={{ height: `${Math.max(d.ratio * 100, 6)}%`, background: ratioColor(d.ratio) }} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted">{new Date(d.ts).toLocaleDateString([], { weekday: "short" })[0]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" />All</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-warn" />Partial</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-line" />None</span>
            </div>
          </Card>

          <Card title="Recent Log" subtitle="Latest doses">
            {history.length ? (
              <ul className="space-y-2">
                {history.map((h, i) => (
                  <li key={h.id || i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} className="text-brand" />
                    <span className="truncate font-semibold text-ink">{h.name}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-muted">
                      {h.ts ? fullDateLabel(h.ts) : dateLabel(h.date)}{h.time ? ` · ${h.time}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <Muted>No doses logged yet.</Muted>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent = "bg-brand-faint text-brand-dark" }) {
  return (
    <div className="animate-fadeUp rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_26px_rgba(10,91,98,0.12)]">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}><Icon size={16} /></div>
      <div className="mt-2 text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-[11px] font-medium text-muted">{label}</div>
    </div>
  );
}

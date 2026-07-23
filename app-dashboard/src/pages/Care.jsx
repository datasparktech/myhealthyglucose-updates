import React, { useMemo } from "react";
import {
  CalendarClock, Stethoscope, Phone, MapPin, ShieldCheck, Contact, Footprints,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Card, Muted, EmptyState, PageHeader, Badge } from "../components/ui.jsx";
import { upcomingAppointments, screeningStatus, fullDateLabel, dateLabel, clampArr } from "../data/transform.js";

export default function Care({ model }) {
  const r = model.records;
  const appts = useMemo(() => upcomingAppointments(r.appointments, r.doctors), [r]);
  const doctors = clampArr(r.doctors);
  const contacts = clampArr(r.emergencyContacts);
  const screenings = clampArr(r.preventiveScreenings);
  const footChecks = useMemo(() => [...clampArr(r.footChecks)].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5), [r]);

  const nothing = !appts.length && !doctors.length && !contacts.length && !screenings.length && !footChecks.length;
  if (nothing) {
    return <EmptyState icon={CalendarClock} title="No care records yet">Add appointments, doctors, or contacts in the app to see them here.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Care & Records" subtitle="Appointments, providers & screenings" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Upcoming Appointments" action={<CalendarClock size={16} className="text-brand" />}>
            {appts.length ? (
              <ul className="space-y-3">
                {appts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-canvas p-3">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-brand-faint">
                      <span className="text-sm font-extrabold leading-none text-brand-dark">{new Date(a.ts).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase text-brand">{new Date(a.ts).toLocaleDateString([], { month: "short" })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">{a.title || "Appointment"}</div>
                      <div className="text-xs text-muted">{[a.doctorName, a.specialty].filter(Boolean).join(" · ") || "—"}{a.time ? ` · ${a.time}` : ""}</div>
                      {a.location && <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><MapPin size={11} />{a.location}</div>}
                    </div>
                    <Badge tone="good">{fullDateLabel(a.ts)}</Badge>
                  </li>
                ))}
              </ul>
            ) : <Muted>No upcoming appointments.</Muted>}
          </Card>

          <Card title="Your Doctors" action={<Stethoscope size={16} className="text-brand" />}>
            {doctors.length ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {doctors.map((d) => (
                  <li key={d.id} className="rounded-xl border border-line p-3">
                    <div className="text-sm font-bold text-ink">{d.name}</div>
                    {d.specialty && <div className="text-xs text-muted">{d.specialty}</div>}
                    {d.phone && <div className="mt-1 flex items-center gap-1 text-xs text-muted"><Phone size={11} />{d.phone}</div>}
                    {d.address && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin size={11} />{d.address}</div>}
                  </li>
                ))}
              </ul>
            ) : <Muted>No doctors saved.</Muted>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Preventive Screenings" action={<ShieldCheck size={16} className="text-brand" />}>
            {screenings.length ? (
              <ul className="space-y-2">
                {screenings.map((s) => {
                  const st = screeningStatus(s);
                  return (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      {st.due ? <AlertTriangle size={15} className="text-warn" /> : <CheckCircle2 size={15} className="text-brand" />}
                      <span className="font-semibold text-ink">{s.label}</span>
                      <span className="ml-auto"><Badge tone={st.due ? "warn" : "neutral"}>{st.label}</Badge></span>
                    </li>
                  );
                })}
              </ul>
            ) : <Muted>No screenings tracked.</Muted>}
          </Card>

          <Card title="Emergency Contacts" action={<Contact size={16} className="text-brand" />}>
            {contacts.length ? (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-faint text-xs font-bold text-brand-dark">{(c.name || "?").slice(0, 1).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{c.name}</div>
                      {c.relation && <div className="text-xs text-muted">{c.relation}</div>}
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs font-semibold text-brand-dark"><Phone size={12} />{c.phone}</a>}
                  </li>
                ))}
              </ul>
            ) : <Muted>No emergency contacts.</Muted>}
          </Card>

          {footChecks.length > 0 && (
            <Card title="Recent Foot Checks" action={<Footprints size={16} className="text-brand" />}>
              <ul className="space-y-2">
                {footChecks.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm">
                    {f.concerning ? <AlertTriangle size={15} className="text-danger" /> : <CheckCircle2 size={15} className="text-brand" />}
                    <span className="truncate text-ink">{f.note || (f.concerning ? "Concern noted" : "Normal")}</span>
                    <span className="ml-auto text-xs text-muted">{f.ts ? dateLabel(f.ts) : ""}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

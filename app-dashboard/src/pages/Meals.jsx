import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { UtensilsCrossed, Flame, Coffee, Sun, Moon, Cookie, Trophy } from "lucide-react";
import { Card, Muted, EmptyState, PageHeader } from "../components/ui.jsx";
import { dayKey, dateLabel, timeLabel, DAY, clampArr } from "../data/transform.js";

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"];
const MEAL_ICON = { Breakfast: Coffee, Lunch: Sun, Dinner: Moon, Snack: Cookie };
const MEAL_COLOR = {
  Breakfast: "bg-amber-100 text-amber-600",
  Lunch: "bg-sky-100 text-sky-600",
  Dinner: "bg-violet-100 text-violet-600",
  Snack: "bg-rose-100 text-rose-600",
  Other: "bg-brand-faint text-brand-dark",
};

export default function Meals({ model }) {
  const food = clampArr(model.records.food).filter((f) => f && (f.name || f.carbs != null));
  const targets = model.records.targets || { carbs: 150, calories: 1800 };
  const now = Date.now();

  const byDay = useMemo(() => {
    const m = {};
    food.forEach((f) => { const k = f.day || dayKey(f.ts); (m[k] ||= []).push(f); });
    return m;
  }, [food]);

  const dayList = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const k = dayKey(now - i * DAY);
      arr.push({ key: k, ts: now - i * DAY, count: (byDay[k] || []).length });
    }
    return arr;
  }, [byDay, now]);

  const [selected, setSelected] = useState(dayKey());
  const items = byDay[selected] || [];

  const carbsOf = (f) => Math.round((f.carbs || 0) * (f.qty || 1));
  const calOf = (f) => Math.round((f.cal || 0) * (f.qty || 1));
  const totalCarbs = items.reduce((s, f) => s + carbsOf(f), 0);
  const totalCal = items.reduce((s, f) => s + calOf(f), 0);

  const grouped = useMemo(() => {
    const g = {};
    items.forEach((f) => { const meal = f.meal || "Other"; (g[meal] ||= []).push(f); });
    const order = [...MEAL_ORDER, "Other"];
    return order.filter((k) => g[k]).map((k) => ({ meal: k, items: g[k].sort((a, b) => (a.ts || 0) - (b.ts || 0)) }));
  }, [items]);

  const carbsChart = useMemo(() =>
    dayList.slice().reverse().map((d) => ({
      label: dateLabel(d.ts),
      carbs: (byDay[d.key] || []).reduce((s, f) => s + carbsOf(f), 0),
    })), [dayList, byDay]);

  const topFoods = useMemo(() => {
    const m = {};
    food.forEach((f) => {
      const n = f.name || "Food";
      m[n] = m[n] || { name: n, count: 0, carbs: 0 };
      m[n].count += 1; m[n].carbs += carbsOf(f);
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [food]);

  if (!food.length) {
    return <EmptyState icon={UtensilsCrossed} title="No meals logged yet">Log meals in the app to see your carb and calorie breakdown here.</EmptyState>;
  }

  const carbPct = Math.min(Math.round((totalCarbs / (targets.carbs || 150)) * 100), 100);
  const calPct = Math.min(Math.round((totalCal / (targets.calories || 1800)) * 100), 100);
  const isToday = selected === dayKey();

  return (
    <div className="space-y-4">
      <PageHeader title="Meals" subtitle="Carbs, calories & food history" />

      {/* Day picker */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {dayList.map((d) => {
          const on = d.key === selected;
          return (
            <button key={d.key} onClick={() => setSelected(d.key)}
              className={`flex min-w-[62px] flex-col items-center rounded-xl px-3 py-2 text-center transition-all duration-200
                ${on ? "bg-brand text-white shadow-soft" : "bg-white text-muted ring-1 ring-line/70 hover:bg-brand-faint hover:text-brand-dark"}`}>
              <span className="text-[10px] font-bold uppercase opacity-80">{new Date(d.ts).toLocaleDateString([], { weekday: "short" })}</span>
              <span className="text-lg font-extrabold leading-tight">{new Date(d.ts).getDate()}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${d.count ? (on ? "bg-white" : "bg-brand") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Meals for the day */}
        <div className="space-y-4 xl:col-span-2">
          <Card title={isToday ? "Today's Meals" : new Date(selected).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            subtitle={`${items.length} item${items.length === 1 ? "" : "s"} · ${totalCarbs}g carbs · ${totalCal} kcal`}>
            {grouped.length ? (
              <div className="space-y-5">
                {grouped.map(({ meal, items: mi }) => {
                  const Icon = MEAL_ICON[meal] || UtensilsCrossed;
                  const mc = mi.reduce((s, f) => s + carbsOf(f), 0);
                  return (
                    <div key={meal}>
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${MEAL_COLOR[meal] || MEAL_COLOR.Other}`}><Icon size={15} /></div>
                        <span className="text-sm font-bold text-ink">{meal}</span>
                        <span className="ml-auto text-xs font-semibold text-muted">{mc}g carbs</span>
                      </div>
                      <ul className="space-y-1.5 pl-9">
                        {mi.map((f, i) => (
                          <li key={f.id || i} className="flex items-center gap-2 text-sm">
                            <span className="truncate text-ink">{f.name}{f.qty && f.qty !== 1 ? ` ×${f.qty}` : ""}</span>
                            {f.ts && <span className="text-[11px] text-muted">· {timeLabel(f.ts)}</span>}
                            <span className="ml-auto font-semibold text-ink">{carbsOf(f)}g</span>
                            <span className="w-14 text-right text-xs text-muted">{calOf(f)} kcal</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : <Muted>No meals logged on this day.</Muted>}
          </Card>

          <Card title="Carbs — Last 14 Days" subtitle="Grams per day">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={carbsChart} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#DCEEEC" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5A6D6D" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={14} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6D6D" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => [`${v} g`, "Carbs"]} cursor={{ fill: "#E7F7F3" }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #DCEEEC", fontSize: 12 }} />
                <Bar dataKey="carbs" radius={[6, 6, 0, 0]} isAnimationActive>
                  {carbsChart.map((d, i) => <Cell key={i} fill={d.label === dateLabel(Date.now()) ? "#0A5B62" : "#0EA99A"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <Card title={isToday ? "Today vs Targets" : "Day vs Targets"}>
            <Ring label="Carbs" value={totalCarbs} goal={targets.carbs || 150} unit="g" pct={carbPct} icon={Flame} />
            <div className="mt-4"><Ring label="Calories" value={totalCal} goal={targets.calories || 1800} unit="kcal" pct={calPct} icon={UtensilsCrossed} /></div>
          </Card>

          <Card title="Top Foods" subtitle="Most logged" action={<Trophy size={16} className="text-brand" />}>
            {topFoods.length ? (
              <ul className="space-y-2.5">
                {topFoods.map((f, i) => (
                  <li key={f.name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-faint text-xs font-bold text-brand-dark">{i + 1}</span>
                    <span className="truncate font-semibold text-ink">{f.name}</span>
                    <span className="ml-auto text-xs text-muted">×{f.count}</span>
                  </li>
                ))}
              </ul>
            ) : <Muted>No data.</Muted>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Ring({ label, value, goal, unit, pct, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={15} className="text-brand-dark" />
        <span className="font-semibold text-ink">{label}</span>
        <span className="ml-auto font-extrabold text-ink">{value}</span>
        <span className="text-xs text-muted">/ {goal} {unit}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line/70">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

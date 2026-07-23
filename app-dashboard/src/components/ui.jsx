import React, { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";

/* Count-up animated number */
export function AnimatedNumber({ value, decimals = 0, duration = 700, className = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current;
    const to = Number(value) || 0;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (to - from) * eased;
      setDisplay(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{display.toFixed(decimals)}</span>;
}

/* Button */
const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-soft",
  dark: "bg-brand-dark text-white hover:opacity-90 shadow-soft",
  outline: "border border-line bg-surface text-ink hover:bg-canvas hover:border-brand/40",
  ghost: "text-muted hover:bg-brand-faint hover:text-brand-dark",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};
export function Button({ variant = "primary", size = "md", icon: Icon, children, className = "", ...rest }) {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-sm" };
  return (
    <button {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200
        active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none ${VARIANTS[variant]} ${sizes[size]} ${className}`}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

/* Card with optional hover lift */
export function Card({ title, subtitle, action, children, className = "", hover = false, style }) {
  return (
    <section style={style}
      className={`rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70 transition-all duration-300
        ${hover ? "hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(10,91,98,0.12)]" : ""} ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* Sparkline area */
export function Spark({ data, color = "#0EA99A", id, height = 40 }) {
  const series = (data || []).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sp-${id})`} dot={false} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* Trend chip */
export function TrendChip({ delta, unit = "", invert = false }) {
  const up = delta > 0, flat = delta === 0;
  const good = invert ? !up : up;
  const color = flat ? "text-muted bg-line/60"
    : good ? "text-brand-dark bg-brand-faint" : "text-danger bg-danger/10";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Icon size={13} strokeWidth={2.5} />{up ? "+" : ""}{delta}{unit}
    </span>
  );
}

/* Accent palette for colorful cards/icons */
export const ACCENTS = {
  teal: { bg: "bg-brand-faint", fg: "text-brand-dark", spark: "#0EA99A", bar: "from-brand-dark to-brand" },
  sky: { bg: "bg-sky-100", fg: "text-sky-600", spark: "#0284C7", bar: "from-sky-600 to-sky-400" },
  violet: { bg: "bg-violet-100", fg: "text-violet-600", spark: "#7C3AED", bar: "from-violet-600 to-violet-400" },
  amber: { bg: "bg-amber-100", fg: "text-amber-600", spark: "#D97706", bar: "from-amber-500 to-amber-400" },
  rose: { bg: "bg-rose-100", fg: "text-rose-600", spark: "#E11D48", bar: "from-rose-600 to-rose-400" },
  indigo: { bg: "bg-indigo-100", fg: "text-indigo-600", spark: "#4F46E5", bar: "from-indigo-600 to-indigo-400" },
};

/* Stat card */
export function StatCard({ icon: Icon, label, value, unit, decimals = 0, chip, spark, sparkColor, accent = "teal", note, id, delay = 0 }) {
  const a = ACCENTS[accent] || ACCENTS.teal;
  return (
    <div style={{ animationDelay: `${delay}ms` }}
      className="group animate-fadeUp relative overflow-hidden rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_34px_rgba(10,91,98,0.14)]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.bar} opacity-80`} />
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.bg} ${a.fg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
        {chip}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tracking-tight text-ink">
          <AnimatedNumber value={value} decimals={decimals} />
        </span>
        {unit && <span className="text-sm font-semibold text-muted">{unit}</span>}
      </div>
      {note && <div className="mt-0.5 text-[10px] font-medium text-muted">{note}</div>}
      {spark && <div className="mt-2 -mx-1"><Spark data={spark} color={sparkColor || a.spark} id={id} /></div>}
    </div>
  );
}

/* Segmented control with sliding pill */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`rounded-md px-3 py-1 text-xs font-bold transition-all duration-200
            ${on ? "bg-surface text-brand-dark shadow-soft" : "text-muted hover:text-brand-dark"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-canvas text-muted",
    good: "bg-brand-faint text-brand-dark",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/10 text-danger",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function Muted({ children, className = "" }) {
  return <p className={`py-6 text-center text-sm text-muted ${className}`}>{children}</p>;
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="animate-fadeUp mt-2 flex flex-col items-center justify-center rounded-2xl bg-surface p-12 text-center shadow-card ring-1 ring-line/70">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-faint text-brand-dark">
          <Icon size={30} strokeWidth={2} />
        </div>
      )}
      <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* Form primitives */
export const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-md rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

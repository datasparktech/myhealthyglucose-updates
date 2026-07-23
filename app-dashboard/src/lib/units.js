import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const MMOL = 18.0182;
const UnitCtx = createContext(null);

function readStored() {
  try { return localStorage.getItem("mhg-unit") || "mgdl"; } catch { return "mgdl"; }
}

export function UnitProvider({ children }) {
  const [unit, setUnitState] = useState(readStored);
  const setUnit = useCallback((u) => {
    setUnitState(u);
    try { localStorage.setItem("mhg-unit", u); } catch { /* ignore */ }
  }, []);
  const toggle = useCallback(() => setUnit(unit === "mmol" ? "mgdl" : "mmol"), [unit, setUnit]);

  const value = useMemo(() => {
    const isMmol = unit === "mmol";
    // Convert a stored mg/dL number to the active display unit.
    const conv = (v) => (v == null ? v : isMmol ? +(v / MMOL).toFixed(1) : Math.round(v));
    return {
      unit, isMmol, setUnit, toggle,
      unitLabel: isMmol ? "mmol/L" : "mg/dL",
      conv,
      fmt: (v) => (v == null ? "—" : `${conv(v)}`),
      // Recharts Y domain in display units.
      domain: isMmol ? [3, 14] : [60, 220],
      decimals: isMmol ? 1 : 0,
    };
  }, [unit, setUnit, toggle]);

  return <UnitCtx.Provider value={value}>{children}</UnitCtx.Provider>;
}

export function useUnit() {
  const ctx = useContext(UnitCtx);
  // Safe fallback so components never crash if used outside the provider.
  if (!ctx) {
    const conv = (v) => (v == null ? v : Math.round(v));
    return { unit: "mgdl", isMmol: false, setUnit: () => {}, toggle: () => {}, unitLabel: "mg/dL", conv, fmt: (v) => `${conv(v)}`, domain: [60, 220], decimals: 0 };
  }
  return ctx;
}

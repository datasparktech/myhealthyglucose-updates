import React, { useState } from "react";
import { ChefHat, Users, Flame, Wheat, Beef, Leaf, ChevronDown } from "lucide-react";
import { Card, EmptyState, PageHeader, Badge } from "../components/ui.jsx";
import { clampArr } from "../data/transform.js";

export default function Recipes({ model }) {
  const recipes = clampArr(model.records.recipes);
  const [open, setOpen] = useState(null);

  if (!recipes.length) {
    return <EmptyState icon={ChefHat} title="No saved recipes yet">Build recipes in the app to calculate per-serving carbs — they'll appear here.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Recipes" subtitle={`${recipes.length} saved recipe${recipes.length === 1 ? "" : "s"}`} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((r, i) => {
          const id = r.id || i;
          const isOpen = open === id;
          const ings = clampArr(r.ingredients);
          return (
            <Card key={id} hover className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><ChefHat size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{r.name || "Recipe"}</div>
                  <div className="flex items-center gap-1 text-xs text-muted"><Users size={12} /> {r.servings || 1} serving{(r.servings || 1) > 1 ? "s" : ""}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <Macro icon={Wheat} color="text-amber-600" bg="bg-amber-50" label="Carbs" value={`${Math.round(r.carbsPerServing || 0)}g`} />
                <Macro icon={Flame} color="text-rose-600" bg="bg-rose-50" label="Calories" value={Math.round(r.calPerServing || 0)} />
                <Macro icon={Beef} color="text-violet-600" bg="bg-violet-50" label="Protein" value={`${Math.round(r.proteinPerServing || 0)}g`} />
                <Macro icon={Leaf} color="text-emerald-600" bg="bg-emerald-50" label="Fiber" value={`${Math.round(r.fiberPerServing || 0)}g`} />
              </div>
              <div className="mt-1 text-center text-[10px] text-muted">per serving</div>

              {ings.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setOpen(isOpen ? null : id)}
                    className="flex w-full items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-xs font-bold text-brand-dark transition hover:bg-brand-faint">
                    {ings.length} ingredient{ings.length > 1 ? "s" : ""}
                    <ChevronDown size={14} className={`ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <ul className="animate-fadeIn mt-2 space-y-1.5">
                      {ings.map((ing, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                          <span className="text-ink">{ing.name}{ing.qty && ing.qty !== 1 ? ` ×${ing.qty}` : ""}</span>
                          {ing.diet && <Badge tone="neutral">{ing.diet}</Badge>}
                          {ing.serving && <span className="ml-auto text-[11px] text-muted">{ing.serving}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Macro({ icon: Icon, color, bg, label, value }) {
  return (
    <div className={`rounded-xl ${bg} py-2`}>
      <Icon size={14} className={`mx-auto ${color}`} />
      <div className="mt-0.5 text-sm font-extrabold text-ink">{value}</div>
      <div className="text-[9px] font-medium text-muted">{label}</div>
    </div>
  );
}

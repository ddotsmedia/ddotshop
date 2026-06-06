"use client";

import type { ShopCategory } from "./types";

export function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: ShopCategory[];
  active: string;
  onChange: (id: string) => void;
}) {
  const tabs = [{ id: "all", name: "All" }, ...categories];
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-2 pb-1 text-sm transition-colors ${
            active === t.id
              ? "border-wa-green font-semibold text-wa-green"
              : "border-transparent text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

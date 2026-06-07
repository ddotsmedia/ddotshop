"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";

interface Activity {
  firstName: string;
  productName: string;
  minutesAgo: number;
}

export function SocialProof({ slug }: { slug: string }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch(`/api/shop/${slug}/activity`)
      .then((r) => r.json())
      .then((d) => setItems(d.activity ?? []))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (items.length === 0) return;
    const rotate = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000);
    const hide = setTimeout(() => setHidden(true), 20000);
    return () => {
      clearInterval(rotate);
      clearTimeout(hide);
    };
  }, [items]);

  if (hidden || items.length === 0) return null;
  const a = items[idx];

  return (
    <div className="fixed bottom-4 left-4 z-40 flex max-w-[260px] items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-2.5 shadow-md">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wa-light text-wa-dark">
        <ShoppingBag className="h-4 w-4" />
      </span>
      <p className="text-xs text-[#374151]">
        <strong>{a.firstName}</strong> just ordered {a.productName} {a.minutesAgo} min ago
      </p>
      <button onClick={() => setHidden(true)} className="text-[#9ca3af]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

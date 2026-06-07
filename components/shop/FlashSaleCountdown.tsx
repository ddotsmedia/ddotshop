"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const router = useRouter();
  const end = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(end - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const r = end - Date.now();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(t);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [end, router]);

  if (remaining <= 0) return null;

  return (
    <div className="sticky top-14 z-40 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white">
      ⚡ Flash Sale ends in: <span className="font-mono tabular-nums">{fmt(remaining)}</span>
    </div>
  );
}

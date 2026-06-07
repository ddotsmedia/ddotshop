"use client";

import { Share2, Copy } from "lucide-react";
import { useCart } from "@/lib/stores/cart.store";
import { toast } from "@/components/ui/use-toast";

export function ShareCart({ shopName, slug }: { shopName: string; slug: string }) {
  const items = useCart((s) => s.items);

  function buildUrl(): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const encoded = btoa(encodeURIComponent(JSON.stringify(items)));
    return `${base}/shop/${slug}?cart=${encoded}`;
  }

  function shareWA() {
    const url = buildUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hey! Check out my cart at ${shopName}: ${url}`)}`, "_blank");
  }

  async function copy() {
    await navigator.clipboard.writeText(buildUrl());
    toast({ title: "Link copied", variant: "success" });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button onClick={shareWA} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#e5e7eb] py-2 text-xs font-medium">
        <Share2 className="h-3.5 w-3.5" /> Share Cart
      </button>
      <button onClick={copy} className="flex items-center justify-center gap-1 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium">
        <Copy className="h-3.5 w-3.5" /> Copy link
      </button>
    </div>
  );
}

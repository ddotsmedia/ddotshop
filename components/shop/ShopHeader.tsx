"use client";

import Image from "next/image";
import { Search, ShoppingCart, BadgeCheck } from "lucide-react";
import { useCart } from "@/lib/stores/cart.store";
import type { ShopInfo } from "./types";

export function ShopHeader({
  shop,
  onCart,
  onSearch,
}: {
  shop: ShopInfo;
  onCart: () => void;
  onSearch: () => void;
}) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 text-white"
      style={{ backgroundColor: shop.themeColor || "#0a5c36" }}
    >
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40 bg-white/10">
          {shop.logoUrl ? (
            <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" sizes="32px" />
          ) : (
            <span className="grid h-full place-items-center text-sm font-bold">
              {shop.name[0]}
            </span>
          )}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">{shop.name}</p>
          {shop.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] opacity-90">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onSearch} className="rounded-full p-2 hover:bg-white/10" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
        <button onClick={onCart} className="relative rounded-full p-2 hover:bg-white/10" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-wa-green px-1 text-[10px] font-bold">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

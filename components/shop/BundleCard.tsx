"use client";

import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/stores/cart.store";
import { toast } from "@/components/ui/use-toast";

export interface BundleView {
  id: string;
  name: string;
  description?: string | null;
  bundlePrice: number;
  imageUrl?: string | null;
  items: { qty: number; product: { name: string; price: number; images: string[] } }[];
}

export function BundleCard({ bundle, currency }: { bundle: BundleView; currency: string }) {
  const addToCart = useCart((s) => s.addToCart);
  const original = bundle.items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const savings = Math.max(0, original - bundle.bundlePrice);

  function add() {
    // Distribute the bundle price across items so the cart total equals bundlePrice.
    bundle.items.forEach((i, idx) => {
      const share =
        original > 0
          ? Math.round(((i.product.price * i.qty) / original) * bundle.bundlePrice * 100) / 100 / i.qty
          : bundle.bundlePrice / bundle.items.length / i.qty;
      addToCart({
        productId: `${bundle.id}:${idx}`,
        name: i.product.name,
        price: share,
        qty: i.qty,
        image: i.product.images[0],
        bundleId: bundle.id,
        bundleName: bundle.name,
      });
    });
    toast({ title: "Bundle added to cart", variant: "success" });
  }

  return (
    <div className="flex gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        {bundle.imageUrl ? (
          <Image src={bundle.imageUrl} alt={bundle.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex -space-x-3 p-2">
            {bundle.items.slice(0, 3).map((i, idx) =>
              i.product.images[0] ? (
                <Image key={idx} src={i.product.images[0]} alt="" width={28} height={28} className="h-7 w-7 rounded-full border border-white object-cover" />
              ) : (
                <span key={idx} className="grid h-7 w-7 place-items-center rounded-full border border-white bg-gray-100 text-xs">🛍️</span>
              ),
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{bundle.name}</p>
        <p className="text-xs text-[#9ca3af]">{bundle.items.length} items</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-wa-green">{formatCurrency(bundle.bundlePrice, currency)}</span>
          {savings > 0 && (
            <>
              <span className="text-xs text-[#9ca3af] line-through">{formatCurrency(original, currency)}</span>
              <span className="rounded bg-green-100 px-1.5 text-[10px] font-semibold text-green-700">
                Save {formatCurrency(savings, currency)}
              </span>
            </>
          )}
        </div>
      </div>
      <button onClick={add} className="self-center rounded-lg bg-wa-green px-3 py-2 text-xs font-semibold text-white hover:bg-wa-dark">
        Add Bundle
      </button>
    </div>
  );
}

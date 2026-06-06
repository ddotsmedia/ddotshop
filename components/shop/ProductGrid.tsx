"use client";

import { ProductCard } from "./ProductCard";
import type { ShopProduct } from "./types";

export function ProductGrid({
  products,
  currency,
  onOpen,
}: {
  products: ShopProduct[];
  currency: string;
  onOpen: (p: ShopProduct) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="grid place-items-center py-20 text-center text-[#9ca3af]">
        <span className="text-4xl">🔍</span>
        <p className="mt-2 text-sm">No products found</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} currency={currency} onOpen={onOpen} />
      ))}
    </div>
  );
}

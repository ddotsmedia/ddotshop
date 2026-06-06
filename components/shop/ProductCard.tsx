"use client";

import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { ShopProduct } from "./types";
import { useCart } from "@/lib/stores/cart.store";
import { toast } from "@/components/ui/use-toast";

export function ProductCard({
  product,
  currency,
  onOpen,
}: {
  product: ShopProduct;
  currency: string;
  onOpen: (p: ShopProduct) => void;
}) {
  const addToCart = useCart((s) => s.addToCart);
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const soldOut = product.trackStock && product.stock === 0;
  const hasVariants = product.variants.some((v) => v.values.length > 0);

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (soldOut) return;
    if (hasVariants) {
      onOpen(product);
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      image: product.images[0],
    });
    toast({ title: "Added to cart", variant: "success" });
  }

  return (
    <div
      onClick={() => onOpen(product)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-[#e5e7eb] bg-white transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full bg-gray-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-3xl">🛍️</div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            SALE
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 text-sm font-semibold text-[#6b7280]">
            Out of Stock
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#111827]">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-wa-green">
            {formatCurrency(product.price, currency)}
          </span>
          {onSale && (
            <span className="text-xs text-[#9ca3af] line-through">
              {formatCurrency(product.comparePrice!, currency)}
            </span>
          )}
        </div>
        <button
          onClick={quickAdd}
          disabled={soldOut}
          className="mt-2 w-full rounded-md bg-wa-green py-1.5 text-xs font-semibold text-white transition-colors hover:bg-wa-dark disabled:bg-gray-200 disabled:text-[#9ca3af]"
        >
          {soldOut ? "Out of Stock" : hasVariants ? "Select options" : "+ Cart"}
        </button>
      </div>
    </div>
  );
}

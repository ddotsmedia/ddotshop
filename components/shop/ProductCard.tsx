"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ShopProduct } from "./types";
import { useCart } from "@/lib/stores/cart.store";
import { ensurePhone } from "@/lib/shop-phone";
import { toast } from "@/components/ui/use-toast";

export function ProductCard({
  product,
  currency,
  shopId,
  slug,
  wishlisted: initialWishlisted = false,
  onOpen,
}: {
  product: ShopProduct;
  currency: string;
  shopId?: string;
  slug?: string;
  wishlisted?: boolean;
  onOpen: (p: ShopProduct) => void;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);

  async function toggleWishlist(e: React.MouseEvent) {
    e.stopPropagation();
    if (!shopId || !slug) return;
    const phone = ensurePhone(slug);
    if (!phone) return;
    if (wishlisted) {
      setWishlisted(false);
      await fetch(`/api/wishlist?shopId=${shopId}&productId=${product.id}&customerPhone=${encodeURIComponent(phone)}`, { method: "DELETE" });
    } else {
      setWishlisted(true);
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, productId: product.id, customerPhone: phone, notifyOnDrop: true, notifyOnStock: true }),
      });
      toast({ title: "Added to wishlist", variant: "success" });
    }
  }

  async function notifyMe(e: React.MouseEvent) {
    e.stopPropagation();
    if (!shopId || !slug) return;
    const phone = ensurePhone(slug);
    if (!phone) return;
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, productId: product.id, customerPhone: phone }),
    });
    toast({ title: "We'll notify you when it's back", variant: "success" });
  }

  const addToCart = useCart((s) => s.addToCart);
  const flash = product.flashPrice != null && product.flashPrice < product.price;
  const effectivePrice = flash ? product.flashPrice! : product.price;
  const onSale = !flash && product.comparePrice && product.comparePrice > product.price;
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
      price: effectivePrice,
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
        {flash && (
          <span className="absolute right-2 top-2 animate-pulse rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            ⚡ FLASH
          </span>
        )}
        {shopId && slug && (
          <button
            onClick={toggleWishlist}
            className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/80 backdrop-blur"
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-[#6b7280]"}`} />
          </button>
        )}
        {soldOut && !product.isPreOrder && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 text-sm font-semibold text-[#6b7280]">
            Out of Stock
          </div>
        )}
        {product.isPreOrder && (
          <span className="absolute left-2 bottom-2 rounded bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
            PRE-ORDER
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#111827]">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`text-[15px] font-bold ${flash ? "text-red-500" : "text-wa-green"}`}>
            {formatCurrency(effectivePrice, currency)}
          </span>
          {(flash || onSale) && (
            <span className="text-xs text-[#9ca3af] line-through">
              {formatCurrency(flash ? product.price : product.comparePrice!, currency)}
            </span>
          )}
        </div>
        {product.reviewCount ? (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7280]">
            <span className="text-warning">★</span>
            {product.rating} ({product.reviewCount})
          </div>
        ) : null}
        {product.isPreOrder ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(product);
            }}
            className="mt-2 w-full rounded-md bg-purple-600 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
          >
            Pre-order Now
          </button>
        ) : soldOut ? (
          <button
            onClick={notifyMe}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-wa-green py-1.5 text-xs font-semibold text-wa-dark"
          >
            <Bell className="h-3.5 w-3.5" /> Notify Me
          </button>
        ) : (
          <button
            onClick={quickAdd}
            className="mt-2 w-full rounded-md bg-wa-green py-1.5 text-xs font-semibold text-white transition-colors hover:bg-wa-dark"
          >
            {hasVariants ? "Select options" : "+ Cart"}
          </button>
        )}
      </div>
    </div>
  );
}

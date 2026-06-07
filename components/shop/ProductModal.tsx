"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/stores/cart.store";
import { toast } from "@/components/ui/use-toast";
import type { ShopProduct } from "./types";

interface ReviewItem {
  id: string;
  rating: number;
  body?: string | null;
  createdAt: string;
  customer?: { name?: string | null } | null;
}

export function ProductModal({
  product,
  currency,
  shopId,
  slug,
  onClose,
}: {
  product: ShopProduct | null;
  currency: string;
  shopId: string;
  slug: string;
  onClose: () => void;
}) {
  const addToCart = useCart((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (!product) return;
    fetch(`/api/reviews?productId=${product.id}&shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => setReviews([]));
  }, [product, shopId]);

  if (!product) return null;

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const soldOut = product.trackStock && product.stock === 0;
  const variants = product.variants.filter((v) => v.values.length > 0);
  const allChosen = variants.every((v) => selected[v.name]);

  function add() {
    const variantLabel = variants.map((v) => selected[v.name]).filter(Boolean).join(" / ");
    addToCart({
      productId: product!.id,
      name: product!.name,
      variant: variantLabel || undefined,
      price: product!.price,
      qty,
      image: product!.images[0],
    });
    toast({ title: "Added to cart", variant: "success" });
    onClose();
    setQty(1);
    setSelected({});
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
          {product.images[active] ? (
            <Image src={product.images[active]} alt={product.name} fill className="object-cover" sizes="500px" />
          ) : (
            <div className="grid h-full place-items-center text-5xl">🛍️</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActive(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "border-wa-green" : "border-transparent"}`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        )}

        <h2 className="mt-4 text-lg font-bold">{product.name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-bold text-wa-green">
            {formatCurrency(product.price, currency)}
          </span>
          {onSale && (
            <span className="text-sm text-[#9ca3af] line-through">
              {formatCurrency(product.comparePrice!, currency)}
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">{product.description}</p>
        )}

        {variants.map((v) => (
          <div key={v.name} className="mt-4">
            <p className="mb-1.5 text-sm font-medium">{v.name}</p>
            <div className="flex flex-wrap gap-2">
              {v.values.map((val) => (
                <button
                  key={val}
                  onClick={() => setSelected((s) => ({ ...s, [v.name]: val }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${selected[v.name] === val ? "border-wa-green bg-wa-green text-white" : "border-[#e5e7eb] text-[#374151]"}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        {product.trackStock && product.stock > 0 && product.stock < 10 && (
          <p className="mt-3 text-xs font-medium text-warning">{product.stock} items left</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#e5e7eb]">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => (product.trackStock ? Math.min(product.stock, q + 1) : q + 1))}
              className="p-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={add}
          disabled={soldOut || !allChosen}
          className="mt-4 h-12 w-full rounded-lg bg-wa-green font-semibold text-white hover:bg-wa-dark disabled:bg-gray-200 disabled:text-[#9ca3af]"
        >
          {soldOut ? "Out of Stock" : !allChosen ? "Select options" : "Add to Cart"}
        </button>

        <button
          onClick={async () => {
            const { ensurePhone } = await import("@/lib/shop-phone");
            const phone = ensurePhone(slug);
            if (!phone) return;
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ shopId, productId: product.id, customerPhone: phone, notifyOnDrop: true, notifyOnStock: true }),
            });
            toast({ title: "Added to wishlist", variant: "success" });
          }}
          className="mt-2 w-full rounded-lg border border-[#e5e7eb] py-2.5 text-sm font-medium text-[#374151]"
        >
          ♡ Add to Wishlist
        </button>

        {reviews.length > 0 && (
          <div className="mt-6 border-t border-[#e5e7eb] pt-4">
            <h3 className="mb-3 text-sm font-semibold">Reviews</h3>
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const c = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length ? (c / reviews.length) * 100 : 0;
              return (
                <div key={star} className="mb-1 flex items-center gap-2 text-xs">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-warning" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-5 text-right text-[#9ca3af]">{c}</span>
                </div>
              );
            })}
            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.customer?.name ?? "Customer"}</span>
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i <= r.rating ? "fill-warning text-warning" : "text-gray-300"}`}
                        />
                      ))}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-[#6b7280]">{r.body}</p>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#9ca3af]">Showing approved reviews only</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

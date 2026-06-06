"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/stores/cart.store";
import { toast } from "@/components/ui/use-toast";
import type { ShopProduct } from "./types";

export function ProductModal({
  product,
  currency,
  onClose,
}: {
  product: ShopProduct | null;
  currency: string;
  onClose: () => void;
}) {
  const addToCart = useCart((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});

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
      </DialogContent>
    </Dialog>
  );
}

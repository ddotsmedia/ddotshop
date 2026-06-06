"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/stores/cart.store";
import { buildOrderMessage, waMeLink } from "@/lib/wa-format";
import type { ShopInfo } from "./types";

export function CartDrawer({
  shop,
  open,
  onClose,
}: {
  shop: ShopInfo;
  open: boolean;
  onClose: () => void;
}) {
  const { items, updateQty, removeFromCart, subtotal, clearCart } = useCart();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [placing, setPlacing] = useState(false);

  const sub = subtotal();
  const total = Math.max(0, sub - discount);

  async function applyCode() {
    if (!code) return;
    setApplying(true);
    const res = await fetch("/api/discount-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, shopId: shop.id, orderTotal: sub }),
    });
    const data = await res.json();
    setApplying(false);
    setDiscount(data.valid ? data.discountAmount : 0);
  }

  async function orderOnWhatsApp() {
    if (items.length === 0) return;
    setPlacing(true);
    // Create a pending order (also queues abandoned-cart recovery).
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId: shop.id,
        customerName: "WhatsApp customer",
        customerPhone: shop.whatsappNumber,
        discountCode: discount > 0 ? code : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          variant: i.variant,
          price: i.price,
          qty: i.qty,
          image: i.image,
        })),
      }),
    }).catch(() => {});

    const message = buildOrderMessage({
      shopName: shop.name,
      currency: shop.currency,
      items: items.map((i) => ({
        name: i.name,
        variant: i.variant,
        qty: i.qty,
        lineTotal: (i.price * i.qty).toFixed(2),
      })),
      discountCode: discount > 0 ? code : null,
      discountAmount: discount > 0 ? discount.toFixed(2) : null,
      total: total.toFixed(2),
      customerName: "—",
      customerPhone: "—",
    });

    window.open(waMeLink(shop.whatsappNumber, message), "_blank");
    setPlacing(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" className="flex flex-col p-0">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] p-4">
          <DialogTitle>Your Cart</DialogTitle>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-[#d1d5db]" />
            <p className="text-sm text-[#6b7280]">Your cart is empty</p>
            <button onClick={onClose} className="text-sm font-semibold text-wa-dark">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((i) => (
                <div key={`${i.productId}-${i.variant ?? ""}`} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    {i.image ? (
                      <Image src={i.image} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="grid h-full place-items-center">🛍️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    {i.variant && <p className="text-xs text-[#9ca3af]">{i.variant}</p>}
                    <p className="text-sm font-semibold text-wa-green">
                      {formatCurrency(i.price * i.qty, shop.currency)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => removeFromCart(i.productId, i.variant)}>
                      <Trash2 className="h-4 w-4 text-[#9ca3af]" />
                    </button>
                    <div className="flex items-center rounded-md border border-[#e5e7eb]">
                      <button onClick={() => updateQty(i.productId, i.variant, i.qty - 1)} className="px-1.5">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs">{i.qty}</span>
                      <button onClick={() => updateQty(i.productId, i.variant, i.qty + 1)} className="px-1.5">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-[#e5e7eb] p-4">
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 rounded-md border border-[#e5e7eb] px-3 py-1.5 text-sm"
                />
                <button
                  onClick={applyCode}
                  disabled={applying}
                  className="rounded-md border border-[#e5e7eb] px-3 text-sm font-medium"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount, shop.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280]">Total</span>
                <span className="text-base font-bold">{formatCurrency(total, shop.currency)}</span>
              </div>
              <button
                onClick={orderOnWhatsApp}
                disabled={placing}
                className="h-[52px] w-full rounded-lg bg-wa-green text-base font-bold text-white hover:bg-wa-dark"
              >
                {placing ? "…" : "Order on WhatsApp →"}
              </button>
              <Link
                href={`/shop/${shop.slug}/checkout`}
                className="block text-center text-xs font-medium text-[#6b7280] hover:text-[#111827]"
              >
                or pay online at checkout
              </Link>
              <button onClick={clearCart} className="block w-full text-center text-xs text-[#9ca3af]">
                Clear cart
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

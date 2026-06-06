"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  name: string;
  variant?: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartState {
  items: CartLine[];
  shopSlug: string;
  shopName: string;
  shopPhone: string;
  currency: string;
  setShopInfo: (info: {
    shopSlug: string;
    shopName: string;
    shopPhone: string;
    currency: string;
  }) => void;
  addToCart: (line: CartLine) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQty: (productId: string, variant: string | undefined, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  count: () => number;
}

const sameLine = (a: CartLine, productId: string, variant?: string) =>
  a.productId === productId && (a.variant ?? "") === (variant ?? "");

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopSlug: "",
      shopName: "",
      shopPhone: "",
      currency: "AED",
      setShopInfo: (info) =>
        set((s) =>
          s.shopSlug && s.shopSlug !== info.shopSlug
            ? { ...info, items: [] } // switched shops — reset cart
            : { ...info },
        ),
      addToCart: (line) =>
        set((s) => {
          const existing = s.items.find((i) => sameLine(i, line.productId, line.variant));
          if (existing) {
            return {
              items: s.items.map((i) =>
                sameLine(i, line.productId, line.variant)
                  ? { ...i, qty: i.qty + line.qty }
                  : i,
              ),
            };
          }
          return { items: [...s.items, line] };
        }),
      removeFromCart: (productId, variant) =>
        set((s) => ({ items: s.items.filter((i) => !sameLine(i, productId, variant)) })),
      updateQty: (productId, variant, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (sameLine(i, productId, variant) ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "ddotsshop-cart" },
  ),
);

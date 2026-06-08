"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/stores/cart.store";
import { formatCurrency } from "@/lib/utils";
import { buildOrderMessage, waMeLink } from "@/lib/wa-format";
import { toast } from "@/components/ui/use-toast";

interface CheckoutShop {
  id: string;
  slug: string;
  name: string;
  currency: string;
  whatsappNumber: string;
  telrEnabled: boolean;
  stripeEnabled: boolean;
  razorpayEnabled: boolean;
  codEnabled: boolean;
  upiId?: string | null;
  upiQrUrl?: string | null;
}

type Method = "TELR" | "STRIPE" | "RAZORPAY" | "UPI" | "COD";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  prefill: { name: string; contact: string };
  handler: (r: RazorpayResponse) => void;
}
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpaySdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({ shop }: { shop: CheckoutShop }) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+971");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<Method>(
    shop.razorpayEnabled
      ? "RAZORPAY"
      : shop.telrEnabled
        ? "TELR"
        : shop.stripeEnabled
          ? "STRIPE"
          : shop.codEnabled
            ? "COD"
            : "UPI",
  );
  const [loading, setLoading] = useState(false);

  const sub = subtotal();
  const total = sub;
  const canPay = name.trim() && phone.replace(/\D/g, "").length >= 8 && items.length > 0;

  const payload = {
    shopId: shop.id,
    customerName: name,
    customerPhone: phone,
    customerAddress: address || undefined,
    notes: notes || undefined,
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      variant: i.variant,
      price: i.price,
      qty: i.qty,
      image: i.image,
    })),
  };

  async function place() {
    if (!canPay) return;
    setLoading(true);

    if (method === "TELR" || method === "STRIPE") {
      const endpoint =
        method === "TELR" ? "/api/payments/telr/create" : "/api/payments/stripe/create";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Payment failed", variant: "danger" });
        setLoading(false);
        return;
      }
      clearCart();
      window.location.href = data.paymentUrl;
      return;
    }

    if (method === "RAZORPAY") {
      const res = await fetch("/api/payments/razorpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, paymentMethod: "RAZORPAY" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Payment failed", variant: "danger" });
        setLoading(false);
        return;
      }
      const ok = await loadRazorpaySdk();
      if (!ok || !window.Razorpay) {
        toast({ title: "Could not load Razorpay", variant: "danger" });
        setLoading(false);
        return;
      }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: shop.name,
        prefill: { name, contact: phone },
        handler: () => {
          clearCart();
          router.push(`/shop/${shop.slug}/order/${data.orderId}`);
        },
      });
      rzp.open();
      setLoading(false);
      return;
    }

    // COD / UPI — create the order then confirm + notify via WhatsApp.
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, paymentMethod: method }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: data.error ?? "Order failed", variant: "danger" });
      return;
    }

    const msg = buildOrderMessage({
      shopName: shop.name,
      currency: shop.currency,
      items: items.map((i) => ({
        name: i.name,
        variant: i.variant,
        qty: i.qty,
        lineTotal: (i.price * i.qty).toFixed(2),
      })),
      total: total.toFixed(2),
      customerName: name,
      customerPhone: phone,
    });
    window.open(waMeLink(shop.whatsappNumber, msg), "_blank");
    clearCart();
    router.push(`/shop/${shop.slug}/order/${data.orderId}`);
  }

  const methods: { id: Method; label: string; show: boolean }[] = [
    { id: "RAZORPAY", label: "Pay with Razorpay (UPI/Card)", show: shop.razorpayEnabled },
    { id: "TELR", label: "Pay by card (Telr)", show: shop.telrEnabled },
    { id: "STRIPE", label: "Pay by card (Stripe)", show: shop.stripeEnabled },
    { id: "UPI", label: "Pay by UPI QR", show: Boolean(shop.upiQrUrl) },
    { id: "COD", label: "Cash on Delivery", show: shop.codEnabled },
  ];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-[#6b7280]">
        Your cart is empty.
        <button onClick={() => router.push(`/shop/${shop.slug}`)} className="mt-3 block w-full text-wa-dark">
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4">
      <h1 className="text-xl font-bold">Checkout</h1>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name *"
          className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (+971…) *"
          className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm"
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Delivery address (optional)"
          rows={2}
          className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Order notes (optional)"
          rows={2}
          className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-[#e5e7eb] p-3">
        {items.map((i) => (
          <div key={`${i.productId}-${i.variant ?? ""}`} className="flex justify-between py-1 text-sm">
            <span className="truncate">
              {i.name}
              {i.variant ? ` (${i.variant})` : ""} × {i.qty}
            </span>
            <span>{formatCurrency(i.price * i.qty, shop.currency)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-[#f3f4f6] pt-2 font-bold">
          <span>Total</span>
          <span>{formatCurrency(total, shop.currency)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Payment method</p>
        {methods.filter((m) => m.show).map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${method === m.id ? "border-wa-green bg-wa-light/40" : "border-[#e5e7eb]"}`}
          >
            <input
              type="radio"
              checked={method === m.id}
              onChange={() => setMethod(m.id)}
              className="accent-wa-green"
            />
            {m.label}
          </label>
        ))}
        {method === "UPI" && shop.upiQrUrl && (
          <div className="rounded-lg border border-[#e5e7eb] p-3 text-center">
            <Image src={shop.upiQrUrl} alt="UPI QR" width={180} height={180} className="mx-auto" />
            {shop.upiId && <p className="mt-1 text-xs text-[#6b7280]">{shop.upiId}</p>}
          </div>
        )}
      </div>

      <button
        onClick={place}
        disabled={!canPay || loading}
        className="h-12 w-full rounded-lg bg-wa-green font-bold text-white hover:bg-wa-dark disabled:bg-gray-200 disabled:text-[#9ca3af]"
      >
        {loading ? "Processing…" : "Place Order"}
      </button>
    </div>
  );
}

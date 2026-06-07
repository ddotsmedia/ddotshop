"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Shop {
  id: string;
  name: string;
  currency: string;
  logoUrl?: string | null;
  themeColor: string;
}

const DENOMS = [50, 100, 200, 500];

export function GiftCardPurchase({ shop }: { shop: Shop }) {
  const [value, setValue] = useState(100);
  const [custom, setCustom] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("+971");
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<{ code: string } | null>(null);

  const amount = custom ? Number(custom) : value;

  async function buy() {
    if (!amount || amount <= 0) return;
    setLoading(true);
    const res = await fetch("/api/gift-cards/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId: shop.id,
        value: amount,
        recipientName: recipientName || undefined,
        recipientEmail: recipientEmail || undefined,
        message: message || undefined,
        buyerName: buyerName || undefined,
        buyerPhone: buyerPhone || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Purchase failed", variant: "danger" });
      return;
    }
    const d = await res.json();
    setIssued({ code: d.code });
  }

  if (issued) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <Check className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-3 text-2xl font-bold">Gift card issued!</h1>
        <div className="mt-4 rounded-xl border-2 border-dashed border-wa-green p-6">
          <p className="text-sm text-[#6b7280]">Code</p>
          <p className="font-mono text-2xl font-bold tracking-wider">{issued.code}</p>
          <p className="mt-2 text-lg font-semibold text-wa-green">{formatCurrency(amount, shop.currency)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Gift className="h-6 w-6 text-wa-green" />
        <h1 className="text-xl font-bold">{shop.name} Gift Card</h1>
      </div>

      {/* Visual preview */}
      <div className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundColor: shop.themeColor }}>
        <div className="flex items-center justify-between">
          {shop.logoUrl ? (
            <Image src={shop.logoUrl} alt="" width={36} height={36} className="rounded-full" />
          ) : (
            <span className="font-bold">{shop.name}</span>
          )}
          <Gift className="h-6 w-6" />
        </div>
        <p className="mt-6 text-3xl font-extrabold">{formatCurrency(amount, shop.currency)}</p>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Amount</p>
        <div className="flex flex-wrap gap-2">
          {DENOMS.map((d) => (
            <button
              key={d}
              onClick={() => {
                setValue(d);
                setCustom("");
              }}
              className={`rounded-lg border px-4 py-2 text-sm ${!custom && value === d ? "border-wa-green bg-wa-light/40" : "border-[#e5e7eb]"}`}
            >
              {formatCurrency(d, shop.currency)}
            </button>
          ))}
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom"
            type="number"
            className="w-24 rounded-lg border border-[#e5e7eb] px-3 text-sm"
          />
        </div>
      </div>

      <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name (optional)" className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm" />
      <input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Recipient email (optional)" className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Personal message (optional)" rows={2} className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm" />
      <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Your name" className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm" />
      <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="Your WhatsApp (+971…)" className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm" />

      <button onClick={buy} disabled={loading || amount <= 0} className="h-12 w-full rounded-lg bg-wa-green font-bold text-white hover:bg-wa-dark disabled:bg-gray-200">
        {loading ? "Processing…" : `Buy gift card — ${formatCurrency(amount, shop.currency)}`}
      </button>
    </div>
  );
}

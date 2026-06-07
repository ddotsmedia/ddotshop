"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function VATSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState(5);
  const [vatNumber, setVatNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vat")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setEnabled(d.config.enabled);
          setRate(Number(d.config.rate));
          setVatNumber(d.config.vatNumber ?? "");
        }
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/vat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, rate: Number(rate), vatNumber: vatNumber || undefined }),
    });
    setSaving(false);
    const d = await res.json();
    toast(res.ok ? { title: "Saved", variant: "success" } : { title: d.error ?? "Failed", variant: "danger" });
  }

  return (
    <div>
      <Link href="/dashboard/settings" className="mb-4 inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>
      <PageHeader title="VAT" subtitle="UAE 5% VAT & FTA invoices" />

      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Tax configuration</CardTitle>
          <label className="flex items-center justify-between text-sm">
            Enable VAT
            <button type="button" onClick={() => setEnabled(!enabled)} className={`relative h-6 w-11 rounded-full ${enabled ? "bg-wa-green" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </label>
          <div>
            <Label>VAT rate (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            <p className="mt-1 text-xs text-[#9ca3af]">UAE standard rate is 5%. Only the FTA can change this.</p>
          </div>
          <div>
            <Label>TRN (Tax Registration Number)</Label>
            <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="15 digits" />
          </div>
          {enabled && !vatNumber && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              FTA requires a TRN for VAT invoices.
            </div>
          )}
          <div className="rounded-lg border border-[#e5e7eb] p-3 text-sm text-[#6b7280]">
            <p className="font-medium text-[#111827]">Preview</p>
            <div className="mt-1 flex justify-between"><span>Subtotal</span><span>AED 100.00</span></div>
            <div className="flex justify-between"><span>VAT {rate}%</span><span>AED {(100 * rate / 100).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-[#111827]"><span>Total</span><span>AED {(100 + 100 * rate / 100).toFixed(2)}</span></div>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save VAT settings"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

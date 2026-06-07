"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, CalendarClock, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { buildCheckoutFlow, buildBookingFlow, buildCSATFlow, type FlowType } from "@/lib/wa-flows";

const TYPES: { id: FlowType; label: string; icon: typeof ShoppingBag; desc: string }[] = [
  { id: "CHECKOUT", label: "Checkout", icon: ShoppingBag, desc: "Browse + order inside WhatsApp" },
  { id: "BOOKING", label: "Booking", icon: CalendarClock, desc: "Pick a service + time slot" },
  { id: "SURVEY", label: "Survey (CSAT)", icon: Star, desc: "1–5 star rating after order" },
];

export default function NewFlowPage() {
  const router = useRouter();
  const [type, setType] = useState<FlowType>("CHECKOUT");
  const [name, setName] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=50&published=true")
      .then((r) => r.json())
      .then((d) =>
        setProducts((d.products ?? []).map((p: { id: string; name: string; price: string }) => ({ id: p.id, name: p.name, price: Number(p.price) }))),
      )
      .catch(() => {});
  }, []);

  async function save() {
    if (!name) return;
    setSaving(true);
    let flowJson: Record<string, unknown>;
    if (type === "CHECKOUT") {
      flowJson = buildCheckoutFlow({ name, currency: "AED" }, products) as Record<string, unknown>;
    } else if (type === "BOOKING") {
      flowJson = buildBookingFlow({ name }, products.map((p) => ({ id: p.id, name: p.name, durationMin: 30 }))) as Record<string, unknown>;
    } else {
      flowJson = buildCSATFlow("sample") as Record<string, unknown>;
    }
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, flowJson }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: data.error ?? "Save failed", variant: "danger" });
      return;
    }
    toast({ title: "Flow created", variant: "success" });
    router.push("/dashboard/whatsapp/flows");
    router.refresh();
  }

  return (
    <div>
      <Link href="/dashboard/whatsapp/flows" className="mb-4 inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="New flow" subtitle="Create an in-chat WhatsApp experience" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <Label>Flow name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Eid Checkout" />
              </div>
              <div>
                <Label>Type</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`rounded-lg border p-3 text-left ${type === t.id ? "border-wa-green ring-1 ring-wa-green" : "border-[#e5e7eb]"}`}
                    >
                      <t.icon className="h-5 w-5 text-wa-green" />
                      <p className="mt-1 text-sm font-semibold">{t.label}</p>
                      <p className="text-xs text-[#6b7280]">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {type !== "SURVEY" && (
                <p className="text-xs text-[#9ca3af]">
                  {products.length} published {type === "BOOKING" ? "services" : "products"} will be included.
                </p>
              )}
              <Button onClick={save} disabled={saving || !name}>
                {saving ? "Saving…" : "Create flow"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <CardTitle className="mb-3">Preview</CardTitle>
            <div className="rounded-lg bg-[#e5ddd5] p-4 text-sm">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="font-semibold">{name || "Flow name"}</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {type === "CHECKOUT" && "Select product → quantity → address → confirm"}
                  {type === "BOOKING" && "Select service → date → time → confirm"}
                  {type === "SURVEY" && "Rate 1–5 stars → optional comment → submit"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface SaleProduct {
  productId: string;
  salePrice: number;
}
export interface FlashSaleInitial {
  id?: string;
  name: string;
  startsAt: string;
  endsAt: string;
  products: SaleProduct[];
}

export function FlashSaleForm({ initial }: { initial?: FlashSaleInitial }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [catalog, setCatalog] = useState<{ id: string; name: string; price: number }[]>([]);
  const [picks, setPicks] = useState<Record<string, number>>(
    Object.fromEntries((initial?.products ?? []).map((p) => [p.productId, p.salePrice])),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) =>
        setCatalog((d.products ?? []).map((p: { id: string; name: string; price: string }) => ({ id: p.id, name: p.name, price: Number(p.price) }))),
      )
      .catch(() => {});
  }, []);

  function toggle(id: string, price: number) {
    setPicks((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = Math.round(price * 0.8 * 100) / 100;
      return next;
    });
  }

  async function save() {
    const products = Object.entries(picks).map(([productId, salePrice]) => ({ productId, salePrice: Number(salePrice) }));
    if (!name || !startsAt || !endsAt || products.length === 0) {
      toast({ title: "Fill name, dates, and pick products", variant: "danger" });
      return;
    }
    setSaving(true);
    const res = await fetch(editing ? `/api/flash-sales/${initial!.id}` : "/api/flash-sales", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startsAt, endsAt, products }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Save failed", variant: "danger" });
      return;
    }
    toast({ title: editing ? "Updated" : "Created", variant: "success" });
    router.push("/dashboard/flash-sales");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Details</CardTitle>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend Flash" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Starts</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <Label>Ends</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardTitle className="mb-3">Products &amp; sale prices</CardTitle>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {catalog.map((p) => {
              const picked = p.id in picks;
              const savings = picked ? Math.round((1 - picks[p.id] / p.price) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-2">
                  <input type="checkbox" checked={picked} onChange={() => toggle(p.id, p.price)} className="accent-wa-green" />
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-xs text-[#9ca3af] line-through">{p.price}</span>
                  {picked && (
                    <>
                      <Input
                        type="number"
                        className="w-24"
                        value={picks[p.id]}
                        onChange={(e) => setPicks((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                      />
                      <span className="w-10 text-xs text-success">-{savings}%</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : editing ? "Save flash sale" : "Create flash sale"}
      </Button>
    </div>
  );
}

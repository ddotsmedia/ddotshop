"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export interface BundleInitial {
  id?: string;
  name: string;
  description?: string | null;
  bundlePrice: number;
  imageUrl?: string | null;
  isActive: boolean;
  items: { productId: string; qty: number }[];
}

export function BundleForm({ initial }: { initial?: BundleInitial }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [bundlePrice, setBundlePrice] = useState(initial?.bundlePrice ?? 0);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [catalog, setCatalog] = useState<{ id: string; name: string; price: number }[]>([]);
  const [items, setItems] = useState<Record<string, number>>(
    Object.fromEntries((initial?.items ?? []).map((i) => [i.productId, i.qty])),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => setCatalog((d.products ?? []).map((p: { id: string; name: string; price: string }) => ({ id: p.id, name: p.name, price: Number(p.price) }))))
      .catch(() => {});
  }, []);

  const original = Object.entries(items).reduce((s, [id, qty]) => {
    const p = catalog.find((c) => c.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);
  const savings = Math.max(0, original - bundlePrice);
  const savePct = original > 0 ? Math.round((savings / original) * 100) : 0;

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "bundles");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) setImageUrl((await res.json()).url);
  }

  async function save() {
    const itemArr = Object.entries(items).map(([productId, qty]) => ({ productId, qty: Number(qty) }));
    if (!name || itemArr.length === 0) {
      toast({ title: "Name + at least 1 product required", variant: "danger" });
      return;
    }
    setSaving(true);
    const res = await fetch(editing ? `/api/bundles/${initial!.id}` : "/api/bundles", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, bundlePrice: Number(bundlePrice), imageUrl: imageUrl || undefined, isActive, items: itemArr }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Save failed", variant: "danger" });
      return;
    }
    toast({ title: editing ? "Updated" : "Created", variant: "success" });
    router.push("/dashboard/bundles");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Bundle</CardTitle>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Bundle price</Label>
              <Input type="number" value={bundlePrice} onChange={(e) => setBundlePrice(Number(e.target.value))} />
            </div>
            {original > 0 && (
              <p className="text-sm text-success">You save: {formatCurrency(savings)} ({savePct}%)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle className="mb-3">Products in bundle</CardTitle>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {catalog.map((p) => {
                const picked = p.id in items;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-2">
                    <input type="checkbox" checked={picked} onChange={() => setItems((prev) => { const n = { ...prev }; if (picked) delete n[p.id]; else n[p.id] = 1; return n; })} className="accent-wa-green" />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-xs text-[#9ca3af]">{formatCurrency(p.price)}</span>
                    {picked && (
                      <Input type="number" min={1} className="w-20" value={items[p.id]} onChange={(e) => setItems((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3">
            <CardTitle>Image</CardTitle>
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-[#d1d5db] py-4 text-center text-sm text-[#6b7280]">
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </label>
            {imageUrl && <Image src={imageUrl} alt="" width={120} height={120} className="rounded-lg object-cover" />}
            <label className="flex items-center justify-between text-sm">
              Active
              <button type="button" onClick={() => setIsActive(!isActive)} className={`relative h-6 w-11 rounded-full ${isActive ? "bg-wa-green" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save bundle" : "Create bundle"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

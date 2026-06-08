"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, X, Plus, Loader2, Star } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface VariantType {
  name: string;
  values: string[];
}

export interface ProductInitial {
  id?: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionMl?: string | null;
  descriptionHi?: string | null;
  price: number;
  comparePrice?: number | null;
  images: string[];
  stock: number;
  trackStock: boolean;
  lowStockThreshold: number;
  categoryId?: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  isPreOrder?: boolean;
  preOrderDeposit?: number | null;
  allowSubscription?: boolean;
  variants: VariantType[];
}

const EMPTY: ProductInitial = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  price: 0,
  comparePrice: undefined,
  images: [],
  stock: 0,
  trackStock: true,
  lowStockThreshold: 5,
  categoryId: undefined,
  isFeatured: false,
  isPublished: false,
  isPreOrder: false,
  preOrderDeposit: undefined,
  allowSubscription: false,
  variants: [],
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-[#374151]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-wa-green" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

export function ProductForm({
  initial,
  currency = "AED",
}: {
  initial?: ProductInitial;
  currency?: string;
}) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [p, setP] = useState<ProductInitial>(initial ?? { ...EMPTY, isPublished: false });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variantDraft, setVariantDraft] = useState({ name: "", value: "" });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const set = <K extends keyof ProductInitial>(k: K, v: ProductInitial[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  async function runAI() {
    if (!p.name) {
      toast({ title: "Enter a product name first", variant: "danger" });
      return;
    }
    setAiLoading(true);
    const res = await fetch("/api/ai/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: p.name,
        category: categories.find((c) => c.id === p.categoryId)?.name,
        price: p.price,
        currency,
        variants: p.variants.flatMap((v) => v.values),
      }),
    });
    setAiLoading(false);
    if (!res.ok) {
      toast({ title: "AI description failed", variant: "danger" });
      return;
    }
    const data = await res.json();
    setP((prev) => ({
      ...prev,
      description: data.description,
      descriptionAr: data.descriptionAr,
      descriptionMl: data.descriptionMl ?? prev.descriptionMl,
      descriptionHi: data.descriptionHi ?? prev.descriptionHi,
    }));
    setAiUsed(true);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = 5 - p.images.length;
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setP((prev) => ({ ...prev, images: [...prev.images, url] }));
      } else {
        toast({ title: "Image upload failed", variant: "danger" });
      }
    }
    setUploading(false);
  }

  function addVariantType() {
    if (!variantDraft.name.trim()) return;
    set("variants", [...p.variants, { name: variantDraft.name.trim(), values: [] }]);
    setVariantDraft({ name: "", value: "" });
  }

  async function save(publish?: boolean) {
    setSaving(true);
    const payload = {
      name: p.name,
      nameAr: p.nameAr || undefined,
      description: p.description || undefined,
      descriptionAr: p.descriptionAr || undefined,
      descriptionMl: p.descriptionMl || undefined,
      descriptionHi: p.descriptionHi || undefined,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
      images: p.images,
      stock: Number(p.stock),
      trackStock: p.trackStock,
      lowStockThreshold: Number(p.lowStockThreshold),
      categoryId: p.categoryId || undefined,
      isFeatured: p.isFeatured,
      isPublished: publish ?? p.isPublished,
      isPreOrder: p.isPreOrder ?? false,
      preOrderDeposit: p.preOrderDeposit ? Number(p.preOrderDeposit) : undefined,
      allowSubscription: p.allowSubscription ?? false,
      variants: p.variants.filter((v) => v.values.length > 0),
    };
    const res = await fetch(
      editing ? `/api/products/${initial!.id}` : "/api/products",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast({ title: e.error ?? "Save failed", variant: "danger" });
      return;
    }
    toast({ title: editing ? "Product updated" : "Product created", variant: "success" });
    router.push("/dashboard/products");
    router.refresh();
  }

  const onSale = p.comparePrice && Number(p.comparePrice) > Number(p.price);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Basic info</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name (English)</Label>
                <Input value={p.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input
                  dir="rtl"
                  value={p.nameAr ?? ""}
                  onChange={(e) => set("nameAr", e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Description</Label>
                <Button type="button" size="sm" variant="ghost" onClick={runAI} disabled={aiLoading}>
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-wa-green" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                rows={4}
                value={p.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
              {aiUsed && (
                <p className="mt-1 text-xs text-wa-dark">✨ Generated by Claude Haiku</p>
              )}
            </div>
            {p.descriptionAr && (
              <div>
                <Label>Description (Arabic)</Label>
                <Textarea
                  dir="rtl"
                  rows={3}
                  value={p.descriptionAr ?? ""}
                  onChange={(e) => set("descriptionAr", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Pricing</CardTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Price ({currency})</Label>
                <Input
                  type="number"
                  min={0}
                  value={p.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Compare price</Label>
                <Input
                  type="number"
                  min={0}
                  value={p.comparePrice ?? ""}
                  onChange={(e) =>
                    set("comparePrice", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
            {onSale && <p className="text-xs text-success">SALE badge will appear on this product.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Variants</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Variant type (e.g. Size)"
                value={variantDraft.name}
                onChange={(e) => setVariantDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <Button type="button" variant="secondary" onClick={addVariantType}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {p.variants.map((vt, i) => (
              <div key={i} className="rounded-lg border border-[#e5e7eb] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{vt.name}</span>
                  <button
                    type="button"
                    onClick={() => set("variants", p.variants.filter((_, idx) => idx !== i))}
                    className="text-[#9ca3af] hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {vt.values.map((val, vi) => (
                    <span
                      key={vi}
                      className="inline-flex items-center gap-1 rounded-full bg-wa-light px-2.5 py-0.5 text-xs text-wa-dark"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...p.variants];
                          next[i].values = next[i].values.filter((_, idx) => idx !== vi);
                          set("variants", next);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    className="w-28 border-0 text-xs outline-none"
                    placeholder="Add value + Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!val) return;
                        const next = [...p.variants];
                        next[i].values = [...next[i].values, val];
                        set("variants", next);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3">
            <CardTitle>Images</CardTitle>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d1d5db] py-6 text-sm text-[#6b7280] hover:border-wa-green">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Click or drag to upload (max 5)</>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
                disabled={p.images.length >= 5}
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {p.images.map((url, i) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
                  <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => set("images", p.images.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <CardTitle>Category</CardTitle>
            <Select
              value={p.categoryId ?? ""}
              onValueChange={(v) => set("categoryId", v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <CardTitle>Inventory</CardTitle>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                min={0}
                value={p.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
            </div>
            <Toggle checked={p.trackStock} onChange={(v) => set("trackStock", v)} label="Track stock" />
            <div>
              <Label>Low stock threshold</Label>
              <Input
                type="number"
                min={0}
                value={p.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <CardTitle>Publish</CardTitle>
            <Toggle
              checked={p.isFeatured}
              onChange={(v) => set("isFeatured", v)}
              label="Featured"
            />
            <Toggle
              checked={p.isPublished}
              onChange={(v) => set("isPublished", v)}
              label="Published"
            />
            <Toggle
              checked={p.isPreOrder ?? false}
              onChange={(v) => set("isPreOrder", v)}
              label="Pre-order"
            />
            {p.isPreOrder && (
              <div>
                <Label>Deposit amount ({currency})</Label>
                <Input
                  type="number"
                  value={p.preOrderDeposit ?? ""}
                  onChange={(e) => set("preOrderDeposit", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            )}
            <Toggle
              checked={p.allowSubscription ?? false}
              onChange={(v) => set("allowSubscription", v)}
              label="Allow subscriptions"
            />
            <Button className="w-full" disabled={saving || !p.name} onClick={() => save(true)}>
              <Star className="h-4 w-4" />
              {saving ? "Saving…" : editing ? "Save & publish" : "Publish product"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={saving || !p.name}
              onClick={() => save(false)}
            >
              Save as draft
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

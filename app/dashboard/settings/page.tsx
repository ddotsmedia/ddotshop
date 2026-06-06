"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface ShopSettings {
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  whatsappNumber: string;
  currency: string;
  locale: "EN" | "AR";
  themeColor: string;
  telrStoreId?: string | null;
  telrAuthKey?: string | null;
  stripeSecretKey?: string | null;
  upiId?: string | null;
  upiQrUrl?: string | null;
  codEnabled: boolean;
  notifyNewOrder: boolean;
  notifyAbandonedCart: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;
}

const THEMES = [
  { name: "Forest Green", color: "#0a5c36" },
  { name: "Ocean Blue", color: "#1e40af" },
  { name: "Rose", color: "#be185d" },
  { name: "Midnight", color: "#1e1b4b" },
  { name: "Sand", color: "#92400e" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-sm text-[#374151]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full ${checked ? "bg-wa-green" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

async function uploadFile(file: File, folder: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  return (await res.json()).url;
}

export default function SettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<ShopSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => d.shop && setS(d.shop));
  }, []);

  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) =>
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));

  async function save(patch: Partial<ShopSettings>) {
    setSaving(true);
    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) toast({ title: "Saved", variant: "success" });
    else toast({ title: "Save failed", variant: "danger" });
  }

  async function deleteShop() {
    const res = await fetch("/api/shop", { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Shop deleted", variant: "success" });
      router.push("/onboarding");
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  if (!s) return <div className="p-8 text-center text-[#6b7280]">Loading…</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your shop" />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border bg-gray-50">
                  {s.logoUrl ? (
                    <Image src={s.logoUrl} alt="logo" fill className="object-cover" sizes="80px" />
                  ) : (
                    <span className="grid h-full place-items-center text-2xl">{s.name[0]}</span>
                  )}
                </div>
                <label className="cursor-pointer text-sm font-medium text-wa-dark">
                  Upload logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await uploadFile(f, "branding");
                        if (url) {
                          set("logoUrl", url);
                          save({ logoUrl: url });
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Shop name</Label>
                  <Input value={s.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <Label>WhatsApp number</Label>
                  <Input value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={s.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Currency</Label>
                  <Select value={s.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["AED", "USD", "INR", "SAR", "QAR"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={s.locale} onValueChange={(v) => set("locale", v as "EN" | "AR")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="AR">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() =>
                  save({
                    name: s.name,
                    tagline: s.tagline ?? undefined,
                    whatsappNumber: s.whatsappNumber,
                    currency: s.currency,
                    locale: s.locale,
                  })
                }
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Theme</CardTitle>
              <div className="flex flex-wrap gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.color}
                    onClick={() => {
                      set("themeColor", t.color);
                      save({ themeColor: t.color });
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 ${s.themeColor === t.color ? "ring-2 ring-wa-green ring-offset-2" : ""}`}
                  >
                    <span className="h-12 w-12 rounded-lg" style={{ backgroundColor: t.color }} />
                    <span className="text-xs">{t.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm text-[#6b7280]">Preview</p>
                <div className="mx-auto w-56 overflow-hidden rounded-xl border">
                  <div className="px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: s.themeColor }}>
                    {s.name}
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <div className="aspect-square rounded bg-gray-100" />
                    <div className="aspect-square rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Telr (cards / Apple Pay)</CardTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Telr Store ID" value={s.telrStoreId ?? ""} onChange={(e) => set("telrStoreId", e.target.value)} />
                <Input placeholder="Telr Auth Key" value={s.telrAuthKey ?? ""} onChange={(e) => set("telrAuthKey", e.target.value)} />
              </div>
              <CardTitle>Stripe</CardTitle>
              <Input placeholder="Stripe Secret Key" value={s.stripeSecretKey ?? ""} onChange={(e) => set("stripeSecretKey", e.target.value)} />
              <CardTitle>UPI</CardTitle>
              <Input placeholder="UPI ID" value={s.upiId ?? ""} onChange={(e) => set("upiId", e.target.value)} />
              <label className="cursor-pointer text-sm font-medium text-wa-dark">
                Upload UPI QR
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await uploadFile(f, "payments");
                      if (url) set("upiQrUrl", url);
                    }
                  }}
                />
              </label>
              {s.upiQrUrl && <Image src={s.upiQrUrl} alt="UPI QR" width={120} height={120} />}
              <Toggle checked={s.codEnabled} onChange={(v) => set("codEnabled", v)} label="Cash on Delivery" />
              <Button
                onClick={() =>
                  save({
                    telrStoreId: s.telrStoreId ?? undefined,
                    telrAuthKey: s.telrAuthKey ?? undefined,
                    stripeSecretKey: s.stripeSecretKey ?? undefined,
                    upiId: s.upiId ?? undefined,
                    upiQrUrl: s.upiQrUrl ?? undefined,
                    codEnabled: s.codEnabled,
                  })
                }
                disabled={saving}
              >
                Save payments
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="space-y-2">
              <Toggle checked={s.notifyNewOrder} onChange={(v) => set("notifyNewOrder", v)} label="New order WhatsApp notification" />
              <Toggle checked={s.notifyAbandonedCart} onChange={(v) => set("notifyAbandonedCart", v)} label="Abandoned cart recovery" />
              <Toggle checked={s.notifyLowStock} onChange={(v) => set("notifyLowStock", v)} label="Low stock alerts" />
              <div className="pt-2">
                <Label>Low stock threshold</Label>
                <Input
                  type="number"
                  className="max-w-[120px]"
                  value={s.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
                />
              </div>
              <Button
                className="mt-2"
                onClick={() =>
                  save({
                    notifyNewOrder: s.notifyNewOrder,
                    notifyAbandonedCart: s.notifyAbandonedCart,
                    notifyLowStock: s.notifyLowStock,
                    lowStockThreshold: s.lowStockThreshold,
                  })
                }
                disabled={saving}
              >
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DANGER */}
        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardContent className="space-y-3">
              <CardTitle className="text-danger">Delete shop</CardTitle>
              <p className="text-sm text-[#6b7280]">
                Permanently deletes your shop and all products, orders, and customers. This cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete shop
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shop?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280]">
            Type <strong>{s.slug}</strong> to confirm.
          </p>
          <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} className="mt-2" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={confirmSlug !== s.slug} onClick={deleteShop}>
              Delete forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

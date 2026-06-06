"use client";

import { useEffect, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface Category {
  id: string;
  name: string;
  nameAr?: string | null;
  sortOrder: number;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Category added", variant: "success" });
      setOpen(false);
      setForm({ name: "", nameAr: "", sortOrder: 0 });
      load();
    } else {
      toast({ title: "Failed to add category", variant: "danger" });
    }
  }

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize your products">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </PageHeader>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[#6b7280]">
            No categories yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-wa-light text-wa-dark">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[#9ca3af]">
                    {c._count?.products ?? 0} products
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name (English)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Name (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full" onClick={create} disabled={saving || !form.name}>
              {saving ? "Adding…" : "Add category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

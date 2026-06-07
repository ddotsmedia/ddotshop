"use client";

import { useEffect, useState } from "react";
import { Plus, Gift } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Card {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  recipientName?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(100);
  const [recipientName, setRecipientName] = useState("");

  async function load() {
    setLoading(true);
    const d = await fetch("/api/gift-cards").then((r) => r.json());
    setCards(
      (d.cards ?? []).map((c: Card & { initialValue: string; balance: string }) => ({
        ...c,
        initialValue: Number(c.initialValue),
        balance: Number(c.balance),
      })),
    );
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: Number(value), recipientName: recipientName || undefined }),
    });
    const d = await res.json();
    if (res.ok) {
      toast({ title: `Created ${d.code}`, variant: "success" });
      setOpen(false);
      load();
    } else {
      toast({ title: d.error ?? "Failed", variant: "danger" });
    }
  }

  const issued = cards.reduce((s, c) => s + c.initialValue, 0);
  const outstanding = cards.reduce((s, c) => s + c.balance, 0);
  const redeemed = issued - outstanding;

  const columns: Column<Card>[] = [
    { key: "code", label: "Code", render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    { key: "initialValue", label: "Value", render: (c) => formatCurrency(c.initialValue) },
    { key: "balance", label: "Balance", render: (c) => formatCurrency(c.balance) },
    { key: "recipientName", label: "Recipient", render: (c) => c.recipientName ?? "—" },
    { key: "isActive", label: "Status", render: (c) => <Badge variant={c.isActive ? "success" : "muted"}>{c.isActive ? "Active" : "Used"}</Badge> },
    { key: "createdAt", label: "Created", render: (c) => formatDate(c.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Gift Cards" subtitle="Issue and track store credit">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create gift card
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total issued" value={issued} currency="AED" icon={Gift} />
        <MetricCard title="Total redeemed" value={redeemed} currency="AED" icon={Gift} />
        <MetricCard title="Outstanding" value={outstanding} currency="AED" icon={Gift} />
      </div>

      <DataTable columns={columns} data={cards} loading={loading} emptyMessage="No gift cards yet." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create gift card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Value (AED)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
            <div>
              <Label>Recipient name (optional)</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <Button className="w-full" onClick={create}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

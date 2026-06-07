"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Pause, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Sub {
  id: string;
  intervalDays: number;
  nextOrderAt: string;
  isActive: boolean;
  customer?: { name?: string | null; phone: string } | null;
  product?: { name: string; price: number } | null;
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/subscriptions2").then((r) => r.json());
    setSubs(d.subscriptions ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function pause(id: string) {
    const res = await fetch(`/api/subscriptions2/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Paused", variant: "success" });
      load();
    }
  }

  const active = subs.filter((s) => s.isActive);
  const mrr = active.reduce((sum, s) => {
    const price = Number(s.product?.price ?? 0);
    const perMonth = (30 / s.intervalDays) * price;
    return sum + perMonth;
  }, 0);

  const columns: Column<Sub>[] = [
    { key: "customer", label: "Customer", render: (s) => s.customer?.name ?? s.customer?.phone ?? "—" },
    { key: "product", label: "Product", render: (s) => s.product?.name ?? "—" },
    { key: "intervalDays", label: "Interval", render: (s) => `${s.intervalDays}d` },
    { key: "nextOrderAt", label: "Next order", render: (s) => formatDate(s.nextOrderAt) },
    { key: "isActive", label: "Status", render: (s) => <Badge variant={s.isActive ? "success" : "muted"}>{s.isActive ? "Active" : "Paused"}</Badge> },
    {
      key: "actions",
      label: "",
      render: (s) =>
        s.isActive ? (
          <Button size="sm" variant="ghost" onClick={() => pause(s.id)}>
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" subtitle="Recurring orders (Pro)" />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Active" value={active.length} icon={RefreshCw} />
        <MetricCard title="Paused" value={subs.length - active.length} icon={Pause} />
        <MetricCard title="Est. MRR" value={Math.round(mrr)} currency="AED" icon={DollarSign} />
      </div>
      <DataTable columns={columns} data={subs} loading={loading} emptyMessage="No subscriptions yet." />
    </div>
  );
}

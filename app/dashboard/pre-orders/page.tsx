"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const STATUSES = ["PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"];

interface PreOrder {
  id: string;
  customerPhone: string;
  customerName?: string | null;
  depositPaid: number;
  totalPrice: number;
  status: string;
  expectedAt?: string | null;
  product?: { name: string } | null;
}

export default function PreOrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/pre-orders").then((r) => r.json());
    setRows(
      (d.preOrders ?? []).map((p: PreOrder & { depositPaid: string; totalPrice: string }) => ({
        ...p,
        depositPaid: Number(p.depositPaid),
        totalPrice: Number(p.totalPrice),
      })),
    );
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/pre-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: "Updated", variant: "success" });
      load();
    }
  }

  const columns: Column<PreOrder>[] = [
    { key: "product", label: "Product", render: (p) => <span className="font-medium">{p.product?.name ?? "—"}</span> },
    {
      key: "customer",
      label: "Customer",
      render: (p) => (
        <div>
          <p>{p.customerName ?? "—"}</p>
          <p className="text-xs text-[#9ca3af]">{p.customerPhone}</p>
        </div>
      ),
    },
    { key: "depositPaid", label: "Deposit", render: (p) => formatCurrency(p.depositPaid) },
    { key: "totalPrice", label: "Total", render: (p) => formatCurrency(p.totalPrice) },
    { key: "expectedAt", label: "Expected", render: (p) => (p.expectedAt ? formatDate(p.expectedAt) : "—") },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={p.status} onValueChange={(v) => setStatus(p.id, v)}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Pre-orders" subtitle="Deposits and upcoming fulfillment" />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No pre-orders yet."
        onRowClick={(p) => router.push(`/dashboard/pre-orders/${p.id}`)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Download, Mic } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const STATUSES = ["all", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  source?: string;
  createdAt: string;
  _count?: { items: number };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(
      (data.orders ?? []).map((o: Order & { total: string | number }) => ({
        ...o,
        total: Number(o.total),
      })),
    );
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [status, search, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function changeStatus(id: string, value: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (res.ok) {
      toast({ title: "Status updated", variant: "success" });
      load();
    } else {
      toast({ title: "Update failed", variant: "danger" });
    }
  }

  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "Order",
      render: (o) => (
        <span className="flex items-center gap-1.5 font-mono text-xs">
          #{o.id.slice(-6).toUpperCase()}
          {o.source === "voice" && <Mic className="h-3.5 w-3.5 text-wa-dark" />}
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (o) => (
        <div>
          <p className="font-medium">{o.customerName}</p>
          <p className="text-xs text-[#9ca3af]">{o.customerPhone}</p>
        </div>
      ),
    },
    { key: "items", label: "Items", render: (o) => o._count?.items ?? 0 },
    { key: "total", label: "Total", render: (o) => formatCurrency(o.total) },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.filter((s) => s !== "all").map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    { key: "createdAt", label: "Date", render: (o) => formatDate(o.createdAt) },
    {
      key: "actions",
      label: "",
      render: (o) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => router.push(`/dashboard/orders/${o.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer">
            <Button size="icon" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Track and fulfill customer orders" />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${status === s ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]"}`}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search customer…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No orders match these filters."
        onRowClick={(o) => router.push(`/dashboard/orders/${o.id}`)}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-[#6b7280]">
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

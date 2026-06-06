"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { waMeLink } from "@/lib/wa-format";

interface Customer {
  id: string;
  name?: string | null;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  tags: string[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(
      (data.customers ?? []).map((c: Customer & { totalSpent: string | number }) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
      })),
    );
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Customer",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-wa-light text-xs font-semibold text-wa-dark">
            {initials(c.name ?? c.phone)}
          </span>
          <span className="font-medium">{c.name ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (c) => (
        <a
          href={waMeLink(c.phone, "")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-wa-dark"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {c.phone}
        </a>
      ),
    },
    { key: "totalOrders", label: "Orders" },
    { key: "totalSpent", label: "Spent", render: (c) => formatCurrency(c.totalSpent) },
    {
      key: "lastOrderAt",
      label: "Last order",
      render: (c) => (c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"),
    },
    {
      key: "tags",
      label: "Tags",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <Badge key={t} variant="info">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Everyone who has ordered from you" />
      <div className="mb-4">
        <Input
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers yet."
        onRowClick={(c) => router.push(`/dashboard/customers/${c.id}`)}
      />
    </div>
  );
}

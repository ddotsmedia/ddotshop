"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Sale {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  _count?: { products: number };
}

function status(s: Sale): { label: string; variant: "success" | "info" | "muted" } {
  const now = Date.now();
  if (new Date(s.endsAt).getTime() < now) return { label: "ENDED", variant: "muted" };
  if (new Date(s.startsAt).getTime() > now) return { label: "SCHEDULED", variant: "info" };
  return { label: "ACTIVE", variant: "success" };
}

export default function FlashSalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/flash-sales").then((r) => r.json());
    setSales(d.sales ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this flash sale?")) return;
    const res = await fetch(`/api/flash-sales/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Deleted", variant: "success" });
      load();
    }
  }

  const columns: Column<Sale>[] = [
    { key: "name", label: "Name", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "startsAt", label: "Start", render: (s) => formatDateTime(s.startsAt) },
    { key: "endsAt", label: "End", render: (s) => formatDateTime(s.endsAt) },
    { key: "products", label: "Products", render: (s) => s._count?.products ?? 0 },
    {
      key: "status",
      label: "Status",
      render: (s) => {
        const st = status(s);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => router.push(`/dashboard/flash-sales/${s.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => del(s.id)}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Flash Sales" subtitle="Time-limited discounts">
        <Link href="/dashboard/flash-sales/new">
          <Button>
            <Plus className="h-4 w-4" /> New flash sale
          </Button>
        </Link>
      </PageHeader>
      <DataTable columns={columns} data={sales} loading={loading} emptyMessage="No flash sales yet." />
    </div>
  );
}

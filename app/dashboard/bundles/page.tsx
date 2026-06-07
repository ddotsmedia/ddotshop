"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Boxes } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Bundle {
  id: string;
  name: string;
  bundlePrice: number;
  imageUrl?: string | null;
  isActive: boolean;
  items: { qty: number; product: { price: number } }[];
}

export default function BundlesPage() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/bundles").then((r) => r.json());
    setBundles(
      (d.bundles ?? []).map((b: Bundle & { bundlePrice: string }) => ({ ...b, bundlePrice: Number(b.bundlePrice) })),
    );
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this bundle?")) return;
    const res = await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Deleted", variant: "success" });
      load();
    }
  }

  const columns: Column<Bundle>[] = [
    {
      key: "image",
      label: "",
      render: (b) =>
        b.imageUrl ? (
          <Image src={b.imageUrl} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded bg-gray-100 text-[#9ca3af]"><Boxes className="h-4 w-4" /></div>
        ),
    },
    { key: "name", label: "Name", render: (b) => <span className="font-medium">{b.name}</span> },
    { key: "items", label: "Items", render: (b) => b.items.length },
    {
      key: "original",
      label: "Original",
      render: (b) => formatCurrency(b.items.reduce((s, i) => s + Number(i.product.price) * i.qty, 0)),
    },
    { key: "bundlePrice", label: "Bundle", render: (b) => formatCurrency(b.bundlePrice) },
    { key: "isActive", label: "Status", render: (b) => <Badge variant={b.isActive ? "success" : "muted"}>{b.isActive ? "Active" : "Off"}</Badge> },
    {
      key: "actions",
      label: "",
      render: (b) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => router.push(`/dashboard/bundles/${b.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => del(b.id)}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Product Bundles" subtitle="Sell products together at a deal">
        <Link href="/dashboard/bundles/new">
          <Button>
            <Plus className="h-4 w-4" /> New bundle
          </Button>
        </Link>
      </PageHeader>
      <DataTable columns={columns} data={bundles} loading={loading} emptyMessage="No bundles yet." />
    </div>
  );
}

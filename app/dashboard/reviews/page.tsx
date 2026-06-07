"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Star, Check, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Review {
  id: string;
  rating: number;
  body?: string | null;
  source: string;
  approved: boolean;
  createdAt: string;
  customer?: { name?: string | null } | null;
  product?: { name: string; images: string[] } | null;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= n ? "fill-warning text-warning" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch(`/api/reviews?mine=1&status=${status}`).then((r) => r.json());
    setReviews(d.reviews ?? []);
    setAvg(d.avg ?? 0);
    setCount(d.count ?? 0);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id: string, approved: boolean) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (res.ok) {
      toast({ title: approved ? "Approved" : "Hidden", variant: "success" });
      load();
    } else toast({ title: "Failed", variant: "danger" });
  }

  const columns: Column<Review>[] = [
    {
      key: "product",
      label: "Product",
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.product?.images[0] ? (
            <Image src={r.product.images[0]} alt="" width={32} height={32} className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="h-8 w-8 rounded bg-gray-100" />
          )}
          <span className="text-sm">{r.product?.name ?? "—"}</span>
        </div>
      ),
    },
    { key: "customer", label: "Customer", render: (r) => r.customer?.name ?? "—" },
    { key: "rating", label: "Rating", render: (r) => <Stars n={r.rating} /> },
    { key: "body", label: "Review", render: (r) => <span className="text-sm text-[#6b7280]">{r.body ?? "—"}</span> },
    { key: "source", label: "Source", render: (r) => <Badge variant="muted">{r.source}</Badge> },
    { key: "createdAt", label: "Date", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      label: "",
      render: (r) =>
        r.approved ? (
          <Button size="sm" variant="ghost" onClick={() => moderate(r.id, false)}>
            <EyeOff className="h-4 w-4" /> Hide
          </Button>
        ) : (
          <Button size="sm" onClick={() => moderate(r.id, true)}>
            <Check className="h-4 w-4" /> Approve
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Collected from WhatsApp after delivery" />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Average rating" value={avg || "—"} icon={Star} />
        <MetricCard title="Approved reviews" value={count} icon={Check} />
        <MetricCard title="Showing" value={reviews.length} icon={Star} />
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable columns={columns} data={reviews} loading={loading} emptyMessage="No reviews yet." />
    </div>
  );
}

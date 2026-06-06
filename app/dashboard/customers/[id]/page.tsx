"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
}
interface Customer {
  id: string;
  name?: string | null;
  phone: string;
  address?: string | null;
  notes?: string | null;
  tags: string[];
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  createdAt: string;
  orders: Order[];
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [c, setC] = useState<Customer | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.customer) {
          d.customer.totalSpent = Number(d.customer.totalSpent);
          d.customer.orders = d.customer.orders.map((o: Order) => ({ ...o, total: Number(o.total) }));
          setC(d.customer);
          setNotes(d.customer.notes ?? "");
        }
      });
  }, [params.id]);

  async function patch(data: { tags?: string[]; notes?: string }) {
    const res = await fetch(`/api/customers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setC((prev) => (prev ? { ...prev, tags: d.customer.tags, notes: d.customer.notes } : prev));
    } else {
      toast({ title: "Save failed", variant: "danger" });
    }
  }

  if (!c) return <div className="p-8 text-center text-[#6b7280]">Loading…</div>;

  const aov = c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/customers" className="inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-wa-light text-lg font-bold text-wa-dark">
          {initials(c.name ?? c.phone)}
        </span>
        <div>
          <h2 className="text-2xl font-bold">{c.name ?? "Customer"}</h2>
          <p className="text-sm text-[#6b7280]">
            {c.phone} · joined {formatDate(c.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total orders" value={c.totalOrders} icon={ShoppingCart} />
        <MetricCard title="Total spent" value={c.totalSpent} currency="AED" icon={DollarSign} />
        <MetricCard title="Avg order" value={aov} currency="AED" icon={TrendingUp} />
        <MetricCard
          title="Last order"
          value={c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent>
              <CardTitle className="mb-3">Order history</CardTitle>
              {c.orders.length === 0 ? (
                <p className="text-sm text-[#6b7280]">No orders.</p>
              ) : (
                <div className="divide-y divide-[#f3f4f6]">
                  {c.orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/dashboard/orders/${o.id}`}
                      className="flex items-center justify-between py-2 text-sm hover:bg-surface"
                    >
                      <span className="font-mono text-xs">#{o.id.slice(-6).toUpperCase()}</span>
                      <span className="text-[#6b7280]">{formatDate(o.createdAt)}</span>
                      <Badge variant="muted">{o.status}</Badge>
                      <span className="font-semibold">{formatCurrency(o.total)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <CardTitle className="mb-2">Tags</CardTitle>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700"
                  >
                    {t}
                    <button onClick={() => patch({ tags: c.tags.filter((x) => x !== t) })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag + Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    patch({ tags: [...c.tags, tagInput.trim()] });
                    setTagInput("");
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CardTitle className="mb-2">Notes</CardTitle>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => patch({ notes })}
                placeholder="Private notes about this customer…"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

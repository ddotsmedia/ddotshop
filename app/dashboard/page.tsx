import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Sparkles } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "info" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default async function DashboardHome() {
  const session = await auth();
  const shopId = session!.user.shopId!;
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { currency: true },
  });
  const currency = shop?.currency ?? "AED";

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [agg, orderCount, pageViews, recent] = await Promise.all([
    prisma.order.aggregate({
      where: { shopId, status: { not: "CANCELLED" }, createdAt: { gte: since } },
      _sum: { total: true },
      _avg: { total: true },
    }),
    prisma.order.count({ where: { shopId, createdAt: { gte: since } } }),
    prisma.pageView.count({ where: { shopId, createdAt: { gte: since } } }),
    prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, customerName: true, total: true, status: true, createdAt: true },
    }),
  ]);

  const recentRows: RecentOrder[] = recent.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    total: Number(o.total),
    status: o.status,
    createdAt: o.createdAt,
  }));

  const revenue = Number(agg._sum.total ?? 0);
  const aov = Number(agg._avg.total ?? 0);
  const conversion = pageViews > 0 ? (orderCount / pageViews) * 100 : 0;

  const columns: Column<RecentOrder>[] = [
    {
      key: "id",
      label: "Order",
      render: (r) => <span className="font-mono text-xs">#{r.id.slice(-6)}</span>,
    },
    { key: "customerName", label: "Customer" },
    {
      key: "total",
      label: "Total",
      render: (r) => formatCurrency(r.total, currency),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? "muted"}>{r.status}</Badge>
      ),
    },
    { key: "createdAt", label: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Revenue (30d)" value={revenue} currency={currency} icon={DollarSign} />
        <MetricCard title="Orders (30d)" value={orderCount} icon={ShoppingCart} />
        <MetricCard title="Avg order value" value={aov} currency={currency} icon={TrendingUp} />
        <MetricCard
          title="Conversion rate"
          value={`${conversion.toFixed(1)}%`}
          icon={Eye}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold">Recent orders</h3>
          <DataTable
            columns={columns}
            data={recentRows}
            emptyMessage="No orders yet — share your shop link to get your first sale."
          />
        </div>

        <Card className="border-l-4 border-l-wa-green p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-wa-green" />
            <h3 className="text-base font-semibold">AI Insights</h3>
          </div>
          <p className="mt-3 text-sm text-[#6b7280]">
            Sales insights appear here once you have orders. Powered by Claude.
          </p>
        </Card>
      </div>
    </div>
  );
}

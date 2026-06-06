import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const dayAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

export async function getRevenueByDay(shopId: string, days: number): Promise<DayPoint[]> {
  const since = dayAgo(days);
  const rows = await prisma.$queryRaw<{ date: Date; revenue: number; orders: bigint }[]>(
    Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS date,
             COALESCE(SUM("total"), 0)::float AS revenue,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "shopId" = ${shopId}
        AND "status" <> 'CANCELLED'
        AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `,
  );
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export async function getTopProducts(shopId: string, days: number, limit = 5) {
  const since = dayAgo(days);
  const rows = await prisma.orderItem.groupBy({
    by: ["name"],
    where: { order: { shopId, createdAt: { gte: since }, status: { not: "CANCELLED" } } },
    _sum: { lineTotal: true, qty: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    name: r.name,
    revenue: Number(r._sum.lineTotal ?? 0),
    sales: Number(r._sum.qty ?? 0),
  }));
}

export async function getDeviceBreakdown(shopId: string, days: number) {
  const since = dayAgo(days);
  const rows = await prisma.pageView.groupBy({
    by: ["device"],
    where: { shopId, createdAt: { gte: since } },
    _count: true,
  });
  const total = rows.reduce((s, r) => s + r._count, 0) || 1;
  return rows.map((r) => ({
    device: r.device ?? "unknown",
    count: r._count,
    percent: Math.round((r._count / total) * 100),
  }));
}

export interface KPIs {
  revenue: number;
  orders: number;
  aov: number;
  pageViews: number;
  conversionRate: number;
  revenueChange: number;
  ordersChange: number;
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function getKPIs(shopId: string, days: number): Promise<KPIs> {
  const now = dayAgo(0);
  const start = dayAgo(days);
  const prevStart = dayAgo(days * 2);

  const [cur, prev, views] = await Promise.all([
    prisma.order.aggregate({
      where: { shopId, status: { not: "CANCELLED" }, createdAt: { gte: start, lte: now } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { shopId, status: { not: "CANCELLED" }, createdAt: { gte: prevStart, lt: start } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.pageView.count({ where: { shopId, createdAt: { gte: start } } }),
  ]);

  const revenue = Number(cur._sum.total ?? 0);
  const orders = cur._count;
  return {
    revenue,
    orders,
    aov: orders > 0 ? revenue / orders : 0,
    pageViews: views,
    conversionRate: views > 0 ? Math.round((orders / views) * 1000) / 10 : 0,
    revenueChange: pct(revenue, Number(prev._sum.total ?? 0)),
    ordersChange: pct(orders, prev._count),
  };
}

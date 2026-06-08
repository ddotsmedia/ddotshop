export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";

const PLAN_PRICES: Record<string, number> = {
  STARTER: 49,
  GROWTH: 149,
  PRO: 349,
  AGENCY: 999,
};

export async function GET(req: NextRequest) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }
  void admin;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Daily revenue for last 30 days
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: "PAID", createdAt: { gte: thirtyDaysAgo } },
    select: { total: true, createdAt: true, shopId: true },
    orderBy: { createdAt: "asc" },
  });

  // Build daily revenue map
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const o of paidOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(o.total));
    }
  }
  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Revenue by plan — join through shop -> tenant
  const shopsWithTenants = await prisma.shop.findMany({
    select: {
      id: true,
      tenant: { select: { plan: true } },
    },
  });
  const shopPlanMap = new Map<string, string>();
  for (const s of shopsWithTenants) {
    if (s.tenant) shopPlanMap.set(s.id, s.tenant.plan);
  }

  const byPlanMap: Record<string, number> = { STARTER: 0, GROWTH: 0, PRO: 0, AGENCY: 0 };
  for (const o of paidOrders) {
    const plan = shopPlanMap.get(o.shopId) ?? "STARTER";
    byPlanMap[plan] = (byPlanMap[plan] ?? 0) + Number(o.total);
  }
  const byPlan = Object.entries(byPlanMap).map(([plan, revenue]) => ({ plan, revenue }));

  // Top 10 tenants by revenue (all-time)
  const allPaidOrders = await prisma.order.findMany({
    where: { paymentStatus: "PAID" },
    select: { total: true, shopId: true },
  });

  const tenantRevMap = new Map<string, number>();
  for (const o of allPaidOrders) {
    tenantRevMap.set(o.shopId, (tenantRevMap.get(o.shopId) ?? 0) + Number(o.total));
  }

  const topShopIds = [...tenantRevMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const topShopDetails = await prisma.shop.findMany({
    where: { id: { in: topShopIds } },
    select: { id: true, name: true, tenant: { select: { plan: true, user: { select: { email: true } } } } },
  });

  const topTenants = topShopDetails.map((s) => ({
    shopId: s.id,
    name: s.name,
    email: s.tenant?.user?.email ?? "",
    plan: s.tenant?.plan ?? "STARTER",
    revenue: tenantRevMap.get(s.id) ?? 0,
  }));
  topTenants.sort((a, b) => b.revenue - a.revenue);

  // MRR calculation
  const planCounts = await prisma.tenant.groupBy({ by: ["plan"], _count: { id: true } });
  const mrr = planCounts.reduce((sum, row) => {
    return sum + (PLAN_PRICES[row.plan] ?? 0) * row._count.id;
  }, 0);

  return NextResponse.json({ dailyRevenue, byPlan, topTenants, mrr });
}
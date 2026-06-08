export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";

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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    totalShops,
    totalOrders,
    paidOrders,
    revenueThisMonthOrders,
    newUsersThisWeek,
    planBreakdownRaw,
    topShopsRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "TENANT", lastLoginAt: { gte: thirtyDaysAgo } } }),
    prisma.shop.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      select: { total: true },
    }),
    prisma.user.count({ where: { role: "TENANT", createdAt: { gte: sevenDaysAgo } } }),
    prisma.tenant.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.shop.findMany({
      take: 5,
      select: {
        name: true,
        _count: { select: { orders: true } },
      },
      orderBy: { orders: { _count: "desc" } },
    }),
  ]);

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const revenueThisMonth = revenueThisMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const planBreakdown: Record<string, number> = {
    STARTER: 0,
    GROWTH: 0,
    PRO: 0,
    AGENCY: 0,
  };
  for (const row of planBreakdownRaw) {
    planBreakdown[row.plan] = row._count.id;
  }

  const topShops = topShopsRaw.map((s) => ({
    name: s.name,
    orderCount: s._count.orders,
  }));

  return NextResponse.json({
    totalUsers,
    activeUsers,
    totalShops,
    totalOrders,
    totalRevenue,
    revenueThisMonth,
    newUsersThisWeek,
    planBreakdown,
    topShops,
  });
}
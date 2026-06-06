import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/session";
import {
  getKPIs,
  getRevenueByDay,
  getTopProducts,
  getDeviceBreakdown,
} from "@/lib/analytics";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days") ?? 30)));

  const [kpis, revenueByDay, topProducts, devices] = await Promise.all([
    getKPIs(ctx.shopId, days),
    getRevenueByDay(ctx.shopId, days),
    getTopProducts(ctx.shopId, days),
    getDeviceBreakdown(ctx.shopId, days),
  ]);

  return NextResponse.json({ kpis, revenueByDay, topProducts, devices });
}

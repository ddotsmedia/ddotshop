import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { requireShop } from "@/lib/session";
import { checkAIQuota, pickModel } from "@/lib/model-router";
import { complete, parseJsonResponse } from "@/lib/claude";

const Result = z.object({ insights: z.array(z.string()).min(1).max(6) });

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan === "STARTER") {
    return NextResponse.json({ insights: null, reason: "upgrade" });
  }

  const cacheKey = `insights:${ctx.shopId}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  if (!refresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ insights: JSON.parse(cached) });
    } catch {
      /* ignore */
    }
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [agg, topItems, repeat] = await Promise.all([
    prisma.order.aggregate({
      where: { shopId: ctx.shopId, status: { not: "CANCELLED" }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { shopId: ctx.shopId, createdAt: { gte: since } } },
      _sum: { lineTotal: true, qty: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.customer.count({ where: { shopId: ctx.shopId, totalOrders: { gt: 1 } } }),
  ]);

  const model = pickModel("insights");
  const quota = await checkAIQuota(ctx.tenantId, ctx.plan, model);
  if (!quota.allowed) {
    return NextResponse.json({ insights: null, reason: "quota" });
  }

  const data = {
    revenue30d: Number(agg._sum.total ?? 0),
    orders30d: agg._count,
    topProducts: topItems.map((t) => ({ name: t.name, revenue: Number(t._sum.lineTotal ?? 0) })),
    repeatCustomers: repeat,
  };

  try {
    const raw = await complete({
      task: "insights",
      model,
      maxTokens: 500,
      shopId: ctx.shopId,
      tenantId: ctx.tenantId,
      system:
        "You are a retail analyst for a UAE WhatsApp commerce shop. Give punchy, actionable insights.",
      prompt: `Last 30 days data: ${JSON.stringify(data)}
Return ONLY JSON: {"insights": ["bullet 1", "bullet 2", ...]} with 4-5 short, specific, actionable bullets.`,
    });
    const parsed = Result.safeParse(parseJsonResponse(raw));
    if (!parsed.success) return NextResponse.json({ insights: null, reason: "error" });
    try {
      await redis.set(cacheKey, JSON.stringify(parsed.data.insights), "EX", 3600);
    } catch {
      /* ignore */
    }
    return NextResponse.json({ insights: parsed.data.insights });
  } catch {
    return NextResponse.json({ insights: null, reason: "error" });
  }
}

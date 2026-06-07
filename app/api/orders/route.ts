import { NextRequest, NextResponse } from "next/server";
import { CreateOrderSchema } from "@/lib/validations";
import { createPendingOrder } from "@/lib/orders";
import { waQueue, JOBS } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const status = sp.get("status");
  const search = sp.get("search");
  const from = sp.get("from");
  const to = sp.get("to");

  const where: Prisma.OrderWhereInput = { shopId: ctx.shopId };
  if (status && status !== "all") where.status = status as Prisma.OrderWhereInput["status"];
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [orders, total, revenue] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { totalRevenue: Number(revenue._sum.total ?? 0) },
  });
}

export async function POST(req: NextRequest) {
  const parsed = CreateOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order" },
      { status: 400 },
    );
  }
  try {
    const order = await createPendingOrder(parsed.data);

    // Referral attribution: credit the referrer if a valid ref cookie is present.
    const refCode = req.cookies.get("ref")?.value;
    if (refCode) {
      const link = await prisma.referralLink.findUnique({ where: { code: refCode } });
      if (link && link.shopId === order.shopId) {
        await prisma.referralLink.update({
          where: { id: link.id },
          data: { conversions: { increment: 1 } },
        });
        const { awardReferralBonus } = await import("@/lib/loyalty");
        await awardReferralBonus(link.customerId, order.shopId).catch(() => {});
      }
    }

    // Queue an abandoned-cart reminder (idempotent; cancelled on payment).
    waQueue
      .add(
        JOBS.ABANDONED_CART,
        {
          orderId: order.id,
          shopId: order.shopId,
          buyerPhone: order.customerPhone,
          cartValue: Number(order.total),
          currency: order.currency,
        },
        { jobId: `cart-${order.id}`, delay: 30 * 60 * 1000, attempts: 1 },
      )
      .catch(() => {});

    return NextResponse.json({ orderId: order.id, total: Number(order.total) }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

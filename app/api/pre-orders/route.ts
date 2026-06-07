import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";

const Body = z.object({
  shopId: z.string(),
  productId: z.string(),
  customerPhone: z.string().min(6),
  customerName: z.string().optional(),
  depositAmount: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  expectedAt: z.coerce.date().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const shop = await prisma.shop.findUnique({ where: { id: d.shopId }, select: { currency: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const pre = await prisma.preOrder.create({
    data: {
      shopId: d.shopId,
      productId: d.productId,
      customerPhone: d.customerPhone,
      customerName: d.customerName,
      depositPaid: d.depositAmount,
      totalPrice: d.totalPrice,
      expectedAt: d.expectedAt,
    },
  });

  const when = d.expectedAt ? d.expectedAt.toISOString().slice(0, 10) : "soon";
  waQueue
    .add(JOBS.GENERIC_WA, {
      phone: d.customerPhone,
      message: `✅ Pre-order confirmed! Deposit ${shop.currency} ${d.depositAmount} received. Expected: ${when}. We'll notify you when ready.`,
    })
    .catch(() => {});

  if (d.expectedAt) {
    const delay = d.expectedAt.getTime() - 24 * 60 * 60 * 1000 - Date.now();
    if (delay > 0) {
      waQueue
        .add(JOBS.PRE_ORDER_REMINDER, { phone: d.customerPhone, message: "Reminder: Your pre-order is expected tomorrow. We'll confirm shipping shortly." }, { delay })
        .catch(() => {});
    }
  }

  return NextResponse.json({ preOrder: pre }, { status: 201 });
}

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const preOrders = await prisma.preOrder.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return NextResponse.json({ preOrders });
}

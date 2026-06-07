import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const Body = z.object({
  shopId: z.string(),
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  productId: z.string(),
  intervalDays: z.number().int().positive().default(30),
  startDate: z.coerce.date().optional(),
});

const PLANS = new Set(["PRO", "AGENCY"]);

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: d.shopId },
    select: { tenant: { select: { plan: true } } },
  });
  if (!shop || !PLANS.has(shop.tenant.plan)) {
    return NextResponse.json({ error: "Subscriptions require the Pro or Agency plan" }, { status: 403 });
  }

  // Resolve customer (by id or phone).
  let customerId = d.customerId;
  if (!customerId && d.customerPhone) {
    const customer = await prisma.customer.upsert({
      where: { shopId_phone: { shopId: d.shopId, phone: d.customerPhone } },
      create: { shopId: d.shopId, phone: d.customerPhone, name: d.customerName },
      update: {},
    });
    customerId = customer.id;
  }
  if (!customerId) return NextResponse.json({ error: "customer required" }, { status: 400 });

  const nextOrderAt = d.startDate ?? new Date(Date.now() + d.intervalDays * 86400000);
  const sub = await prisma.subscription2.create({
    data: { shopId: d.shopId, customerId, productId: d.productId, intervalDays: d.intervalDays, nextOrderAt },
  });
  return NextResponse.json({ subscription: sub }, { status: 201 });
}

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subs = await prisma.subscription2.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { nextOrderAt: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      product: { select: { name: true, price: true } },
    },
  });
  return NextResponse.json({ subscriptions: subs });
}

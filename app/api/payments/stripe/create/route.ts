import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validations";
import { createPendingOrder } from "@/lib/orders";
import { createStripeSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const parsed = CreateOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  const input = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { slug: true, name: true, stripeSecretKey: true },
  });
  const secretKey = shop?.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY;
  if (!shop || !secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  try {
    const order = await createPendingOrder({ ...input, paymentMethod: "STRIPE" });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { sessionUrl, sessionId } = await createStripeSession({
      amount: Number(order.total),
      currency: order.currency,
      orderId: order.id,
      description: `Order at ${shop.name}`,
      successUrl: `${base}/shop/${shop.slug}/order/${order.id}`,
      cancelUrl: `${base}/shop/${shop.slug}/checkout`,
      secretKey,
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: sessionId } });
    return NextResponse.json({ paymentUrl: sessionUrl, orderId: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment init failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

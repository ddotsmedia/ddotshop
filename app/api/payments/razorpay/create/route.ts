import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validations";
import { createPendingOrder } from "@/lib/orders";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const parsed = CreateOrderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  const input = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { name: true, razorpayKeyId: true, razorpaySecret: true },
  });
  if (!shop?.razorpayKeyId || !shop.razorpaySecret) {
    return NextResponse.json({ error: "Razorpay not configured for this shop" }, { status: 400 });
  }

  try {
    const order = await createPendingOrder({ ...input, paymentMethod: "RAZORPAY" });
    const rzp = await createRazorpayOrder({
      amount: Number(order.total),
      currency: order.currency,
      orderId: order.id,
      keyId: shop.razorpayKeyId,
      secret: shop.razorpaySecret,
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: rzp.razorpayOrderId } });
    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: rzp.razorpayOrderId,
      amount: rzp.amount,
      currency: rzp.currency,
      keyId: rzp.keyId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment init failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

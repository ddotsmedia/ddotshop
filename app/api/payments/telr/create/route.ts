import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validations";
import { createPendingOrder } from "@/lib/orders";
import { createTelrOrder } from "@/lib/telr";

export async function POST(req: NextRequest) {
  const parsed = CreateOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  const input = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { slug: true, telrStoreId: true, telrAuthKey: true, name: true },
  });
  if (!shop?.telrStoreId || !shop.telrAuthKey) {
    return NextResponse.json({ error: "Telr not configured for this shop" }, { status: 400 });
  }

  // Recheck stock at payment time.
  for (const item of input.items) {
    const p = await prisma.product.findFirst({
      where: { id: item.productId, shopId: input.shopId },
      select: { stock: true, trackStock: true, name: true },
    });
    if (p?.trackStock && p.stock < item.qty) {
      return NextResponse.json(
        { error: `${p.name} is out of stock` },
        { status: 409 },
      );
    }
  }

  try {
    const order = await createPendingOrder({ ...input, paymentMethod: "TELR" });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { paymentUrl, telrRef } = await createTelrOrder({
      amount: Number(order.total),
      currency: order.currency,
      orderId: order.id,
      description: `Order at ${shop.name}`,
      returnUrl: `${base}/shop/${shop.slug}/order/${order.id}`,
      cancelUrl: `${base}/shop/${shop.slug}/checkout`,
      storeId: shop.telrStoreId,
      authKey: shop.telrAuthKey,
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: telrRef } });
    return NextResponse.json({ paymentUrl, orderId: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment init failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

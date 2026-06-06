import { NextRequest, NextResponse } from "next/server";
import { CreateOrderSchema } from "@/lib/validations";
import { createPendingOrder } from "@/lib/orders";
import { waQueue, JOBS } from "@/lib/queue";

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

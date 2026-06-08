import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { confirmOrderPaid } from "@/lib/fulfill";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";

  if (secret && secret !== "placeholder" && !verifyRazorpayWebhook(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: { orderId?: string } } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    const orderId =
      entity?.notes?.orderId ??
      (entity?.order_id
        ? (await prisma.order.findFirst({ where: { paymentRef: entity.order_id }, select: { id: true } }))?.id
        : undefined);
    if (orderId) {
      await confirmOrderPaid(orderId, entity?.id ?? orderId, "RAZORPAY");
    }
  }

  return NextResponse.json({ ok: true });
}

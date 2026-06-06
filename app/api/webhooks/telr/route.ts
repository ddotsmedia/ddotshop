import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelrHMAC } from "@/lib/telr";
import { confirmOrderPaid } from "@/lib/fulfill";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-telr-signature") ?? "";

  let payload: {
    cartid?: string;
    status?: string;
    tranref?: string;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const orderId = payload.cartid;
  if (!orderId) return NextResponse.json({ error: "missing cartid" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { shop: { select: { telrAuthKey: true } } },
  });
  const authKey = order?.shop.telrAuthKey ?? process.env.TELR_AUTH_KEY ?? "";
  if (!verifyTelrHMAC(raw, signature, authKey)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const status = (payload.status ?? "").toUpperCase();
  if (status === "CAPTURED" || status === "AUTHORISED" || status === "PAID") {
    await confirmOrderPaid(orderId, payload.tranref ?? orderId, "TELR");
  } else if (status === "DECLINED" || status === "CANCELLED") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED", paymentStatus: "FAILED" } }).catch(() => {});
  }

  // Always 200 so Telr stops retrying.
  return NextResponse.json({ ok: true });
}

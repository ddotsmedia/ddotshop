import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { createShipment, trackShipment } from "@/lib/shiprocket";

const Body = z.object({ orderId: z.string() });

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const [order, shop] = await Promise.all([
    prisma.order.findFirst({ where: { id: parsed.data.orderId, shopId: ctx.shopId }, include: { items: true } }),
    prisma.shop.findUnique({ where: { id: ctx.shopId }, select: { shiprocketToken: true } }),
  ]);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!shop?.shiprocketToken) return NextResponse.json({ error: "Shiprocket not connected" }, { status: 400 });

  try {
    const ship = await createShipment(shop.shiprocketToken, {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      total: Number(order.total),
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: Number(i.unitPrice) })),
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { awb: ship.awb, shipmentId: ship.shipmentId, courier: ship.courier, status: "SHIPPED" },
    });
    return NextResponse.json({ awb: ship.awb, courier: ship.courier });
  } catch {
    return NextResponse.json({ error: "Shipment creation failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const awb = req.nextUrl.searchParams.get("awb");
  if (!awb) return NextResponse.json({ error: "awb required" }, { status: 400 });
  const shop = await prisma.shop.findUnique({ where: { id: ctx.shopId }, select: { shiprocketToken: true } });
  if (!shop?.shiprocketToken) return NextResponse.json({ error: "Shiprocket not connected" }, { status: 400 });
  try {
    const tracking = await trackShipment(shop.shiprocketToken, awb);
    return NextResponse.json(tracking);
  } catch {
    return NextResponse.json({ error: "Tracking failed" }, { status: 502 });
  }
}

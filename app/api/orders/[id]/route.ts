import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: { items: true, customer: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

const PatchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.order.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true, customerPhone: true, shop: { select: { name: true, whatsappNumber: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  // Notify customer of status change via WhatsApp.
  if (existing.customerPhone) {
    waQueue
      .add(JOBS.LOW_STOCK, {
        sellerPhone: existing.customerPhone,
        message: `Update on your order #${order.id.slice(-6).toUpperCase()} from ${existing.shop.name}: status is now ${parsed.data.status}.`,
      })
      .catch(() => {});
  }

  return NextResponse.json({ order });
}

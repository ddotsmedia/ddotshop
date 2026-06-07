import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const shop = await prisma.shop.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ activity: [] });

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, paymentStatus: "PAID" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { customerName: true, createdAt: true, items: { select: { name: true }, take: 1 } },
  });

  const now = Date.now();
  const activity = orders.map((o) => ({
    firstName: o.customerName?.split(" ")[0] || "Someone",
    productName: o.items[0]?.name ?? "an item",
    minutesAgo: Math.max(1, Math.floor((now - o.createdAt.getTime()) / 60000)),
  }));
  return NextResponse.json({ activity });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  shopId: z.string(),
  productId: z.string(),
  customerPhone: z.string().min(6),
  notifyOnDrop: z.boolean().optional(),
  notifyOnStock: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const d = parsed.data;
  const item = await prisma.wishlist.upsert({
    where: { shopId_customerPhone_productId: { shopId: d.shopId, customerPhone: d.customerPhone, productId: d.productId } },
    create: { shopId: d.shopId, productId: d.productId, customerPhone: d.customerPhone, notifyOnDrop: d.notifyOnDrop ?? false, notifyOnStock: d.notifyOnStock ?? true },
    update: { notifyOnDrop: d.notifyOnDrop, notifyOnStock: d.notifyOnStock },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shopId = sp.get("shopId");
  const productId = sp.get("productId");
  const customerPhone = sp.get("customerPhone");
  if (!shopId || !productId || !customerPhone) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  await prisma.wishlist
    .delete({ where: { shopId_customerPhone_productId: { shopId, customerPhone, productId } } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shopId = sp.get("shopId");
  const customerPhone = sp.get("customerPhone");
  if (!shopId || !customerPhone) return NextResponse.json({ items: [] });
  const items = await prisma.wishlist.findMany({
    where: { shopId, customerPhone },
    include: { product: { select: { id: true, name: true, price: true, images: true } } },
  });
  return NextResponse.json({ items, productIds: items.map((i) => i.productId) });
}

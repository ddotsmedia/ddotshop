import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const Body = z.object({
  shopId: z.string(),
  productId: z.string(),
  customerPhone: z.string().min(6),
  customerName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const d = parsed.data;
  const item = await prisma.waitlist.upsert({
    where: { shopId_productId_customerPhone: { shopId: d.shopId, productId: d.productId, customerPhone: d.customerPhone } },
    create: { shopId: d.shopId, productId: d.productId, customerPhone: d.customerPhone, customerName: d.customerName },
    update: {},
  });
  return NextResponse.json({ item });
}

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const productId = req.nextUrl.searchParams.get("productId") ?? undefined;
  const items = await prisma.waitlist.findMany({
    where: { shopId: ctx.shopId, productId },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

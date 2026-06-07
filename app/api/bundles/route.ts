import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bundles = await prisma.productBundle.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true, price: true, images: true } } } } },
  });
  return NextResponse.json({ bundles });
}

const Body = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  bundlePrice: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(1),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const d = parsed.data;
  const bundle = await prisma.productBundle.create({
    data: {
      shopId: ctx.shopId,
      name: d.name,
      description: d.description,
      bundlePrice: d.bundlePrice,
      imageUrl: d.imageUrl,
      isActive: d.isActive,
      items: { create: d.items.map((i) => ({ productId: i.productId, qty: i.qty })) },
    },
  });
  return NextResponse.json({ bundle }, { status: 201 });
}

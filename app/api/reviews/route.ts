import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Dashboard listing (all reviews for the authenticated shop).
  if (sp.get("mine")) {
    let ctx;
    try {
      ctx = await requireShop();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = sp.get("status"); // approved | pending | all
    const where: { shopId: string; approved?: boolean } = { shopId: ctx.shopId };
    if (status === "approved") where.approved = true;
    if (status === "pending") where.approved = false;
    const reviews = await prisma.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { name: true } },
        product: { select: { name: true, images: true } },
      },
    });
    const avgAgg = await prisma.productReview.aggregate({
      where: { shopId: ctx.shopId, approved: true },
      _avg: { rating: true },
      _count: true,
    });
    return NextResponse.json({
      reviews,
      avg: avgAgg._avg.rating ? Math.round(avgAgg._avg.rating * 10) / 10 : 0,
      count: avgAgg._count,
    });
  }

  const productId = sp.get("productId");
  const shopId = sp.get("shopId");
  if (!productId || !shopId) {
    return NextResponse.json({ error: "productId and shopId required" }, { status: 400 });
  }
  const [reviews, agg] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId, shopId, approved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: { select: { name: true } } },
    }),
    prisma.productReview.aggregate({
      where: { productId, shopId, approved: true },
      _avg: { rating: true },
      _count: true,
    }),
  ]);
  return NextResponse.json({
    reviews,
    avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
    count: agg._count,
  });
}

const Body = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const review = await prisma.productReview.create({
    data: {
      shopId: ctx.shopId,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      body: parsed.data.body,
      source: "manual",
      approved: true,
    },
  });
  return NextResponse.json({ review }, { status: 201 });
}

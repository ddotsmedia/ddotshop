import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { CreateProductSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const category = sp.get("category");
  const search = sp.get("search");
  const published = sp.get("published");

  const where: Prisma.ProductWhereInput = { shopId: ctx.shopId };
  if (category) where.categoryId = category;
  if (published === "true") where.isPublished = true;
  if (published === "false") where.isPublished = false;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { name: true } }, variants: true },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = CreateProductSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Verify category belongs to this shop.
  if (d.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: d.categoryId, shopId: ctx.shopId },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      shopId: ctx.shopId,
      name: d.name,
      nameAr: d.nameAr,
      description: d.description,
      descriptionAr: d.descriptionAr,
      price: d.price,
      comparePrice: d.comparePrice,
      images: d.images,
      stock: d.stock,
      trackStock: d.trackStock,
      lowStockThreshold: d.lowStockThreshold,
      categoryId: d.categoryId,
      isFeatured: d.isFeatured,
      isPublished: d.isPublished,
      isPreOrder: d.isPreOrder,
      preOrderDeposit: d.preOrderDeposit,
      allowSubscription: d.allowSubscription,
      variants: { create: d.variants.map((v) => ({ name: v.name, values: v.values })) },
    },
    include: { variants: true },
  });

  return NextResponse.json({ product }, { status: 201 });
}

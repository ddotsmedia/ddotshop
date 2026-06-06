import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { CreateCategorySchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await prisma.category.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = CreateCategorySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const category = await prisma.category.create({
    data: {
      shopId: ctx.shopId,
      name: parsed.data.name,
      nameAr: parsed.data.nameAr,
      imageUrl: parsed.data.imageUrl,
      sortOrder: parsed.data.sortOrder,
      slug: generateSlug(parsed.data.name),
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}

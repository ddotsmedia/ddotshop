import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { UpdateProductSchema } from "@/lib/validations";
import { deleteFromR2, } from "@/lib/r2";
import { extractR2Key } from "@/lib/utils";

async function owned(id: string, shopId: string) {
  return prisma.product.findFirst({ where: { id, shopId } });
}

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
  const product = await prisma.product.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: { variants: true, category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await owned(params.id, ctx.shopId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = UpdateProductSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { variants, ...rest } = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    if (variants) {
      await tx.productVariant.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.createMany({
        data: variants.map((v) => ({ productId: params.id, name: v.name, values: v.values })),
      });
    }
    return tx.product.update({
      where: { id: params.id },
      data: rest,
      include: { variants: true },
    });
  });

  return NextResponse.json({ product });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await owned(params.id, ctx.shopId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Best-effort cleanup of R2 images.
  await Promise.all(
    existing.images.map((url) => deleteFromR2(extractR2Key(url)).catch(() => {})),
  );
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

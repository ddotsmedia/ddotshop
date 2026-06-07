import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

async function owned(id: string, shopId: string) {
  return prisma.flashSale.findFirst({ where: { id, shopId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sale = await prisma.flashSale.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: { products: { include: { product: { select: { name: true, price: true } } } } },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ sale });
}

const Body = z.object({
  name: z.string().min(1).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  products: z.array(z.object({ productId: z.string(), salePrice: z.number().nonnegative() })).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await owned(params.id, ctx.shopId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { products, ...rest } = parsed.data;

  const sale = await prisma.$transaction(async (tx) => {
    if (products) {
      await tx.flashSaleProduct.deleteMany({ where: { flashSaleId: params.id } });
      await tx.flashSaleProduct.createMany({
        data: products.map((p) => ({ flashSaleId: params.id, productId: p.productId, salePrice: p.salePrice })),
      });
    }
    return tx.flashSale.update({ where: { id: params.id }, data: rest });
  });
  return NextResponse.json({ sale });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await owned(params.id, ctx.shopId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.flashSale.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

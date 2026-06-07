import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

async function owned(id: string, shopId: string) {
  return prisma.productBundle.findFirst({ where: { id, shopId } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bundle = await prisma.productBundle.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: { items: true },
  });
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bundle });
}

const Body = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  bundlePrice: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).optional(),
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
  const { items, ...rest } = parsed.data;

  const bundle = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.bundleItem.deleteMany({ where: { bundleId: params.id } });
      await tx.bundleItem.createMany({ data: items.map((i) => ({ bundleId: params.id, productId: i.productId, qty: i.qty })) });
    }
    return tx.productBundle.update({ where: { id: params.id }, data: rest });
  });
  return NextResponse.json({ bundle });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await owned(params.id, ctx.shopId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.productBundle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

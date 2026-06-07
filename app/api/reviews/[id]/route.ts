import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const Patch = z.object({ approved: z.boolean() }).strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.productReview.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const review = await prisma.productReview.update({
    where: { id: params.id },
    data: { approved: parsed.data.approved },
  });
  return NextResponse.json({ review });
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
  const existing = await prisma.productReview.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.productReview.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

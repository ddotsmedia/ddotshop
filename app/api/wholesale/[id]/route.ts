export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const PatchSchema = z
  .object({
    isApproved: z.boolean().optional(),
    discountPct: z.number().min(0).max(100).optional(),
  })
  .strict()
  .refine((d) => d.isApproved !== undefined || d.discountPct !== undefined, {
    message: "Provide at least isApproved or discountPct",
  });

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

  const existing = await prisma.wholesaleCustomer.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const customer = await prisma.wholesaleCustomer.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.isApproved !== undefined && { isApproved: parsed.data.isApproved }),
      ...(parsed.data.discountPct !== undefined && { discountPct: parsed.data.discountPct }),
    },
  });

  return NextResponse.json({ customer });
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

  const existing = await prisma.wholesaleCustomer.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.wholesaleCustomer.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
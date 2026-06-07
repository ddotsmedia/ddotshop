import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const Patch = z
  .object({
    isActive: z.boolean().optional(),
    intervalDays: z.number().int().positive().optional(),
    nextOrderAt: z.coerce.date().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.subscription2.findFirst({ where: { id: params.id, shopId: ctx.shopId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const sub = await prisma.subscription2.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ subscription: sub });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.subscription2.findFirst({ where: { id: params.id, shopId: ctx.shopId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.subscription2.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

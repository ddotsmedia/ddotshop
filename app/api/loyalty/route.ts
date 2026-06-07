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
  const program =
    (await prisma.loyaltyProgram.findUnique({ where: { shopId: ctx.shopId } })) ??
    (await prisma.loyaltyProgram.create({ data: { shopId: ctx.shopId } }));
  return NextResponse.json({ program });
}

const Patch = z
  .object({
    pointsPerAED: z.number().int().min(0).max(100).optional(),
    rewardThreshold: z.number().int().min(1).max(100000).optional(),
    rewardValue: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const program = await prisma.loyaltyProgram.upsert({
    where: { shopId: ctx.shopId },
    create: { shopId: ctx.shopId, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ program });
}

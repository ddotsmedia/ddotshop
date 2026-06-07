import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

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
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: { orders: { orderBy: { createdAt: "desc" } }, points: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { customerId: params.id, shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ customer, transactions });
}

const PatchSchema = z
  .object({
    tags: z.array(z.string()).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

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
  const existing = await prisma.customer.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ customer });
}

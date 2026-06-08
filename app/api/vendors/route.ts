export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const CreateVendorSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(4).max(30).optional(),
  commissionPct: z.number().min(0).max(100),
  payoutAccount: z.string().max(200).optional(),
});

export async function GET(_req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan !== "AGENCY") {
    return NextResponse.json({ error: "Upgrade to Agency plan" }, { status: 403 });
  }

  const vendors = await prisma.vendor.findMany({
    where: { shopId: ctx.shopId },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan !== "AGENCY") {
    return NextResponse.json({ error: "Upgrade to Agency plan" }, { status: 403 });
  }

  const parsed = CreateVendorSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const vendor = await prisma.vendor.create({
    data: {
      shopId: ctx.shopId,
      name: d.name,
      email: d.email,
      phone: d.phone,
      commissionPct: d.commissionPct,
      payoutAccount: d.payoutAccount,
    },
  });

  return NextResponse.json({ vendor }, { status: 201 });
}
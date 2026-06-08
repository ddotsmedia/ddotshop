export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const UpdateVendorSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(4).max(30).optional().nullable(),
  commissionPct: z.number().min(0).max(100).optional(),
  payoutAccount: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan !== "AGENCY") {
    return NextResponse.json({ error: "Upgrade to Agency plan" }, { status: 403 });
  }

  const { id } = await params;

  const vendor = await prisma.vendor.findFirst({
    where: { id, shopId: ctx.shopId },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          isPublished: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan !== "AGENCY") {
    return NextResponse.json({ error: "Upgrade to Agency plan" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.vendor.findFirst({
    where: { id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const parsed = UpdateVendorSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.email !== undefined && { email: d.email }),
      ...(d.phone !== undefined && { phone: d.phone }),
      ...(d.commissionPct !== undefined && { commissionPct: d.commissionPct }),
      ...(d.payoutAccount !== undefined && { payoutAccount: d.payoutAccount }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
  });

  return NextResponse.json({ vendor });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.plan !== "AGENCY") {
    return NextResponse.json({ error: "Upgrade to Agency plan" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.vendor.findFirst({
    where: { id, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Products with this vendorId will have vendorId set to null via onDelete: SetNull in schema
  await prisma.vendor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
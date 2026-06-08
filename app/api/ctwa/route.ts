export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  utmSource: z.string().min(1).max(100),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  spend: z.number().nonnegative().optional(),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  spend: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

// ─── GET /api/ctwa ───────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.cTWACampaign.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
  });

  const data = campaigns.map((c) => {
    const revenue = Number(c.revenue);
    const spend = Number(c.spend);
    const roi = spend > 0 ? revenue / spend : null;
    return {
      id: c.id,
      name: c.name,
      utmSource: c.utmSource,
      utmMedium: c.utmMedium,
      utmCampaign: c.utmCampaign,
      clicks: c.clicks,
      orders: c.orders,
      revenue,
      spend,
      roi,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });

  return NextResponse.json({ campaigns: data });
}

// ─── POST /api/ctwa ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Upsert by [shopId, utmSource]
  const campaign = await prisma.cTWACampaign.upsert({
    where: { shopId_utmSource: { shopId: ctx.shopId, utmSource: d.utmSource } },
    update: {
      name: d.name,
      utmMedium: d.utmMedium,
      utmCampaign: d.utmCampaign,
      ...(d.spend !== undefined ? { spend: d.spend } : {}),
    },
    create: {
      shopId: ctx.shopId,
      name: d.name,
      utmSource: d.utmSource,
      utmMedium: d.utmMedium,
      utmCampaign: d.utmCampaign,
      spend: d.spend ?? 0,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

// ─── PATCH /api/ctwa ─────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { id, ...fields } = parsed.data;

  // Ownership check
  const existing = await prisma.cTWACampaign.findUnique({ where: { id } });
  if (!existing || existing.shopId !== ctx.shopId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const campaign = await prisma.cTWACampaign.update({
    where: { id },
    data: {
      ...(fields.name !== undefined ? { name: fields.name } : {}),
      ...(fields.utmMedium !== undefined ? { utmMedium: fields.utmMedium } : {}),
      ...(fields.utmCampaign !== undefined ? { utmCampaign: fields.utmCampaign } : {}),
      ...(fields.spend !== undefined ? { spend: fields.spend } : {}),
      ...(fields.isActive !== undefined ? { isActive: fields.isActive } : {}),
    },
  });

  return NextResponse.json({ campaign });
}
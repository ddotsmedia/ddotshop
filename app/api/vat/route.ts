import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { isTRNValid } from "@/lib/vat";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config =
    (await prisma.vATConfig.findUnique({ where: { shopId: ctx.shopId } })) ??
    (await prisma.vATConfig.create({ data: { shopId: ctx.shopId } }));
  return NextResponse.json({ config });
}

const Body = z.object({
  enabled: z.boolean(),
  rate: z.number().min(0).max(100).default(5),
  vatNumber: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  if (d.vatNumber && !isTRNValid(d.vatNumber)) {
    return NextResponse.json({ error: "TRN must be 15 digits" }, { status: 400 });
  }
  const config = await prisma.vATConfig.upsert({
    where: { shopId: ctx.shopId },
    create: { shopId: ctx.shopId, enabled: d.enabled, rate: d.rate, vatNumber: d.vatNumber },
    update: { enabled: d.enabled, rate: d.rate, vatNumber: d.vatNumber },
  });
  return NextResponse.json({ config });
}

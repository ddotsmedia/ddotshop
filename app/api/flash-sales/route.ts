import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sales = await prisma.flashSale.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { startsAt: "desc" },
    include: { products: true, _count: { select: { products: true } } },
  });
  return NextResponse.json({ sales });
}

const Body = z.object({
  name: z.string().min(1).max(80),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  products: z.array(z.object({ productId: z.string(), salePrice: z.number().nonnegative() })).min(1),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const d = parsed.data;
  const now = new Date();
  const active = d.startsAt <= now && d.endsAt >= now;

  const sale = await prisma.flashSale.create({
    data: {
      shopId: ctx.shopId,
      name: d.name,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      isActive: active,
      products: { create: d.products.map((p) => ({ productId: p.productId, salePrice: p.salePrice })) },
    },
  });

  // Schedule start/end transitions.
  const startDelay = d.startsAt.getTime() - now.getTime();
  const endDelay = d.endsAt.getTime() - now.getTime();
  if (startDelay > 0) {
    waQueue.add(JOBS.FLASH_SALE_START, { flashSaleId: sale.id }, { delay: startDelay }).catch(() => {});
  }
  if (endDelay > 0) {
    waQueue.add(JOBS.FLASH_SALE_END, { flashSaleId: sale.id }, { delay: endDelay }).catch(() => {});
  }

  return NextResponse.json({ sale }, { status: 201 });
}

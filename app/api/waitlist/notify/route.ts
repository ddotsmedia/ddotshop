import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireShop } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkBackInStock } from "@/lib/alert-engine";

const Body = z.object({ productId: z.string() });

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, shopId: ctx.shopId },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await checkBackInStock(product.id);
  return NextResponse.json({ ok: true });
}

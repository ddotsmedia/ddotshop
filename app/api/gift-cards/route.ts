import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { createGiftCard } from "@/lib/gift-card";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cards = await prisma.giftCard.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cards });
}

const Body = z.object({
  value: z.number().positive(),
  recipientName: z.string().max(80).optional(),
  recipientEmail: z.string().email().optional(),
  message: z.string().max(300).optional(),
  purchasedBy: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.plan === "STARTER") {
    return NextResponse.json({ error: "Gift cards require the Growth plan or higher" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const giftCard = await createGiftCard({ shopId: ctx.shopId, ...parsed.data });
  return NextResponse.json({ giftCard, code: giftCard.code }, { status: 201 });
}

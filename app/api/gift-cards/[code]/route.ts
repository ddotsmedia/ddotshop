import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });
  const gc = await prisma.giftCard.findFirst({
    where: { code: params.code.toUpperCase(), shopId },
    select: { balance: true, currency: true, isActive: true, expiresAt: true },
  });
  if (!gc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    balance: Number(gc.balance),
    currency: gc.currency,
    isActive: gc.isActive && (!gc.expiresAt || gc.expiresAt > new Date()),
  });
}

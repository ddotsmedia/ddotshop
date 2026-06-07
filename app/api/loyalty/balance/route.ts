import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const [cp, program] = await Promise.all([
    prisma.customerPoints.findFirst({ where: { customerId, shopId: ctx.shopId } }),
    prisma.loyaltyProgram.findUnique({ where: { shopId: ctx.shopId } }),
  ]);

  const points = cp?.points ?? 0;
  const threshold = program?.rewardThreshold ?? 200;
  return NextResponse.json({
    points,
    lifetime: cp?.lifetime ?? 0,
    rewardThreshold: threshold,
    pointsToNextReward: Math.max(0, threshold - points),
  });
}

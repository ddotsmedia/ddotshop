import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";
import type { Prisma } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const broadcast = await prisma.broadcast.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
  });
  if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (broadcast.status === "SENDING" || broadcast.status === "SENT") {
    return NextResponse.json({ error: "Already sent" }, { status: 409 });
  }

  const where: Prisma.CustomerWhereInput = { shopId: ctx.shopId };
  if (broadcast.targetTags.length > 0) where.tags = { hasSome: broadcast.targetTags };

  const customers = await prisma.customer.findMany({ where, select: { phone: true } });
  if (customers.length === 0) {
    return NextResponse.json({ error: "No customers to send to" }, { status: 400 });
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { status: "SENDING", targetCount: customers.length, sentCount: 0, failedCount: 0 },
  });

  // 1.1s gap between sends keeps us under Twilio rate limits.
  await Promise.all(
    customers.map((c, i) =>
      waQueue.add(
        JOBS.BROADCAST,
        { phone: c.phone, message: broadcast.message, broadcastId: broadcast.id },
        { delay: i * 1100, attempts: 2 },
      ),
    ),
  );

  // Mark SENT once all jobs are queued (worker increments counters as they run).
  await prisma.broadcast.update({ where: { id: broadcast.id }, data: { status: "SENT", sentAt: new Date() } });

  return NextResponse.json({ queued: customers.length });
}

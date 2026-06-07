import { prisma } from "@/lib/prisma";
import { waQueue, JOBS } from "@/lib/queue";

async function getOrCreateProgram(shopId: string) {
  const existing = await prisma.loyaltyProgram.findUnique({ where: { shopId } });
  if (existing) return existing;
  return prisma.loyaltyProgram.create({ data: { shopId } });
}

/** Award points for a paid order. Idempotent-ish per order via the EARN transaction note. */
export async function awardPoints(
  customerId: string,
  shopId: string,
  orderId: string,
  orderTotal: number,
): Promise<void> {
  const program = await getOrCreateProgram(shopId);
  if (!program.isActive) return;

  const points = Math.floor(orderTotal * program.pointsPerAED);
  if (points <= 0) return;

  const balance = await prisma.customerPoints.upsert({
    where: { customerId },
    create: { customerId, shopId, points, lifetime: points },
    update: { points: { increment: points }, lifetime: { increment: points } },
  });
  await prisma.loyaltyTransaction.create({
    data: { customerId, shopId, points, type: "EARN", orderId, note: `Order ${orderId.slice(-6)}` },
  });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { phone: true, name: true },
  });
  if (!customer) return;

  if (balance.points >= program.rewardThreshold) {
    waQueue
      .add(JOBS.LOYALTY_NOTIFICATION, {
        phone: customer.phone,
        message: `🎉 You earned ${points} points and now have ${balance.points}! That's a ${program.rewardValue} AED reward ready to redeem.`,
      })
      .catch(() => {});
  } else {
    const toGo = program.rewardThreshold - balance.points;
    waQueue
      .add(JOBS.LOYALTY_NOTIFICATION, {
        phone: customer.phone,
        message: `⭐ +${points} points! ${toGo} more to unlock your ${program.rewardValue} AED reward.`,
      })
      .catch(() => {});
  }
}

/** Redeem points → returns AED value redeemed. */
export async function redeemPoints(
  customerId: string,
  shopId: string,
  points: number,
): Promise<number> {
  const program = await getOrCreateProgram(shopId);
  const cp = await prisma.customerPoints.findUnique({ where: { customerId } });
  if (!cp || cp.points < points || points <= 0) return 0;

  const aedPerPoint = Number(program.rewardValue) / program.rewardThreshold;
  const value = Math.round(points * aedPerPoint * 100) / 100;

  await prisma.customerPoints.update({
    where: { customerId },
    data: { points: { decrement: points } },
  });
  await prisma.loyaltyTransaction.create({
    data: { customerId, shopId, points: -points, type: "REDEEM", note: `Redeemed ${value} AED` },
  });
  return value;
}

export async function getPointsBalance(customerId: string): Promise<number> {
  const cp = await prisma.customerPoints.findUnique({ where: { customerId } });
  return cp?.points ?? 0;
}

/** Award a flat referral bonus to a customer. */
export async function awardReferralBonus(
  customerId: string,
  shopId: string,
  bonus = 50,
): Promise<void> {
  await prisma.customerPoints.upsert({
    where: { customerId },
    create: { customerId, shopId, points: bonus, lifetime: bonus },
    update: { points: { increment: bonus }, lifetime: { increment: bonus } },
  });
  await prisma.loyaltyTransaction.create({
    data: { customerId, shopId, points: bonus, type: "REFERRAL", note: "Referral bonus" },
  });
}

import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const code10 = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export function generateGiftCardCode(): string {
  return `GC-${code10()}`;
}

export interface GiftCardValidation {
  valid: boolean;
  balance?: number;
  giftCardId?: string;
  reason?: string;
}

export async function validateGiftCard(
  code: string,
  shopId: string,
  amount: number,
): Promise<GiftCardValidation> {
  const gc = await prisma.giftCard.findFirst({
    where: { code: code.trim().toUpperCase(), shopId },
  });
  if (!gc) return { valid: false, reason: "not_found" };
  if (!gc.isActive) return { valid: false, reason: "inactive" };
  if (gc.expiresAt && gc.expiresAt < new Date()) return { valid: false, reason: "expired" };
  if (Number(gc.balance) <= 0) return { valid: false, reason: "empty" };
  return {
    valid: true,
    balance: Number(gc.balance),
    giftCardId: gc.id,
    // The applicable amount is min(balance, amount); caller computes.
    reason: amount > Number(gc.balance) ? "partial" : undefined,
  };
}

export async function redeemGiftCard(giftCardId: string, amount: number): Promise<void> {
  const gc = await prisma.giftCard.findUnique({ where: { id: giftCardId } });
  if (!gc) return;
  const newBalance = Math.max(0, Number(gc.balance) - amount);
  await prisma.giftCard.update({
    where: { id: giftCardId },
    data: { balance: newBalance, isActive: newBalance > 0 },
  });
}

export async function createGiftCard(params: {
  shopId: string;
  value: number;
  currency?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  purchasedBy?: string;
}) {
  return prisma.giftCard.create({
    data: {
      shopId: params.shopId,
      code: generateGiftCardCode(),
      initialValue: params.value,
      balance: params.value,
      currency: params.currency ?? "AED",
      recipientName: params.recipientName,
      recipientEmail: params.recipientEmail,
      message: params.message,
      purchasedBy: params.purchasedBy,
    },
  });
}

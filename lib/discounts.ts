import { prisma } from "@/lib/prisma";

export interface DiscountResult {
  valid: boolean;
  discountAmount: number;
  type?: "PERCENT" | "FIXED";
  code?: string;
  reason?: string;
}

/** Validate a discount code for a shop against an order subtotal. */
export async function evaluateDiscount(
  shopId: string,
  rawCode: string,
  orderTotal: number,
): Promise<DiscountResult> {
  const code = rawCode.trim().toUpperCase();
  const dc = await prisma.discountCode.findFirst({
    where: { shopId, code: { equals: code, mode: "insensitive" } },
  });
  if (!dc) return { valid: false, discountAmount: 0, reason: "not_found" };
  if (!dc.isActive) return { valid: false, discountAmount: 0, reason: "inactive" };
  if (dc.expiresAt && dc.expiresAt < new Date())
    return { valid: false, discountAmount: 0, reason: "expired" };
  if (dc.maxUses && dc.usedCount >= dc.maxUses)
    return { valid: false, discountAmount: 0, reason: "max_uses" };
  if (orderTotal < Number(dc.minOrder))
    return { valid: false, discountAmount: 0, reason: "min_order" };

  const value = Number(dc.value);
  const discountAmount =
    dc.type === "PERCENT"
      ? Math.round(((orderTotal * value) / 100) * 100) / 100
      : Math.min(value, orderTotal);

  return { valid: true, discountAmount, type: dc.type, code: dc.code };
}

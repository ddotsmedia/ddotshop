import { prisma } from "@/lib/prisma";

export interface DiscountResult {
  valid: boolean;
  discountAmount: number;
  type?: "PERCENT" | "FIXED" | "BOGO";
  code?: string;
  reason?: string;
  description?: string;
}

export interface CartLineLite {
  price: number;
  qty: number;
}

/** Validate a discount code for a shop against an order subtotal (and cart for BOGO). */
export async function evaluateDiscount(
  shopId: string,
  rawCode: string,
  orderTotal: number,
  items?: CartLineLite[],
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

  if (dc.type === "BOGO") {
    // Buy one, get the cheapest qualifying unit free.
    const unitPrices = (items ?? []).flatMap((i) => Array(i.qty).fill(i.price) as number[]);
    if (unitPrices.length < 2) {
      return { valid: false, discountAmount: 0, reason: "needs_two_items" };
    }
    const cheapest = Math.min(...unitPrices);
    return {
      valid: true,
      discountAmount: Math.round(cheapest * 100) / 100,
      type: "BOGO",
      code: dc.code,
      description: "Buy X Get Y Free",
    };
  }

  const discountAmount =
    dc.type === "PERCENT"
      ? Math.round(((orderTotal * value) / 100) * 100) / 100
      : Math.min(value, orderTotal);

  return { valid: true, discountAmount, type: dc.type, code: dc.code };
}

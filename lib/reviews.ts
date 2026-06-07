import { prisma } from "@/lib/prisma";
import { waQueue, JOBS } from "@/lib/queue";
import { cleanPhone, findShopByWaNumber, type InboundParams } from "@/lib/wa-inbound";

/** Parse a 1–5 rating from a WhatsApp reply (digits, stars, EN/AR words). */
export function parseStars(body: string): number | null {
  const t = body.trim().toLowerCase();
  const stars = (t.match(/⭐/g) ?? []).length;
  if (stars >= 1 && stars <= 5) return stars;
  const digit = t.match(/\b([1-5])\b/);
  if (digit) return Number(digit[1]);
  const words: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    واحد: 1, اثنان: 2, ثلاثة: 3, أربعة: 4, خمسة: 5,
  };
  for (const [w, n] of Object.entries(words)) if (t.includes(w)) return n;
  return null;
}

/**
 * Handle a review reply to a post-delivery request.
 * Returns a reply string, or null if no pending review applies.
 */
export async function handleReviewReply(params: InboundParams): Promise<string | null> {
  const shop = await findShopByWaNumber(params.To);
  if (!shop) return null;
  const phone = cleanPhone(params.From);
  const body = params.Body ?? "";

  const order = await prisma.order.findFirst({
    where: { shopId: shop.id, customerPhone: phone, status: "DELIVERED", reviewRequested: true },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 1 }, customer: { select: { id: true } } },
  });
  if (!order) return null;

  const productId = order.items[0]?.productId;
  if (!productId) return null;

  // Avoid duplicate reviews for this product by this customer.
  const existing = await prisma.productReview.findFirst({
    where: { productId, customerId: order.customer?.id ?? undefined, shopId: shop.id },
  });
  if (existing) return null;

  const rating = parseStars(body);
  if (rating === null) return null;

  await prisma.productReview.create({
    data: {
      shopId: shop.id,
      productId,
      customerId: order.customer?.id ?? null,
      rating,
      body: body.length > 3 ? body : null,
      source: "whatsapp",
      approved: rating >= 4,
    },
  });

  if (rating >= 4) {
    // Reward + thank.
    if (order.customer?.id) {
      await prisma.customerPoints
        .upsert({
          where: { customerId: order.customer.id },
          create: { customerId: order.customer.id, shopId: shop.id, points: 50, lifetime: 50 },
          update: { points: { increment: 50 }, lifetime: { increment: 50 } },
        })
        .catch(() => {});
      await prisma.loyaltyTransaction
        .create({ data: { customerId: order.customer.id, shopId: shop.id, points: 50, type: "REVIEW", note: "Review bonus" } })
        .catch(() => {});
    }
    return "🎉 Thank you for the ⭐ review! You earned 50 bonus points.";
  }

  // Unhappy path → alert seller.
  waQueue
    .add(JOBS.LOW_STOCK, {
      sellerPhone: shop.whatsappNumber,
      message: `⚠️ Low rating (${rating}★) for order #${order.id.slice(-6).toUpperCase()}. Customer: ${phone}. ${body}`,
    })
    .catch(() => {});
  return "Thank you for your feedback. We're sorry it wasn't perfect — the shop will reach out.";
}

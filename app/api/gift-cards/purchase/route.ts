import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createGiftCard } from "@/lib/gift-card";
import { waQueue, JOBS } from "@/lib/queue";

// Public gift-card purchase. NOTE: for localhost this issues the card immediately.
// Production should gate issuance behind a successful Telr/Stripe payment.
const Body = z.object({
  shopId: z.string(),
  value: z.number().positive(),
  recipientName: z.string().max(80).optional(),
  recipientEmail: z.string().email().optional(),
  message: z.string().max(300).optional(),
  buyerName: z.string().max(80).optional(),
  buyerPhone: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: d.shopId },
    select: { name: true, currency: true, isPublished: true },
  });
  if (!shop?.isPublished) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const gc = await createGiftCard({
    shopId: d.shopId,
    value: d.value,
    currency: shop.currency,
    recipientName: d.recipientName,
    recipientEmail: d.recipientEmail,
    message: d.message,
    purchasedBy: d.buyerName,
  });

  if (d.buyerPhone) {
    waQueue
      .add(JOBS.GENERIC_WA, {
        phone: d.buyerPhone,
        message: `🎁 Your gift card for ${shop.name} is ready! Code: ${gc.code} Value: ${shop.currency} ${d.value}.${d.recipientName ? ` Share with ${d.recipientName}.` : ""}`,
      })
      .catch(() => {});
  }

  return NextResponse.json({ code: gc.code, value: d.value, currency: shop.currency }, { status: 201 });
}

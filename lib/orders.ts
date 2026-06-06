import { prisma } from "@/lib/prisma";
import { evaluateDiscount } from "@/lib/discounts";
import type { CartItem } from "@/lib/validations";

export interface CreateOrderInput {
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  items: CartItem[];
  discountCode?: string;
  paymentMethod?: "TELR" | "STRIPE" | "UPI" | "COD" | "WHATSAPP";
}

/**
 * Create a PENDING order, pricing every line from the DB (never trust client prices).
 * Returns the order with items. Stock is NOT decremented here — that happens on payment.
 */
export async function createPendingOrder(input: CreateOrderInput) {
  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { id: true, currency: true, isPublished: true },
  });
  if (!shop || !shop.isPublished) throw new Error("Shop not found");

  const ids = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, shopId: shop.id, isPublished: true },
    select: { id: true, name: true, price: true, images: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items
    .map((i) => {
      const p = byId.get(i.productId);
      if (!p) return null;
      const unitPrice = Number(p.price);
      return {
        productId: p.id,
        name: p.name,
        variant: i.variant ?? null,
        qty: i.qty,
        unitPrice,
        lineTotal: Math.round(unitPrice * i.qty * 100) / 100,
        image: p.images[0] ?? null,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) throw new Error("No valid items");

  const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;

  let discountAmount = 0;
  let discountCode: string | undefined;
  if (input.discountCode) {
    const d = await evaluateDiscount(shop.id, input.discountCode, subtotal);
    if (d.valid) {
      discountAmount = d.discountAmount;
      discountCode = d.code;
    }
  }
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const order = await prisma.order.create({
    data: {
      shopId: shop.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerAddress: input.customerAddress,
      notes: input.notes,
      subtotal,
      discountCode,
      discountAmount,
      total,
      currency: shop.currency,
      paymentMethod: input.paymentMethod ?? "WHATSAPP",
      items: { create: lines },
    },
    include: { items: true },
  });

  return order;
}

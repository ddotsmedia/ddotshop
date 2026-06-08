import { prisma } from "@/lib/prisma";
import { waQueue, invoiceQueue, JOBS } from "@/lib/queue";
import { buildOrderMessage } from "@/lib/wa-format";
import { awardPoints } from "@/lib/loyalty";

/**
 * Idempotently mark an order paid: decrement stock, upsert customer,
 * cancel the abandoned-cart reminder, and queue WA confirmation + invoice.
 */
export async function confirmOrderPaid(
  orderId: string,
  paymentRef: string,
  method: "TELR" | "STRIPE" | "UPI" | "COD" | "RAZORPAY",
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shop: { select: { name: true, whatsappNumber: true } } },
  });
  if (!order) return;
  if (order.paymentStatus === "PAID") return; // already processed

  const customerId = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentMethod: method,
        paymentRef,
        paidAt: new Date(),
      },
    });

    for (const item of order.items) {
      if (item.productId) {
        await tx.product.updateMany({
          where: { id: item.productId, trackStock: true },
          data: { stock: { decrement: item.qty } },
        });
      }
    }

    const customer = await tx.customer.upsert({
      where: { shopId_phone: { shopId: order.shopId, phone: order.customerPhone } },
      create: {
        shopId: order.shopId,
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderAt: new Date(),
      },
      update: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: order.total },
        lastOrderAt: new Date(),
        name: order.customerName || undefined,
      },
    });
    await tx.order.update({ where: { id: orderId }, data: { customerId: customer.id } });
    return customer.id;
  });

  // Award loyalty points (outside the txn; best-effort).
  if (customerId) {
    awardPoints(customerId, order.shopId, orderId, Number(order.total)).catch(() => {});
  }

  // Cancel pending abandoned-cart reminder.
  waQueue.remove(`cart-${orderId}`).catch(() => {});

  const sellerMessage = buildOrderMessage({
    shopName: order.shop.name,
    currency: order.currency,
    items: order.items.map((i) => ({
      name: i.name,
      variant: i.variant,
      qty: i.qty,
      lineTotal: Number(i.lineTotal).toFixed(2),
    })),
    discountCode: order.discountCode,
    discountAmount: Number(order.discountAmount).toFixed(2),
    total: Number(order.total).toFixed(2),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
  });

  waQueue
    .add(
      JOBS.ORDER_CONFIRMATION,
      {
        orderId,
        sellerPhone: order.shop.whatsappNumber,
        buyerPhone: order.customerPhone,
        message: sellerMessage,
      },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    )
    .catch(() => {});

  invoiceQueue
    .add(JOBS.INVOICE, { orderId, shopName: order.shop.name })
    .catch(() => {});
}

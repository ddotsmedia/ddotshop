import { Worker, type Job } from "bullmq";
import { workerConnection } from "./connection";
import { WA_QUEUE, JOBS, waQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildAbandonedCartMessage } from "@/lib/wa-format";

async function handle(job: Job) {
  switch (job.name) {
    case JOBS.ORDER_CONFIRMATION: {
      const { sellerPhone, buyerPhone, message, orderId } = job.data;
      await sendWhatsAppMessage(sellerPhone, message);
      if (buyerPhone) {
        await sendWhatsAppMessage(
          buyerPhone,
          `Your order #${String(orderId).slice(-6).toUpperCase()} is confirmed! ✅\nThank you for shopping with us.`,
        );
      }
      await prisma.order.update({ where: { id: orderId }, data: { waMessageSent: true } }).catch(() => {});
      break;
    }
    case JOBS.ABANDONED_CART: {
      const { orderId, buyerPhone, shopId, cartValue, currency } = job.data;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true, shop: { select: { name: true, slug: true } } },
      });
      if (!order || order.paymentStatus === "PAID") return; // already paid
      await sendWhatsAppMessage(
        buyerPhone,
        buildAbandonedCartMessage({
          shopName: order.shop.name,
          shopSlug: order.shop.slug,
          cartValue,
          currency,
        }),
      );
      void shopId;
      break;
    }
    case JOBS.LOW_STOCK: {
      const { sellerPhone, message } = job.data;
      await sendWhatsAppMessage(sellerPhone, message);
      break;
    }
    case JOBS.BROADCAST: {
      const { phone, message, broadcastId } = job.data;
      try {
        await sendWhatsAppMessage(phone, message);
        await prisma.broadcast.update({
          where: { id: broadcastId },
          data: { sentCount: { increment: 1 } },
        });
      } catch (err) {
        await prisma.broadcast
          .update({ where: { id: broadcastId }, data: { failedCount: { increment: 1 } } })
          .catch(() => {});
        throw err;
      }
      break;
    }
    case JOBS.REVIEW_REQUEST: {
      const { orderId } = job.data;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          customerPhone: true,
          customerName: true,
          items: { select: { name: true }, take: 1 },
        },
      });
      if (!order || order.status !== "DELIVERED") return;
      const product = order.items[0]?.name ?? "your order";
      await sendWhatsAppMessage(
        order.customerPhone,
        `Hi ${order.customerName}! 🌟 How was your ${product}? Reply with 1–5 stars or send us a message!`,
      );
      break;
    }
    case JOBS.LOYALTY_NOTIFICATION: {
      const { phone, message } = job.data;
      await sendWhatsAppMessage(phone, message);
      break;
    }
    case JOBS.GENERIC_WA:
    case JOBS.PRICE_DROP:
    case JOBS.BACK_IN_STOCK:
    case JOBS.PRE_ORDER_REMINDER: {
      const { phone, message } = job.data;
      await sendWhatsAppMessage(phone, message);
      break;
    }
    case JOBS.FLASH_SALE_START: {
      const { flashSaleId } = job.data;
      const sale = await prisma.flashSale.update({
        where: { id: flashSaleId },
        data: { isActive: true },
        select: {
          shopId: true,
          name: true,
          shop: { select: { name: true, slug: true, tenant: { select: { plan: true } } } },
        },
      });
      if (sale.shop.tenant.plan === "STARTER") break;
      const customers = await prisma.customer.findMany({
        where: { shopId: sale.shopId },
        select: { phone: true },
      });
      const url = `https://${sale.shop.slug}.ddotsshop.com`;
      customers.forEach((c, i) => {
        waQueue
          .add(
            JOBS.GENERIC_WA,
            { phone: c.phone, message: `⚡ ${sale.shop.name} Flash Sale is LIVE! Limited time only. Shop now: ${url}` },
            { delay: i * 1100 },
          )
          .catch(() => {});
      });
      break;
    }
    case JOBS.FLASH_SALE_END: {
      const { flashSaleId } = job.data;
      await prisma.flashSale.update({ where: { id: flashSaleId }, data: { isActive: false } }).catch(() => {});
      break;
    }
    case JOBS.FLOW_SEND: {
      const { phone, flowName } = job.data;
      // TODO[~]: real flow send uses Twilio Content API interactive flow message.
      // Fallback: notify the customer the flow is available.
      await sendWhatsAppMessage(
        phone,
        `Tap to start: *${flowName}* — complete your order right here in WhatsApp.`,
      );
      break;
    }
    default:
      break;
  }
}

export const whatsappWorker = new Worker(WA_QUEUE, handle, {
  connection: workerConnection,
  concurrency: 1, // 1 msg/sec ceiling for Twilio safety
});

whatsappWorker.on("failed", (job, err) => {
  console.error(`[wa-worker] ${job?.name} failed:`, err.message);
});

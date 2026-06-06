import { Worker, type Job } from "bullmq";
import { workerConnection } from "./connection";
import { WA_QUEUE, JOBS } from "@/lib/queue";
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

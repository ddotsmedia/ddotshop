import { Worker, Queue, type Job } from "bullmq";
import { workerConnection } from "./connection";
import { SUB_QUEUE, JOBS, waQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { createPendingOrder } from "@/lib/orders";

const subQueue = new Queue(SUB_QUEUE, { connection: workerConnection });

// Ensure a daily repeatable trigger exists.
export async function scheduleSubscriptionCron() {
  await subQueue.add(
    JOBS.PROCESS_SUBSCRIPTIONS,
    {},
    { repeat: { pattern: "0 0 * * *" }, jobId: "subs-daily" },
  );
}

async function processSubscriptions() {
  const now = new Date();
  const due = await prisma.subscription2.findMany({
    where: { isActive: true, nextOrderAt: { lte: now } },
    include: { product: { select: { name: true, price: true } }, customer: { select: { phone: true } } },
  });

  for (const sub of due) {
    try {
      const order = await createPendingOrder({
        shopId: sub.shopId,
        customerName: "Subscription",
        customerPhone: sub.customer.phone,
        items: [{ productId: sub.productId, name: sub.product.name, price: Number(sub.product.price), qty: 1 }],
        paymentMethod: "WHATSAPP",
      });
      await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED", source: "subscription" } });
      waQueue
        .add(JOBS.GENERIC_WA, {
          phone: sub.customer.phone,
          message: `🔄 Your recurring order for ${sub.product.name} has been placed! Total: ${order.currency} ${Number(order.total).toFixed(2)}. Reply STOP to cancel.`,
        })
        .catch(() => {});
      await prisma.subscription2.update({
        where: { id: sub.id },
        data: { nextOrderAt: new Date(now.getTime() + sub.intervalDays * 86400000) },
      });
    } catch (err) {
      console.error(`[sub-worker] failed for ${sub.id}:`, err);
    }
  }
}

export const subscriptionWorker = new Worker(
  SUB_QUEUE,
  async (job: Job) => {
    if (job.name === JOBS.PROCESS_SUBSCRIPTIONS) await processSubscriptions();
  },
  { connection: workerConnection },
);

subscriptionWorker.on("failed", (job, err) => {
  console.error(`[sub-worker] ${job?.name} failed:`, err.message);
});

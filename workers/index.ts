import { whatsappWorker } from "./whatsapp.worker";
import { invoiceWorker } from "./invoice.worker";
import { subscriptionWorker, scheduleSubscriptionCron } from "./subscription.worker";

scheduleSubscriptionCron().catch((e) => console.error("[Workers] cron schedule failed:", e));

console.log("[Workers] All workers started");

async function shutdown() {
  console.log("[Workers] Shutting down…");
  await Promise.all([whatsappWorker.close(), invoiceWorker.close(), subscriptionWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

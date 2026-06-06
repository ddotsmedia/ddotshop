import { whatsappWorker } from "./whatsapp.worker";
import { invoiceWorker } from "./invoice.worker";

console.log("[Workers] All workers started");

async function shutdown() {
  console.log("[Workers] Shutting down…");
  await Promise.all([whatsappWorker.close(), invoiceWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

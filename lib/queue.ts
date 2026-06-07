import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "@/lib/redis";

export const WA_QUEUE = "ddotsshop-messages";
export const INVOICE_QUEUE = "ddotsshop-invoices";
export const SUB_QUEUE = "ddotsshop-subscriptions";

// bullmq bundles its own ioredis copy; the instance is runtime-compatible but
// the duplicated types clash, so cast through unknown.
const connection = redis as unknown as ConnectionOptions;

declare global {
  // eslint-disable-next-line no-var
  var waQueue: Queue | undefined;
  // eslint-disable-next-line no-var
  var invoiceQueue: Queue | undefined;
}

export const waQueue =
  globalThis.waQueue ?? new Queue(WA_QUEUE, { connection });
export const invoiceQueue =
  globalThis.invoiceQueue ?? new Queue(INVOICE_QUEUE, { connection });

if (process.env.NODE_ENV !== "production") {
  globalThis.waQueue = waQueue;
  globalThis.invoiceQueue = invoiceQueue;
}

/** Job name constants. */
export const JOBS = {
  ORDER_CONFIRMATION: "order-confirmation",
  ABANDONED_CART: "abandoned-cart",
  LOW_STOCK: "low-stock-alert",
  BROADCAST: "broadcast-message",
  INVOICE: "generate-invoice",
  REVIEW_REQUEST: "review-request",
  LOYALTY_NOTIFICATION: "loyalty-notification",
  FLOW_SEND: "flow-send",
  FLASH_SALE_START: "flash-sale-start",
  FLASH_SALE_END: "flash-sale-end",
  PRICE_DROP: "price-drop-alert",
  BACK_IN_STOCK: "back-in-stock",
  PRE_ORDER_REMINDER: "pre-order-reminder",
  GENERIC_WA: "generic-wa",
  PROCESS_SUBSCRIPTIONS: "process-subscriptions",
} as const;

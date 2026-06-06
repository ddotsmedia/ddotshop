import IORedis from "ioredis";
import type { ConnectionOptions } from "bullmq";

// Dedicated blocking connection for workers (separate from the app's client).
export const workerConnection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  { maxRetriesPerRequest: null },
) as unknown as ConnectionOptions;

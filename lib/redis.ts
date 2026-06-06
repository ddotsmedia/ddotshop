import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

export const redis =
  globalThis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalThis.redis = redis;

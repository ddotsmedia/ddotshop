import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaMetrics: { queries: Array<{ sql: string; ms: number; ts: number }> } | undefined;
}

const queryMetrics: Array<{ sql: string; ms: number; ts: number }> = [];

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
  if (!globalThis.prismaMetrics) {
    globalThis.prismaMetrics = { queries: [] };
  }
}

export function getPrismaMetrics() {
  const queries = (globalThis.prismaMetrics?.queries ?? []).length > 0
    ? globalThis.prismaMetrics!.queries
    : queryMetrics;

  if (queries.length === 0) {
    return { count: 0, avgMs: 0, p95Ms: 0, slowCount: 0 };
  }
  const sorted = [...queries].sort((a, b) => b.ms - a.ms);
  const slow = sorted.filter((q) => q.ms > 200).length;
  const sum = queries.reduce((a, q) => a + q.ms, 0);
  const avg = sum / queries.length;
  const p95 = sorted[Math.ceil(queries.length * 0.05) - 1]?.ms ?? 0;
  return { count: queries.length, avgMs: Math.round(avg * 100) / 100, p95Ms: p95, slowCount: slow };
}

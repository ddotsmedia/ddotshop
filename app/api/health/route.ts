import { NextResponse } from "next/server";
import os from "os";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 2000;

async function checkDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

async function checkRedis(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const startTime = Date.now();
  const [dbCheck, redisCheck] = await Promise.all([checkDb(), checkRedis()]);
  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      status: dbCheck.ok ? "ok" : "degraded",
      uptime: process.uptime(),
      db: dbCheck,
      redis: redisCheck,
      memory: {
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      },
      cpu: { loadAvg1: os.loadavg()[0] },
      time: new Date().toISOString(),
    },
    { status: dbCheck.ok ? 200 : 503 }
  );
}

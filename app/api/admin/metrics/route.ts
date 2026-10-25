import { NextResponse, type NextRequest } from "next/server";
import os from "os";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { getPrismaMetrics } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }

  const mem = process.memoryUsage();
  const cpus = os.cpus();

  return NextResponse.json({
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      externalMb: Math.round((mem.external / 1024 / 1024) * 100) / 100,
    },
    cpu: {
      cores: cpus.length,
      loadAvg: {
        load1: os.loadavg()[0],
        load5: os.loadavg()[1],
        load15: os.loadavg()[2],
      },
    },
    uptime: process.uptime(),
    db: getPrismaMetrics(),
  });
}

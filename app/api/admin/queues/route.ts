import { NextResponse, type NextRequest } from "next/server";
import { Queue, type ConnectionOptions } from "bullmq";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { redis } from "@/lib/redis";
import { WA_QUEUE, INVOICE_QUEUE, SUB_QUEUE } from "@/lib/queue";

export const dynamic = "force-dynamic";

const QUEUE_NAMES = [WA_QUEUE, INVOICE_QUEUE, SUB_QUEUE];
const connection = redis as unknown as ConnectionOptions;

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }

  try {
    const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));
    const counts = await Promise.all(queues.map((q) => q.getJobCounts()));

    const result = QUEUE_NAMES.map((name, i) => ({
      id: name,
      name,
      ...counts[i],
    }));

    return NextResponse.json({ queues: result });
  } catch {
    return NextResponse.json({ error: "redis_unavailable" }, { status: 503 });
  }
}

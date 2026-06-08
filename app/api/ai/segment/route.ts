export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireShop } from "@/lib/session";
import { segmentCustomers, aiSegmentInsights } from "@/lib/segments";

// ─── GET — rule-based segments only (no AI, no quota cost) ───────────────────

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await segmentCustomers(ctx.shopId);
  return NextResponse.json(result);
}

// ─── POST — rule-based segments + optional AI marketing insights ──────────────

export async function POST() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segmentResult = await segmentCustomers(ctx.shopId);

  const summaries = segmentResult.segments.map((s) => ({
    key: s.key,
    label: s.label,
    count: s.count,
  }));

  const insights = await aiSegmentInsights(
    ctx.shopId,
    ctx.plan,
    ctx.tenantId,
    summaries,
  );

  return NextResponse.json({ segments: segmentResult.segments, insights });
}
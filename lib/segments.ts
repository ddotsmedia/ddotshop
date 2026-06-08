import { prisma } from "@/lib/prisma";
import { checkAIQuota, pickModel } from "@/lib/model-router";
import { complete, parseJsonResponse, wrapUserContent } from "@/lib/claude";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Segment {
  key: string;
  label: string;
  count: number;
  customerIds: string[];
}

export interface SegmentResult {
  segments: Segment[];
}

// ─── Rule-based segmentation (pure Prisma + JS, no AI) ───────────────────────

export async function segmentCustomers(shopId: string): Promise<SegmentResult> {
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch all customers for this shop with minimal fields
  const customers = await prisma.customer.findMany({
    where: { shopId },
    select: {
      id: true,
      totalOrders: true,
      totalSpent: true,
      lastOrderAt: true,
    },
  });

  if (customers.length === 0) {
    return { segments: [] };
  }

  // Compute high-value threshold: top 20% by totalSpent
  const sortedBySpend = [...customers]
    .map((c) => Number(c.totalSpent))
    .sort((a, b) => b - a);
  const top20Index = Math.max(0, Math.floor(sortedBySpend.length * 0.2) - 1);
  const highValueThreshold = sortedBySpend[top20Index] ?? 0;

  // Find customer IDs with PENDING orders but no PAID orders (abandoners)
  const [pendingOrderCustomerIds, paidOrderCustomerIds] = await Promise.all([
    prisma.order
      .findMany({
        where: { shopId, paymentStatus: "PENDING" },
        select: { customerId: true },
        distinct: ["customerId"],
      })
      .then((rows) =>
        rows.flatMap((r) => (r.customerId !== null ? [r.customerId] : [])),
      ),
    prisma.order
      .findMany({
        where: { shopId, paymentStatus: "PAID" },
        select: { customerId: true },
        distinct: ["customerId"],
      })
      .then((rows) =>
        rows.flatMap((r) => (r.customerId !== null ? [r.customerId] : [])),
      ),
  ]);

  const pendingSet = new Set(pendingOrderCustomerIds);
  const paidSet = new Set(paidOrderCustomerIds);

  // Classify every customer (a customer can belong to multiple segments)
  const firstTime: string[] = [];
  const repeat: string[] = [];
  const lapsed: string[] = [];
  const highValue: string[] = [];

  for (const c of customers) {
    const spent = Number(c.totalSpent);

    if (c.totalOrders <= 1) {
      firstTime.push(c.id);
    }
    if (c.totalOrders >= 2) {
      repeat.push(c.id);
    }
    if (c.lastOrderAt !== null && c.lastOrderAt < sixtyDaysAgo) {
      lapsed.push(c.id);
    }
    if (highValueThreshold > 0 && spent >= highValueThreshold) {
      highValue.push(c.id);
    }
  }

  // Abandoners: have a PENDING order but have never had a PAID order
  const abandoners = pendingOrderCustomerIds.filter((id) => !paidSet.has(id));

  const segments: Segment[] = [
    {
      key: "first-time",
      label: "First-Time Buyers",
      count: firstTime.length,
      customerIds: firstTime,
    },
    {
      key: "repeat",
      label: "Repeat Customers",
      count: repeat.length,
      customerIds: repeat,
    },
    {
      key: "lapsed",
      label: "Lapsed Customers",
      count: lapsed.length,
      customerIds: lapsed,
    },
    {
      key: "high-value",
      label: "High-Value Customers",
      count: highValue.length,
      customerIds: highValue,
    },
    {
      key: "abandoners",
      label: "Cart Abandoners",
      count: abandoners.length,
      customerIds: abandoners,
    },
  ].filter((s) => s.count > 0);

  return { segments };
}

// ─── AI segment insights (optional — guards quota gracefully) ─────────────────

interface SegmentSummary {
  key: string;
  label: string;
  count: number;
}

const InsightSchema = /\{[\s\S]*"insights"\s*:\s*\[[\s\S]*\]/;

export async function aiSegmentInsights(
  shopId: string,
  plan: string,
  tenantId: string,
  segments: SegmentSummary[],
): Promise<string[]> {
  if (segments.length === 0) return [];

  const model = pickModel("insights");
  const quota = await checkAIQuota(tenantId, plan, model);
  if (!quota.allowed) return [];

  try {
    const segmentList = segments
      .map((s) => `- ${s.label}: ${s.count} customer(s)`)
      .join("\n");

    const raw = await complete({
      task: "insights",
      model,
      maxTokens: 600,
      shopId,
      tenantId,
      system:
        "You are a WhatsApp commerce marketing strategist. Give punchy, actionable marketing tactics for each customer segment. Be specific and concise.",
      prompt: `My shop has the following customer segments:\n${wrapUserContent(segmentList)}\n\nReturn ONLY valid JSON: {"insights": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]} — 3 to 4 short, specific, actionable WhatsApp marketing bullets (one per segment or cross-segment). No prose outside the JSON.`,
    });

    if (!InsightSchema.test(raw)) return [];

    const parsed = parseJsonResponse<{ insights: unknown[] }>(raw);
    if (!parsed?.insights || !Array.isArray(parsed.insights)) return [];

    return parsed.insights
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, 4);
  } catch {
    return [];
  }
}

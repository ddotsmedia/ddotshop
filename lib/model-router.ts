import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export const MODELS = {
  HAIKU: "claude-haiku-4-5",
  SONNET: "claude-sonnet-4-6",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Map a logical task to the cheapest capable model.
const TASK_MODEL: Record<string, ModelId> = {
  describe: MODELS.HAIKU,
  search: MODELS.HAIKU,
  chatbot: MODELS.HAIKU,
  insights: MODELS.SONNET,
};

export function pickModel(task: string): ModelId {
  return TASK_MODEL[task] ?? MODELS.HAIKU;
}

// Monthly AI-call quotas per plan, per model tier.
const QUOTAS: Record<string, { haiku: number; sonnet: number }> = {
  STARTER: { haiku: 100, sonnet: 0 },
  GROWTH: { haiku: 1000, sonnet: 200 },
  PRO: { haiku: 5000, sonnet: 1500 },
  AGENCY: { haiku: 50000, sonnet: 15000 },
};

function tier(model: ModelId): "haiku" | "sonnet" {
  return model === MODELS.SONNET ? "sonnet" : "haiku";
}

function monthKey(tenantId: string, t: "haiku" | "sonnet"): string {
  const now = new Date();
  return `aiquota:${tenantId}:${t}:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
}

/** Returns { allowed, remaining }. Increments the counter when allowed. */
export async function checkAIQuota(
  tenantId: string,
  plan: string,
  model: ModelId,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const t = tier(model);
  const limit = (QUOTAS[plan] ?? QUOTAS.STARTER)[t];
  if (limit <= 0) return { allowed: false, remaining: 0, limit };

  const key = monthKey(tenantId, t);
  let current = 0;
  try {
    current = Number((await redis.get(key)) ?? 0);
  } catch {
    // Redis unavailable — fail open in dev, but still meter best-effort.
    return { allowed: true, remaining: limit, limit };
  }
  if (current >= limit) return { allowed: false, remaining: 0, limit };

  try {
    const next = await redis.incr(key);
    if (next === 1) await redis.expire(key, 60 * 60 * 24 * 35);
  } catch {
    /* best effort */
  }
  return { allowed: true, remaining: Math.max(0, limit - current - 1), limit };
}

// Approximate per-MTok pricing (USD) for cost logging.
const PRICING: Record<ModelId, { in: number; out: number }> = {
  [MODELS.HAIKU]: { in: 1, out: 5 },
  [MODELS.SONNET]: { in: 3, out: 15 },
};

export async function logUsage(params: {
  shopId?: string | null;
  tenantId?: string | null;
  feature: string;
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const p = PRICING[params.model] ?? PRICING[MODELS.HAIKU];
  const cost =
    (params.inputTokens / 1_000_000) * p.in + (params.outputTokens / 1_000_000) * p.out;
  try {
    await prisma.aIUsageLog.create({
      data: {
        shopId: params.shopId ?? null,
        tenantId: params.tenantId ?? null,
        feature: params.feature,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        cost,
      },
    });
  } catch {
    /* metering must never break the request */
  }
}

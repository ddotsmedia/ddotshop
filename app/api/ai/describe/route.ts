import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireShop } from "@/lib/session";
import { checkAIQuota, pickModel } from "@/lib/model-router";
import { complete, wrapUserContent, parseJsonResponse } from "@/lib/claude";

const Body = z.object({
  productName: z.string().min(1).max(120),
  category: z.string().max(60).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().default("AED"),
  variants: z.array(z.string()).optional(),
});

const Result = z.object({
  description: z.string(),
  descriptionAr: z.string(),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const model = pickModel("describe");
  const quota = await checkAIQuota(ctx.tenantId, ctx.plan, model);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "AI quota exceeded for your plan", limit: quota.limit },
      { status: 429 },
    );
  }

  const prompt = `Write a compelling 2-3 sentence product description for a UAE e-commerce store, then provide an Arabic translation.
Product: ${wrapUserContent(d.productName)}
${d.category ? `Category: ${wrapUserContent(d.category)}` : ""}
${d.price ? `Price: ${d.currency} ${d.price}` : ""}
${d.variants?.length ? `Options: ${wrapUserContent(d.variants.join(", "))}` : ""}

Respond with ONLY valid JSON, no prose, no code fences:
{"description": "...", "descriptionAr": "..."}`;

  try {
    const raw = await complete({
      task: "describe",
      model,
      prompt,
      maxTokens: 600,
      shopId: ctx.shopId,
      tenantId: ctx.tenantId,
      system:
        "You are a concise e-commerce copywriter for the UAE/GCC market. Output strictly valid JSON.",
    });
    const json = parseJsonResponse<unknown>(raw);
    const validated = Result.safeParse(json);
    if (!validated.success) {
      return NextResponse.json({ error: "AI returned invalid data" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}

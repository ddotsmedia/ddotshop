import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pickModel } from "@/lib/model-router";
import { complete, wrapUserContent, parseJsonResponse } from "@/lib/claude";

const Body = z.object({ query: z.string().min(1).max(120), shopId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ products: [] }, { status: 400 });
  const { query, shopId } = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { tenant: { select: { id: true } } },
  });

  const products = await prisma.product.findMany({
    where: { shopId, isPublished: true },
    select: { id: true, name: true, description: true, category: { select: { name: true } } },
    take: 100,
  });
  if (products.length === 0) return NextResponse.json({ products: [] });

  const catalog = products.map((p) => ({
    id: p.id,
    name: p.name,
    desc: p.description?.slice(0, 120) ?? "",
    cat: p.category?.name ?? "",
  }));

  const model = pickModel("search");
  try {
    const raw = await complete({
      task: "search",
      model,
      maxTokens: 300,
      shopId,
      tenantId: shop?.tenant?.id,
      system: "You match shopper queries to product IDs. Output only a JSON array of IDs.",
      prompt: `Customer searched: ${wrapUserContent(query)}
Products: ${JSON.stringify(catalog)}
Return ONLY a JSON array of matching product IDs, best match first: ["id1","id2"]`,
    });
    const ids = parseJsonResponse<string[]>(raw) ?? [];
    const order = new Map(ids.map((id, i) => [id, i]));
    const matched = products
      .filter((p) => order.has(p.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((p) => p.id);
    return NextResponse.json({ productIds: matched });
  } catch {
    return NextResponse.json({ productIds: [] }, { status: 502 });
  }
}

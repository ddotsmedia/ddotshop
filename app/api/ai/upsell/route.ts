import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAIQuota, pickModel } from "@/lib/model-router";
import { complete, parseJsonResponse } from "@/lib/claude";

const Body = z.object({
  shopId: z.string(),
  cartItems: z.array(z.object({ productId: z.string(), name: z.string(), category: z.string().optional() })),
  limit: z.number().int().min(1).max(5).default(3),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ products: [] }, { status: 400 });
  const { shopId, cartItems, limit } = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { tenant: { select: { id: true, plan: true } } },
  });
  if (!shop) return NextResponse.json({ products: [] });
  if (shop.tenant.plan === "STARTER") return NextResponse.json({ products: [] });

  const model = pickModel("tag");
  const quota = await checkAIQuota(shop.tenant.id, shop.tenant.plan, model);
  if (!quota.allowed) return NextResponse.json({ products: [] }, { status: 429 });

  const inCart = new Set(cartItems.map((i) => i.productId));
  const products = await prisma.product.findMany({
    where: { shopId, isPublished: true, id: { notIn: [...inCart] } },
    select: { id: true, name: true, price: true, images: true, category: { select: { name: true } } },
    take: 30,
  });
  if (products.length === 0) return NextResponse.json({ products: [] });

  try {
    const raw = await complete({
      task: "tag",
      model,
      maxTokens: 150,
      shopId,
      tenantId: shop.tenant.id,
      system: "You suggest complementary products. Output only a JSON array of product IDs.",
      prompt: `Customer cart: ${JSON.stringify(cartItems.map((c) => c.name))}
Available: ${JSON.stringify(products.map((p) => ({ id: p.id, name: p.name, cat: p.category?.name })))}
Return ONLY a JSON array of up to ${limit} complementary product IDs: ["id1","id2"]`,
    });
    const ids = (parseJsonResponse<string[]>(raw) ?? []).slice(0, limit);
    const map = new Map(products.map((p) => [p.id, p]));
    const picked = ids
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, name: p.name, price: Number(p.price), image: p.images[0] ?? null }));
    return NextResponse.json({ products: picked });
  } catch {
    return NextResponse.json({ products: [] }, { status: 502 });
  }
}

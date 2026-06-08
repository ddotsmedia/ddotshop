export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireShop } from "@/lib/session";
import { fetchShopifyProducts, importProducts } from "@/lib/shopify-import";

const ShopifyImportSchema = z.object({
  shopDomain: z
    .string()
    .min(1, "Shop domain is required")
    .transform((v) => v.trim()),
  accessToken: z
    .string()
    .min(1, "Access token is required")
    .transform((v) => v.trim()),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ShopifyImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { shopDomain, accessToken } = parsed.data;

  let products;
  try {
    products = await fetchShopifyProducts(shopDomain, accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products from Shopify";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (products.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  const result = await importProducts(ctx.shopId, products);
  return NextResponse.json(result, { status: 200 });
}
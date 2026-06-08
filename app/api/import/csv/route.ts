export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/session";
import { parseShopifyCsv, importProducts } from "@/lib/shopify-import";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "CSV file must be under 5 MB" }, { status: 413 });
  }

  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  const parsed = parseShopifyCsv(csvText);
  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "No products found in CSV. Ensure the file uses Shopify export format." },
      { status: 422 },
    );
  }

  const result = await importProducts(ctx.shopId, parsed);
  return NextResponse.json(result, { status: 200 });
}
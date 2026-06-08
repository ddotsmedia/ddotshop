import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ParsedProduct {
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  sku?: string;
}

// ─────────────────────────────────────────────────────────────
// Minimal CSV parser — handles quoted fields containing commas / newlines
// ─────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let value = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          // Escaped quote
          value += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      // skip optional comma separator
      if (line[i] === ",") i++;
    } else {
      // Unquoted field
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

/**
 * Split raw CSV text into logical rows, respecting quoted fields that may
 * contain embedded newlines.
 */
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      // Toggle quote state (handle "" escape — both chars are inside the loop)
      if (inQuotes && text[i + 1] === '"') {
        current += '""';
        i++; // skip second quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      // Skip bare \r from CRLF
      if (ch === "\r" && text[i + 1] === "\n") {
        i++;
      }
      if (current.trim().length > 0) rows.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) rows.push(current);
  return rows;
}

/** Strip HTML tags and decode common HTML entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// parseShopifyCsv
// ─────────────────────────────────────────────────────────────

/**
 * Parse a Shopify product CSV export into ParsedProduct[].
 *
 * Shopify CSV columns used:
 *   Title | Body (HTML) | Variant Price | Variant Compare At Price |
 *   Image Src | Variant Inventory Qty | Variant SKU
 *
 * Multiple rows sharing the same Title represent additional variants /
 * images of the same product — they are grouped.
 */
export function parseShopifyCsv(csvText: string): ParsedProduct[] {
  const rows = splitCsvRows(csvText.trim());
  if (rows.length < 2) return [];

  const headerRow = parseCsvLine(rows[0]);
  const idx = (name: string): number =>
    headerRow.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());

  const colTitle = idx("Title");
  const colBody = idx("Body (HTML)");
  const colPrice = idx("Variant Price");
  const colCompare = idx("Variant Compare At Price");
  const colImage = idx("Image Src");
  const colStock = idx("Variant Inventory Qty");
  const colSku = idx("Variant SKU");

  // Group rows by Title
  const productMap = new Map<
    string,
    {
      name: string;
      description?: string;
      price: number;
      comparePrice?: number;
      images: string[];
      stock: number;
      sku?: string;
    }
  >();

  for (let r = 1; r < rows.length; r++) {
    const cells = parseCsvLine(rows[r]);
    const title = colTitle >= 0 ? (cells[colTitle] ?? "").trim() : "";
    if (!title) continue;

    const rawPrice = colPrice >= 0 ? (cells[colPrice] ?? "").trim() : "";
    const priceNum = parseFloat(rawPrice);

    const rawImage = colImage >= 0 ? (cells[colImage] ?? "").trim() : "";
    const rawStock = colStock >= 0 ? (cells[colStock] ?? "").trim() : "0";
    const stockNum = parseInt(rawStock, 10);

    if (productMap.has(title)) {
      // Additional row: collect extra images, accumulate stock
      const existing = productMap.get(title)!;
      if (rawImage && !existing.images.includes(rawImage)) {
        existing.images.push(rawImage);
      }
      // Add variant stock to running total
      if (!isNaN(stockNum)) {
        existing.stock += stockNum;
      }
      // If price not set yet (first row had empty price), pick it up here
      if (existing.price === 0 && !isNaN(priceNum) && priceNum > 0) {
        existing.price = priceNum;
      }
    } else {
      // First (defining) row for this product
      const rawBody = colBody >= 0 ? (cells[colBody] ?? "").trim() : "";
      const description = rawBody ? stripHtml(rawBody) : undefined;

      const rawCompare = colCompare >= 0 ? (cells[colCompare] ?? "").trim() : "";
      const compareNum = rawCompare ? parseFloat(rawCompare) : undefined;

      const sku = colSku >= 0 ? (cells[colSku] ?? "").trim() || undefined : undefined;

      productMap.set(title, {
        name: title,
        description: description || undefined,
        price: isNaN(priceNum) ? 0 : priceNum,
        comparePrice: compareNum !== undefined && !isNaN(compareNum) ? compareNum : undefined,
        images: rawImage ? [rawImage] : [],
        stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
        sku,
      });
    }
  }

  return Array.from(productMap.values());
}

// ─────────────────────────────────────────────────────────────
// importProducts
// ─────────────────────────────────────────────────────────────

export async function importProducts(
  shopId: string,
  products: ParsedProduct[],
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const p of products) {
    // Skip rows with empty name or invalid price
    if (!p.name.trim() || isNaN(p.price) || p.price < 0) {
      skipped++;
      continue;
    }

    try {
      await prisma.product.create({
        data: {
          shopId,
          name: p.name.trim(),
          description: p.description ?? undefined,
          price: p.price,
          comparePrice: p.comparePrice ?? undefined,
          images: p.images,
          stock: Math.max(0, Math.round(p.stock)),
          trackStock: true,
          lowStockThreshold: 5,
          isPublished: false,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}

// ─────────────────────────────────────────────────────────────
// fetchShopifyProducts — Shopify Admin REST
// ─────────────────────────────────────────────────────────────

interface ShopifyVariant {
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  sku: string | null;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  title: string;
  body_html: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string,
): Promise<ParsedProduct[]> {
  const domain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new Error(
      `Failed to connect to Shopify store "${domain}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Shopify API returned ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`,
    );
  }

  let data: ShopifyProductsResponse;
  try {
    data = (await res.json()) as ShopifyProductsResponse;
  } catch {
    throw new Error("Shopify returned an invalid JSON response.");
  }

  if (!Array.isArray(data.products)) {
    throw new Error("Unexpected Shopify API response shape — missing products array.");
  }

  return data.products.map((sp): ParsedProduct => {
    const firstVariant = sp.variants[0];
    const price = firstVariant ? parseFloat(firstVariant.price) : 0;
    const compareRaw = firstVariant?.compare_at_price;
    const comparePrice = compareRaw ? parseFloat(compareRaw) : undefined;
    const totalStock = sp.variants.reduce(
      (sum, v) => sum + (v.inventory_quantity > 0 ? v.inventory_quantity : 0),
      0,
    );
    const images = sp.images.map((img) => img.src).filter(Boolean);
    const description = sp.body_html ? stripHtml(sp.body_html) : undefined;
    const sku = firstVariant?.sku ?? undefined;

    return {
      name: sp.title,
      description: description || undefined,
      price: isNaN(price) ? 0 : price,
      comparePrice: comparePrice !== undefined && !isNaN(comparePrice) ? comparePrice : undefined,
      images,
      stock: totalStock,
      sku: sku || undefined,
    };
  });
}

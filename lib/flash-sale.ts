import { prisma } from "@/lib/prisma";

export interface ActiveFlashSale {
  id: string;
  name: string;
  endsAt: Date;
  prices: Map<string, number>; // productId -> salePrice
}

/** Active flash sale for a shop right now (isActive + within window), with sale prices. */
export async function getActiveFlashSale(shopId: string): Promise<ActiveFlashSale | null> {
  const now = new Date();
  const sale = await prisma.flashSale.findFirst({
    where: { shopId, isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { products: true },
    orderBy: { endsAt: "asc" },
  });
  if (!sale) return null;
  return {
    id: sale.id,
    name: sale.name,
    endsAt: sale.endsAt,
    prices: new Map(sale.products.map((p) => [p.productId, Number(p.salePrice)])),
  };
}

export function isFlashActive(sale: { startsAt: Date; endsAt: Date }): boolean {
  const now = Date.now();
  return sale.startsAt.getTime() <= now && now <= sale.endsAt.getTime();
}

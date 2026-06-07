import { prisma } from "@/lib/prisma";
import { waQueue, JOBS } from "@/lib/queue";

async function shopInfo(shopId: string) {
  return prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, slug: true, currency: true } });
}

/** Notify wishlist subscribers (notifyOnDrop) when a product price decreases. */
export async function checkPriceDrop(productId: string, oldPrice: number, newPrice: number): Promise<void> {
  if (newPrice >= oldPrice) return;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, shopId: true } });
  if (!product) return;
  const shop = await shopInfo(product.shopId);
  if (!shop) return;

  const subs = await prisma.wishlist.findMany({
    where: { productId, notifyOnDrop: true },
    select: { customerPhone: true },
  });
  const url = `https://${shop.slug}.ddotsshop.com`;
  subs.forEach((s, i) => {
    waQueue
      .add(
        JOBS.PRICE_DROP,
        {
          phone: s.customerPhone,
          message: `📉 Price drop on ${product.name}! Was ${shop.currency} ${oldPrice} → Now ${shop.currency} ${newPrice}. Shop: ${url}`,
        },
        { delay: i * 1100 },
      )
      .catch(() => {});
  });
}

/** Notify waitlist + wishlist(notifyOnStock) when stock goes 0 → >0. */
export async function checkBackInStock(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, shopId: true } });
  if (!product) return;
  const shop = await shopInfo(product.shopId);
  if (!shop) return;
  const url = `https://${shop.slug}.ddotsshop.com`;

  const [waitlist, wishlist] = await Promise.all([
    prisma.waitlist.findMany({ where: { productId, notified: false }, select: { id: true, customerPhone: true } }),
    prisma.wishlist.findMany({ where: { productId, notifyOnStock: true }, select: { customerPhone: true } }),
  ]);

  const phones = new Set<string>([...waitlist.map((w) => w.customerPhone), ...wishlist.map((w) => w.customerPhone)]);
  let i = 0;
  for (const phone of phones) {
    waQueue
      .add(
        JOBS.BACK_IN_STOCK,
        { phone, message: `✅ ${product.name} is back in stock at ${shop.name}! Grab it before it sells out: ${url}` },
        { delay: i++ * 1100 },
      )
      .catch(() => {});
  }
  if (waitlist.length) {
    await prisma.waitlist.updateMany({ where: { id: { in: waitlist.map((w) => w.id) } }, data: { notified: true } });
  }
}

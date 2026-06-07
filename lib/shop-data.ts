import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getShopBySlug = cache(async (slug: string) => {
  return prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      logoUrl: true,
      themeColor: true,
      currency: true,
      whatsappNumber: true,
      isVerified: true,
      isPublished: true,
      locale: true,
      freeShippingThreshold: true,
      shippingFlatRate: true,
    },
  });
});

export const getShopStorefront = cache(async (slug: string) => {
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isPublished) return null;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shop.id, isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { variants: true },
    }),
    prisma.category.findMany({
      where: { shopId: shop.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const bundles = await prisma.productBundle.findMany({
    where: { shopId: shop.id, isActive: true },
    include: { items: { include: { product: { select: { name: true, price: true, images: true } } } } },
  });

  const reviewAgg = await prisma.productReview.groupBy({
    by: ["productId"],
    where: { shopId: shop.id, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  const ratings = new Map(
    reviewAgg.map((r) => [
      r.productId,
      { avg: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0, count: r._count },
    ]),
  );

  return { shop, products, categories, ratings, bundles };
});

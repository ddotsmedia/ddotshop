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

  return { shop, products, categories };
});

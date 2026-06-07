import { notFound } from "next/navigation";
import { getShopStorefront } from "@/lib/shop-data";
import { StorefrontView } from "@/components/shop/StorefrontView";
import type { ShopProduct } from "@/components/shop/types";

export const revalidate = 60;

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getShopStorefront(params.slug);
  if (!data) notFound();
  const { shop, products, categories, ratings } = data;

  const mapped: ShopProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    description: p.description,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    images: p.images,
    stock: p.stock,
    trackStock: p.trackStock,
    isFeatured: p.isFeatured,
    categoryId: p.categoryId,
    variants: p.variants.map((v) => ({ name: v.name, values: v.values })),
    rating: ratings.get(p.id)?.avg ?? 0,
    reviewCount: ratings.get(p.id)?.count ?? 0,
  }));

  return (
    <StorefrontView
      shop={{
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        tagline: shop.tagline,
        logoUrl: shop.logoUrl,
        themeColor: shop.themeColor,
        currency: shop.currency,
        whatsappNumber: shop.whatsappNumber,
        isVerified: shop.isVerified,
      }}
      products={mapped}
      categories={categories}
    />
  );
}

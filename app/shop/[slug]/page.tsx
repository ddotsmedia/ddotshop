import { notFound } from "next/navigation";
import { getShopStorefront } from "@/lib/shop-data";
import { getActiveFlashSale } from "@/lib/flash-sale";
import { getVATConfig } from "@/lib/vat";
import { StorefrontView } from "@/components/shop/StorefrontView";
import type { ShopProduct } from "@/components/shop/types";

export const revalidate = 60;

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getShopStorefront(params.slug);
  if (!data) notFound();
  const { shop, products, categories, ratings, bundles } = data;
  const flash = await getActiveFlashSale(shop.id);
  const vat = await getVATConfig(shop.id);

  const bundleViews = bundles.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    bundlePrice: Number(b.bundlePrice),
    imageUrl: b.imageUrl,
    items: b.items.map((i) => ({
      qty: i.qty,
      product: { name: i.product.name, price: Number(i.product.price), images: i.product.images },
    })),
  }));

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
    flashPrice: flash?.prices.get(p.id) ?? null,
    isPreOrder: p.isPreOrder,
    preOrderDeposit: p.preOrderDeposit != null ? Number(p.preOrderDeposit) : null,
    allowSubscription: p.allowSubscription,
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
        vatRate: vat.enabled ? vat.rate : 0,
        freeShippingThreshold: shop.freeShippingThreshold != null ? Number(shop.freeShippingThreshold) : null,
        shippingFlatRate: Number(shop.shippingFlatRate ?? 0),
      }}
      products={mapped}
      categories={categories}
      flashEndsAt={flash ? flash.endsAt.toISOString() : null}
      bundles={bundleViews}
    />
  );
}

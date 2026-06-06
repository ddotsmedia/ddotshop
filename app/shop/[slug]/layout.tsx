import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/shop-data";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Shop not found" };
  return {
    title: `${shop.name} — DdotsShop`,
    description: shop.tagline ?? `Shop ${shop.name} and order on WhatsApp.`,
    manifest: "/manifest.json",
    openGraph: {
      title: shop.name,
      description: shop.tagline ?? undefined,
      images: shop.logoUrl ? [shop.logoUrl] : undefined,
    },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();

  const rtl = shop.locale === "AR";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    description: shop.tagline ?? undefined,
    image: shop.logoUrl ?? undefined,
    url: `https://${shop.slug}.ddotsshop.com`,
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}

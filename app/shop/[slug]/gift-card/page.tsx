import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GiftCardPurchase } from "@/components/shop/GiftCardPurchase";

export const dynamic = "force-dynamic";

export default async function GiftCardPage({ params }: { params: { slug: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, currency: true, logoUrl: true, themeColor: true, isPublished: true },
  });
  if (!shop || !shop.isPublished) notFound();
  return (
    <div className="min-h-screen bg-white">
      <GiftCardPurchase
        shop={{ id: shop.id, name: shop.name, currency: shop.currency, logoUrl: shop.logoUrl, themeColor: shop.themeColor }}
      />
    </div>
  );
}

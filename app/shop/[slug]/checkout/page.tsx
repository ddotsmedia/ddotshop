import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: { slug: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      currency: true,
      whatsappNumber: true,
      telrStoreId: true,
      telrAuthKey: true,
      stripeSecretKey: true,
      codEnabled: true,
      upiId: true,
      upiQrUrl: true,
      isPublished: true,
    },
  });
  if (!shop || !shop.isPublished) notFound();

  return (
    <div className="min-h-screen bg-white">
      <CheckoutForm
        shop={{
          id: shop.id,
          slug: shop.slug,
          name: shop.name,
          currency: shop.currency,
          whatsappNumber: shop.whatsappNumber,
          telrEnabled: Boolean(shop.telrStoreId && shop.telrAuthKey),
          stripeEnabled: Boolean(shop.stripeSecretKey),
          codEnabled: shop.codEnabled,
          upiId: shop.upiId,
          upiQrUrl: shop.upiQrUrl,
        }}
      />
    </div>
  );
}

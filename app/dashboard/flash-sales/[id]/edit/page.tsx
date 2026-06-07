import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FlashSaleForm, type FlashSaleInitial } from "@/components/dashboard/FlashSaleForm";

export const dynamic = "force-dynamic";

function toLocal(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function EditFlashSalePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const sale = await prisma.flashSale.findFirst({
    where: { id: params.id, shopId: session!.user.shopId! },
    include: { products: true },
  });
  if (!sale) notFound();

  const initial: FlashSaleInitial = {
    id: sale.id,
    name: sale.name,
    startsAt: toLocal(sale.startsAt),
    endsAt: toLocal(sale.endsAt),
    products: sale.products.map((p) => ({ productId: p.productId, salePrice: Number(p.salePrice) })),
  };

  return (
    <div>
      <PageHeader title="Edit flash sale" subtitle={sale.name} />
      <FlashSaleForm initial={initial} />
    </div>
  );
}

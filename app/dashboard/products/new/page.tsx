import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductForm } from "@/components/dashboard/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({
    where: { id: session!.user.shopId! },
    select: { currency: true },
  });
  return (
    <div>
      <PageHeader title="Add product" subtitle="Create a new product for your shop" />
      <ProductForm currency={shop?.currency ?? "AED"} />
    </div>
  );
}

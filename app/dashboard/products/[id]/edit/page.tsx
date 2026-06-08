import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductForm, type ProductInitial } from "@/components/dashboard/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const shopId = session!.user.shopId!;
  const [product, shop] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, shopId },
      include: { variants: true },
    }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { currency: true } }),
  ]);
  if (!product) notFound();

  const initial: ProductInitial = {
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    descriptionMl: product.descriptionMl,
    descriptionHi: product.descriptionHi,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    images: product.images,
    stock: product.stock,
    trackStock: product.trackStock,
    lowStockThreshold: product.lowStockThreshold,
    categoryId: product.categoryId,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    isPreOrder: product.isPreOrder,
    preOrderDeposit: product.preOrderDeposit ? Number(product.preOrderDeposit) : undefined,
    allowSubscription: product.allowSubscription,
    variants: product.variants.map((v) => ({ name: v.name, values: v.values })),
  };

  return (
    <div>
      <PageHeader title="Edit product" subtitle={product.name} />
      <ProductForm initial={initial} currency={shop?.currency ?? "AED"} />
    </div>
  );
}

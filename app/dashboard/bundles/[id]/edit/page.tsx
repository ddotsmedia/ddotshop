import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BundleForm, type BundleInitial } from "@/components/dashboard/BundleForm";

export const dynamic = "force-dynamic";

export default async function EditBundlePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const bundle = await prisma.productBundle.findFirst({
    where: { id: params.id, shopId: session!.user.shopId! },
    include: { items: true },
  });
  if (!bundle) notFound();

  const initial: BundleInitial = {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    bundlePrice: Number(bundle.bundlePrice),
    imageUrl: bundle.imageUrl,
    isActive: bundle.isActive,
    items: bundle.items.map((i) => ({ productId: i.productId, qty: i.qty })),
  };

  return (
    <div>
      <PageHeader title="Edit bundle" subtitle={bundle.name} />
      <BundleForm initial={initial} />
    </div>
  );
}

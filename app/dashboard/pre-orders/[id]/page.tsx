import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PreOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const pre = await prisma.preOrder.findFirst({
    where: { id: params.id, shopId: session!.user.shopId! },
    include: { product: { select: { name: true } } },
  });
  if (!pre) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/pre-orders" className="inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">{pre.product?.name ?? "Pre-order"}</h2>
        <Badge variant="info">{pre.status}</Badge>
      </div>

      <Card>
        <CardContent className="space-y-2 text-sm">
          <CardTitle className="mb-2">Details</CardTitle>
          <div className="flex justify-between"><span className="text-[#6b7280]">Customer</span><span>{pre.customerName ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Phone</span><span>{pre.customerPhone}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Deposit paid</span><span>{formatCurrency(Number(pre.depositPaid))}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Total price</span><span>{formatCurrency(Number(pre.totalPrice))}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Expected</span><span>{pre.expectedAt ? formatDate(pre.expectedAt) : "—"}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Created</span><span>{formatDateTime(pre.createdAt)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

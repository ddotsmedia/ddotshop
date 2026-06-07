import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Mic } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { waMeLink } from "@/lib/wa-format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "info" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId: session!.user.shopId! },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  const voiceOrder = order.voiceOrderId
    ? await prisma.voiceOrder.findUnique({
        where: { id: order.voiceOrderId },
        select: { transcript: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">#{order.id.slice(-8).toUpperCase()}</h2>
          <p className="text-sm text-[#6b7280]">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[order.status] ?? "muted"}>{order.status}</Badge>
          <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>
            {order.paymentStatus}
          </Badge>
          <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary">
              <Download className="h-4 w-4" /> Invoice
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <CardTitle className="mb-3">Items</CardTitle>
            <div className="divide-y divide-[#f3f4f6]">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    {i.variant && <p className="text-xs text-[#9ca3af]">{i.variant}</p>}
                    <p className="text-xs text-[#9ca3af]">
                      {i.qty} × {formatCurrency(Number(i.unitPrice), order.currency)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(i.lineTotal), order.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-[#e5e7eb] pt-3 text-sm">
              <div className="flex justify-between text-[#6b7280]">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal), order.currency)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
                  <span>-{formatCurrency(Number(order.discountAmount), order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total), order.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <CardTitle className="mb-2">Customer</CardTitle>
              <p className="text-sm font-medium">{order.customerName}</p>
              <a
                href={waMeLink(order.customerPhone, "")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-wa-dark"
              >
                {order.customerPhone}
              </a>
              {order.customerAddress && (
                <p className="mt-2 text-sm text-[#6b7280]">{order.customerAddress}</p>
              )}
              {order.notes && (
                <p className="mt-2 rounded-md bg-surface p-2 text-xs text-[#6b7280]">{order.notes}</p>
              )}
            </CardContent>
          </Card>

          {voiceOrder && (
            <Card>
              <CardContent>
                <CardTitle className="mb-2 flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-wa-dark" /> Voice order transcript
                </CardTitle>
                <p className="rounded-md bg-surface p-2 text-sm italic text-[#6b7280]">
                  &ldquo;{voiceOrder.transcript ?? "—"}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <CardTitle className="mb-2">Payment</CardTitle>
              <p className="text-sm text-[#6b7280]">Method: {order.paymentMethod}</p>
              {order.paymentRef && (
                <p className="text-sm text-[#6b7280]">Ref: {order.paymentRef.slice(0, 24)}</p>
              )}
              {order.paidAt && (
                <p className="text-sm text-[#6b7280]">Paid: {formatDateTime(order.paidAt)}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { waMeLink } from "@/lib/wa-format";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, shop: { select: { slug: true, name: true, whatsappNumber: true } } },
  });
  if (!order || order.shop.slug !== params.slug) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white p-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-3 text-2xl font-bold">Order Confirmed!</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Order #{order.id.slice(-6).toUpperCase()}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-[#e5e7eb] p-4">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between py-1 text-sm">
            <span>
              {i.name}
              {i.variant ? ` (${i.variant})` : ""} × {i.qty}
            </span>
            <span>{formatCurrency(Number(i.lineTotal), order.currency)}</span>
          </div>
        ))}
        {Number(order.discountAmount) > 0 && (
          <div className="flex justify-between py-1 text-sm text-success">
            <span>Discount</span>
            <span>-{formatCurrency(Number(order.discountAmount), order.currency)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-[#f3f4f6] pt-2 font-bold">
          <span>Total</span>
          <span>{formatCurrency(Number(order.total), order.currency)}</span>
        </div>
      </div>

      <a
        href={waMeLink(order.shop.whatsappNumber, `Hi! I just placed order #${order.id.slice(-6).toUpperCase()}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 block w-full rounded-lg bg-wa-green py-3 text-center font-semibold text-white"
      >
        Chat with {order.shop.name} on WhatsApp
      </a>
      <a
        href={`/shop/${order.shop.slug}`}
        className="mt-2 block w-full py-2 text-center text-sm text-[#6b7280]"
      >
        Continue Shopping
      </a>
    </div>
  );
}

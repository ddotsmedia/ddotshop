import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { generateInvoicePDF } from "@/lib/invoice";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    include: {
      items: true,
      shop: { select: { name: true, region: true, taxType: true, taxNumber: true, vatConfig: { select: { vatNumber: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { getTaxConfig } = await import("@/lib/tax");
  const tax = getTaxConfig(order.shop);
  const taxNumberLabel = tax.label === "GST" ? "GSTIN" : tax.label === "VAT" ? "TRN" : "Tax No.";

  if (order.invoiceUrl) {
    return NextResponse.redirect(order.invoiceUrl);
  }

  const pdf = await generateInvoicePDF({
    orderId: order.id,
    shopName: order.shop.name,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    currency: order.currency,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.name,
      variant: i.variant,
      qty: i.qty,
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    vatRate: Number(order.vatRate),
    vatAmount: Number(order.vatAmount),
    shippingCost: Number(order.shippingCost),
    trn: order.shop.taxNumber ?? order.shop.vatConfig?.vatNumber ?? null,
    taxLabel: tax.label,
    taxNumberLabel,
    total: Number(order.total),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.id.slice(-8)}.pdf"`,
    },
  });
}

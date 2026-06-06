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
    include: { items: true, shop: { select: { name: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    total: Number(order.total),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.id.slice(-8)}.pdf"`,
    },
  });
}

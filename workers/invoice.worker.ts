import { Worker, type Job } from "bullmq";
import { workerConnection } from "./connection";
import { INVOICE_QUEUE, JOBS } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/invoice";
import { uploadToR2 } from "@/lib/r2";

async function handle(job: Job) {
  if (job.name !== JOBS.INVOICE) return;
  const { orderId } = job.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      shop: { select: { name: true, region: true, taxType: true, taxNumber: true, vatConfig: { select: { vatNumber: true } } } },
    },
  });
  if (!order) return;

  const { getTaxConfig } = await import("@/lib/tax");
  const tax = getTaxConfig(order.shop);
  const taxNumberLabel = tax.label === "GST" ? "GSTIN" : tax.label === "VAT" ? "TRN" : "Tax No.";

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

  const key = `shops/${order.shopId}/invoices/order-${order.id}.pdf`;
  const url = await uploadToR2(pdf, key, "application/pdf");
  await prisma.order.update({ where: { id: orderId }, data: { invoiceUrl: url } });
}

export const invoiceWorker = new Worker(INVOICE_QUEUE, handle, {
  connection: workerConnection,
});

invoiceWorker.on("failed", (job, err) => {
  console.error(`[invoice-worker] ${job?.id} failed:`, err.message);
});

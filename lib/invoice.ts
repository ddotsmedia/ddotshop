import PDFDocument from "pdfkit";

export interface InvoiceData {
  orderId: string;
  shopName: string;
  shopAddress?: string;
  customerName: string;
  customerPhone: string;
  currency: string;
  createdAt: Date;
  items: { name: string; variant?: string | null; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  vatRate?: number;
  vatAmount?: number;
  shippingCost?: number;
  trn?: string | null;
  total: number;
}

/** Render a clean A4 invoice PDF and return it as a Buffer. */
export function generateInvoicePDF(d: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const money = (n: number) => `${d.currency} ${n.toFixed(2)}`;

    // Header
    doc.fillColor("#25D366").fontSize(22).text("DdotsShop", { continued: false });
    doc.fillColor("#111827").fontSize(16).text(d.shopName);
    if (d.shopAddress) doc.fontSize(10).fillColor("#6b7280").text(d.shopAddress);
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Invoice: #${d.orderId.slice(-8).toUpperCase()}`)
      .text(`Date: ${d.createdAt.toISOString().slice(0, 10)}`);
    if (d.trn) doc.text(`TRN: ${d.trn}`);

    // Bill to
    doc.moveDown();
    doc.fillColor("#111827").fontSize(12).text("Bill To:");
    doc.fontSize(10).fillColor("#374151").text(d.customerName).text(d.customerPhone);

    // Items table
    doc.moveDown();
    const top = doc.y;
    doc.fontSize(10).fillColor("#6b7280");
    doc.text("Item", 50, top);
    doc.text("Qty", 320, top);
    doc.text("Price", 380, top);
    doc.text("Total", 470, top);
    doc.moveTo(50, top + 15).lineTo(545, top + 15).strokeColor("#e5e7eb").stroke();

    let y = top + 25;
    doc.fillColor("#111827");
    for (const it of d.items) {
      const label = it.variant ? `${it.name} (${it.variant})` : it.name;
      doc.text(label, 50, y, { width: 260 });
      doc.text(String(it.qty), 320, y);
      doc.text(money(it.unitPrice), 380, y);
      doc.text(money(it.lineTotal), 470, y);
      y += 22;
    }

    doc.moveTo(50, y).lineTo(545, y).strokeColor("#e5e7eb").stroke();
    y += 12;
    doc.fillColor("#6b7280").text("Subtotal", 380, y).fillColor("#111827").text(money(d.subtotal), 470, y);
    if (d.discountAmount > 0) {
      y += 18;
      doc.fillColor("#6b7280").text("Discount", 380, y).fillColor("#10B981").text(`-${money(d.discountAmount)}`, 470, y);
    }
    if (d.shippingCost && d.shippingCost > 0) {
      y += 18;
      doc.fillColor("#6b7280").text("Shipping", 380, y).fillColor("#111827").text(money(d.shippingCost), 470, y);
    }
    if (d.vatAmount && d.vatAmount > 0) {
      y += 18;
      doc.fillColor("#6b7280").text(`VAT ${d.vatRate ?? 5}%`, 380, y).fillColor("#111827").text(money(d.vatAmount), 470, y);
    }
    y += 20;
    doc.fillColor("#111827").fontSize(12).text("Total (incl. VAT)", 360, y).text(money(d.total), 470, y);

    // Footer
    const footer = d.vatAmount && d.vatAmount > 0
      ? "This is a VAT invoice issued in compliance with UAE VAT Law — ddotsshop.com"
      : "Thank you for your order — ddotsshop.com";
    doc.fontSize(9).fillColor("#9ca3af").text(footer, 50, 760, { align: "center", width: 495 });

    doc.end();
  });
}

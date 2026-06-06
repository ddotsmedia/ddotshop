// Pure WhatsApp message formatters — safe to import in client components
// (no Twilio/node dependencies).

interface OrderLine {
  name: string;
  variant?: string | null;
  qty: number;
  lineTotal: number | string;
}

interface OrderMessageData {
  shopName: string;
  items: OrderLine[];
  currency: string;
  discountCode?: string | null;
  discountAmount?: number | string | null;
  total: number | string;
  customerName: string;
  customerPhone: string;
}

/** Build the canonical "New Order" WhatsApp message (see BUILD_SPEC). */
export function buildOrderMessage(d: OrderMessageData): string {
  const lines = d.items
    .map(
      (i) =>
        `• ${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.qty} — ${d.currency} ${i.lineTotal}`,
    )
    .join("\n");

  const discount =
    d.discountCode && Number(d.discountAmount) > 0
      ? `\n🏷️ *Promo ${d.discountCode}:* -${d.currency} ${d.discountAmount}`
      : "";

  return [
    `🛍️ *New Order — ${d.shopName}*`,
    ``,
    lines,
    discount,
    `💰 *Total: ${d.currency} ${d.total}*`,
    ``,
    `📋 *Customer:* ${d.customerName}`,
    `📱 *Phone:* ${d.customerPhone}`,
    ``,
    `_Powered by Ddotsshop.com_`,
  ]
    .filter((l) => l !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function buildAbandonedCartMessage(d: {
  shopName: string;
  shopSlug: string;
  cartValue: number | string;
  currency: string;
}): string {
  const url = `https://${d.shopSlug}.ddotsshop.com`;
  return `👋 You left items in your cart at *${d.shopName}*!\n\nYour cart total: ${d.currency} ${d.cartValue}\n\nComplete your order here: ${url}\n\n_Powered by Ddotsshop.com_`;
}

export function buildLowStockMessage(d: {
  shopName: string;
  productName: string;
  stock: number;
}): string {
  return `⚠️ *Low stock alert — ${d.shopName}*\n\n${d.productName} is down to ${d.stock} unit(s). Restock soon to avoid lost sales.`;
}

/** wa.me deep link for client-side checkout. */
export function waMeLink(phone: string, text: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

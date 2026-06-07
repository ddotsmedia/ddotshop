import { prisma } from "@/lib/prisma";
import { createPendingOrder } from "@/lib/orders";
import type { CartItem } from "@/lib/validations";

export interface InboundParams {
  From?: string; // "whatsapp:+9715..."
  To?: string; // shop WA number
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ButtonPayload?: string;
  ButtonText?: string;
}

export function cleanPhone(waAddr?: string): string {
  return (waAddr ?? "").replace(/^whatsapp:/, "").trim();
}

export async function findShopByWaNumber(to?: string) {
  const phone = cleanPhone(to);
  if (!phone) return null;
  return prisma.shop.findFirst({
    where: { whatsappNumber: { contains: phone.replace(/^\+/, "") } },
    select: { id: true, name: true, slug: true, whatsappNumber: true },
  });
}

/** Parse a Meta Flow completion payload into order items. Tolerant of shapes. */
export function parseFlowItems(payload: unknown): CartItem[] | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const productId = typeof p.product === "string" ? p.product : undefined;
  const qty = Number(p.qty ?? 1);
  if (!productId || !Number.isFinite(qty) || qty < 1) return null;
  return [{ productId, name: "", price: 0, qty }];
}

/**
 * Handle a completed WhatsApp Flow submission → create a pending order.
 * Returns a reply string or null.
 */
export async function handleFlowResponse(
  params: InboundParams,
  flowPayload: Record<string, unknown>,
): Promise<string | null> {
  const shop = await findShopByWaNumber(params.To);
  if (!shop) return null;
  const items = parseFlowItems(flowPayload);
  if (!items) return "Sorry, we couldn't read your selection. Please try again.";

  try {
    const order = await createPendingOrder({
      shopId: shop.id,
      customerName: String(flowPayload.name ?? "WhatsApp customer"),
      customerPhone: cleanPhone(params.From),
      customerAddress: flowPayload.address ? String(flowPayload.address) : undefined,
      items,
      paymentMethod: "WHATSAPP",
    });
    await prisma.order.update({ where: { id: order.id }, data: { source: "wa_flow" } });
    return `Order received! Total ${order.currency} ${Number(order.total).toFixed(2)}. We'll confirm shortly.`;
  } catch {
    return "Sorry, something went wrong creating your order.";
  }
}

// Text/voice/review handlers are extended in later phases (15: voice, 16: reviews).
// Default text handler — overridden behaviour layered by those phases.
export async function handleTextReply(_params: InboundParams): Promise<string | null> {
  return null;
}

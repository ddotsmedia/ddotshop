import { prisma } from "@/lib/prisma";
import { createPendingOrder } from "@/lib/orders";
import { transcribeAudio, extractOrderIntent } from "@/lib/voice-order";
import { waQueue, JOBS } from "@/lib/queue";
import { buildOrderMessage } from "@/lib/wa-format";
import type { CartItem } from "@/lib/validations";

interface ResolvedVoiceItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

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

/** Handle an inbound WhatsApp voice note → create a PENDING VoiceOrder for confirmation. */
export async function handleVoiceNote(params: InboundParams): Promise<string | null> {
  const shop = await findShopByWaNumber(params.To);
  const audioUrl = params.MediaUrl0;
  if (!shop || !audioUrl) return null;
  const phone = cleanPhone(params.From);

  const vo = await prisma.voiceOrder.create({
    data: { shopId: shop.id, customerPhone: phone, audioUrl },
  });

  let transcript = "";
  try {
    transcript = await transcribeAudio(audioUrl);
  } catch {
    await prisma.voiceOrder.update({ where: { id: vo.id }, data: { status: "FAILED" } });
    return "Sorry, we couldn't process your voice note. Please type your order or browse the shop.";
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, isPublished: true },
    select: { id: true, name: true, price: true },
  });
  const intent = await extractOrderIntent(transcript, products, shop.id).catch(() => null);

  const resolved: ResolvedVoiceItem[] = [];
  for (const item of intent?.items ?? []) {
    const p = products.find((x) => x.name.toLowerCase().includes(item.productName.toLowerCase()));
    if (p) resolved.push({ productId: p.id, name: p.name, qty: item.qty, price: Number(p.price) });
  }

  await prisma.voiceOrder.update({
    where: { id: vo.id },
    data: { transcript, parsedItems: resolved as object },
  });

  if (resolved.length === 0) {
    return `I heard: "${transcript}". I couldn't match products. Browse: https://${shop.slug}.ddotsshop.com`;
  }

  const total = resolved.reduce((s, i) => s + i.price * i.qty, 0);
  const lines = resolved.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
  return `Got it! You asked for:\n${lines}\nTotal: AED ${total.toFixed(2)}\nReply YES to confirm or NO to cancel.`;
}

const YES = /^(yes|y|نعم|اوك|ok)/i;
const NO = /^(no|n|لا|cancel)/i;

/** Handle YES/NO confirmation of a pending VoiceOrder. */
async function handleVoiceConfirm(params: InboundParams): Promise<string | null> {
  const shop = await findShopByWaNumber(params.To);
  if (!shop) return null;
  const phone = cleanPhone(params.From);
  const body = (params.Body ?? "").trim();

  const vo = await prisma.voiceOrder.findFirst({
    where: { shopId: shop.id, customerPhone: phone, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!vo) return null;

  if (NO.test(body)) {
    await prisma.voiceOrder.update({ where: { id: vo.id }, data: { status: "CANCELLED" } });
    return `No problem! Visit https://${shop.slug}.ddotsshop.com to browse.`;
  }
  if (!YES.test(body)) return null;

  const items = (vo.parsedItems as unknown as ResolvedVoiceItem[]) ?? [];
  if (items.length === 0) return null;
  const cart: CartItem[] = items.map((i) => ({
    productId: i.productId,
    name: i.name,
    price: i.price,
    qty: i.qty,
  }));

  const order = await createPendingOrder({
    shopId: shop.id,
    customerName: "WhatsApp customer",
    customerPhone: phone,
    items: cart,
    paymentMethod: "WHATSAPP",
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { source: "voice", voiceOrderId: vo.id },
  });
  await prisma.voiceOrder.update({
    where: { id: vo.id },
    data: { status: "CONFIRMED", orderId: order.id },
  });

  const sellerMsg = buildOrderMessage({
    shopName: shop.name,
    currency: order.currency,
    items: order.items.map((i) => ({ name: i.name, variant: i.variant, qty: i.qty, lineTotal: Number(i.lineTotal).toFixed(2) })),
    total: Number(order.total).toFixed(2),
    customerName: order.customerName,
    customerPhone: phone,
  });
  waQueue
    .add(JOBS.ORDER_CONFIRMATION, { orderId: order.id, sellerPhone: shop.whatsappNumber, message: sellerMsg })
    .catch(() => {});

  return `✅ Order confirmed! Total AED ${Number(order.total).toFixed(2)}. The shop will be in touch.`;
}

async function handleStop(params: InboundParams): Promise<string | null> {
  const body = (params.Body ?? "").trim().toLowerCase();
  if (!/^(stop|إيقاف|الغاء|إلغاء)$/.test(body)) return null;
  const shop = await findShopByWaNumber(params.To);
  if (!shop) return null;
  const phone = cleanPhone(params.From);
  const customer = await prisma.customer.findUnique({
    where: { shopId_phone: { shopId: shop.id, phone } },
    select: { id: true },
  });
  if (!customer) return null;
  const res = await prisma.subscription2.updateMany({
    where: { shopId: shop.id, customerId: customer.id, isActive: true },
    data: { isActive: false },
  });
  if (res.count === 0) return null;
  return "✅ Your subscription has been cancelled.";
}

// Text dispatcher: STOP → voice confirm → post-delivery review replies.
export async function handleTextReply(params: InboundParams): Promise<string | null> {
  const stop = await handleStop(params);
  if (stop !== null) return stop;
  const voice = await handleVoiceConfirm(params);
  if (voice !== null) return voice;
  const { handleReviewReply } = await import("@/lib/reviews");
  return handleReviewReply(params);
}

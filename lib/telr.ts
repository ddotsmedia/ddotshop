import crypto from "crypto";

const TELR_URL = "https://secure.telr.com/gateway/order.json";

export interface TelrParams {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  storeId: string;
  authKey: string;
}

/** Create a Telr hosted-payment-page order. Returns the payment URL + Telr ref. */
export async function createTelrOrder(
  p: TelrParams,
): Promise<{ paymentUrl: string; telrRef: string }> {
  const body = {
    method: "create",
    store: Number(p.storeId),
    authkey: p.authKey,
    order: {
      cartid: p.orderId,
      test: process.env.NODE_ENV === "production" ? "0" : "1",
      amount: p.amount.toFixed(2),
      currency: p.currency,
      description: p.description,
    },
    return: { authorised: p.returnUrl, declined: p.cancelUrl, cancelled: p.cancelUrl },
  };

  const res = await fetch(TELR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Telr error ${res.status}`);
  const data = (await res.json()) as {
    order?: { url?: string; ref?: string };
    error?: { message?: string };
  };
  if (!data.order?.url || !data.order.ref) {
    throw new Error(data.error?.message ?? "Telr did not return a payment URL");
  }
  return { paymentUrl: data.order.url, telrRef: data.order.ref };
}

/** Verify a Telr webhook signature (HMAC-SHA256 over the raw payload). */
export function verifyTelrHMAC(payload: string, signature: string, authKey: string): boolean {
  const expected = crypto.createHmac("sha256", authKey).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

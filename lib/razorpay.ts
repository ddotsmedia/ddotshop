import crypto from "crypto";

const RAZORPAY_URL = "https://api.razorpay.com/v1/orders";

export interface RazorpayParams {
  amount: number; // major units (INR)
  currency: string;
  orderId: string;
  keyId: string;
  secret: string;
}

/** Create a Razorpay order. Amount is converted to the smallest unit (paise). */
export async function createRazorpayOrder(
  p: RazorpayParams,
): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }> {
  const auth = "Basic " + Buffer.from(`${p.keyId}:${p.secret}`).toString("base64");
  const res = await fetch(RAZORPAY_URL, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(p.amount * 100),
      currency: p.currency,
      receipt: p.orderId,
      notes: { orderId: p.orderId },
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Razorpay error ${res.status}`);
  const data = (await res.json()) as { id?: string; amount?: number; currency?: string };
  if (!data.id) throw new Error("Razorpay did not return an order id");
  return { razorpayOrderId: data.id, amount: data.amount ?? 0, currency: data.currency ?? p.currency, keyId: p.keyId };
}

/** Verify a Razorpay client-side payment signature: HMAC-SHA256("orderId|paymentId", secret). */
export function verifyRazorpayPayment(
  razorpayOrderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Verify a Razorpay webhook signature: HMAC-SHA256(rawBody, webhookSecret). */
export function verifyRazorpayWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

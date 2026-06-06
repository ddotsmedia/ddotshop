import Stripe from "stripe";

export function getStripe(secretKey?: string): Stripe {
  const key = secretKey ?? process.env.STRIPE_SECRET_KEY ?? "";
  // Use the SDK's pinned API version (avoids version-string type drift across SDK upgrades).
  return new Stripe(key);
}

export interface StripeSessionParams {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  secretKey?: string;
}

/** Create a Stripe Checkout session and return its hosted URL. */
export async function createStripeSession(
  p: StripeSessionParams,
): Promise<{ sessionUrl: string; sessionId: string }> {
  const stripe = getStripe(p.secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: p.currency.toLowerCase(),
          unit_amount: Math.round(p.amount * 100),
          product_data: { name: p.description },
        },
      },
    ],
    metadata: { orderId: p.orderId },
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  });
  if (!session.url) throw new Error("Stripe did not return a session URL");
  return { sessionUrl: session.url, sessionId: session.id };
}

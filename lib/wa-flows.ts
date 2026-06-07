// Meta WhatsApp Flows JSON builders (Flow JSON v5).
// These produce the `flowJson` stored on WAFlowTemplate and submitted to Meta.

export interface FlowProduct {
  id: string;
  name: string;
  price: number;
}
export interface FlowService {
  id: string;
  name: string;
  durationMin: number;
}

type FlowJSON = Record<string, unknown>;

/** In-chat checkout: ProductSelect → VariantPicker → QtyAddress → Confirm. */
export function buildCheckoutFlow(
  shop: { name: string; currency: string },
  products: FlowProduct[],
): FlowJSON {
  const productOptions = products.map((p) => ({
    id: p.id,
    title: `${p.name} — ${shop.currency} ${p.price}`,
  }));
  return {
    version: "5.0",
    screens: [
      {
        id: "PRODUCT_SELECT",
        title: `Shop ${shop.name}`,
        data: {},
        layout: {
          type: "SingleColumnLayout",
          children: [
            {
              type: "RadioButtonsGroup",
              name: "product",
              label: "Choose a product",
              required: true,
              "data-source": productOptions,
            },
            { type: "Footer", label: "Next", "on-click-action": { name: "navigate", next: { type: "screen", name: "QTY_ADDRESS" } } },
          ],
        },
      },
      {
        id: "QTY_ADDRESS",
        title: "Your details",
        layout: {
          type: "SingleColumnLayout",
          children: [
            { type: "TextInput", name: "qty", label: "Quantity", "input-type": "number", required: true },
            { type: "TextInput", name: "name", label: "Your name", required: true },
            { type: "TextInput", name: "address", label: "Delivery address", required: false },
            { type: "Footer", label: "Review", "on-click-action": { name: "navigate", next: { type: "screen", name: "CONFIRM" } } },
          ],
        },
      },
      {
        id: "CONFIRM",
        title: "Confirm order",
        terminal: true,
        layout: {
          type: "SingleColumnLayout",
          children: [
            { type: "TextBody", text: "Tap below to send your order to the shop on WhatsApp." },
            { type: "Footer", label: "Place order", "on-click-action": { name: "complete", payload: {} } },
          ],
        },
      },
    ],
  };
}

/** Booking flow for service shops: ServiceSelect → DateTime → Confirm. */
export function buildBookingFlow(
  shop: { name: string },
  services: FlowService[],
): FlowJSON {
  return {
    version: "5.0",
    screens: [
      {
        id: "SERVICE_SELECT",
        title: `Book at ${shop.name}`,
        layout: {
          type: "SingleColumnLayout",
          children: [
            {
              type: "RadioButtonsGroup",
              name: "service",
              label: "Choose a service",
              required: true,
              "data-source": services.map((s) => ({ id: s.id, title: `${s.name} (${s.durationMin}min)` })),
            },
            { type: "Footer", label: "Next", "on-click-action": { name: "navigate", next: { type: "screen", name: "DATETIME" } } },
          ],
        },
      },
      {
        id: "DATETIME",
        title: "Pick a time",
        terminal: true,
        layout: {
          type: "SingleColumnLayout",
          children: [
            { type: "DatePicker", name: "date", label: "Date", required: true },
            { type: "TextInput", name: "time", label: "Preferred time", required: true },
            { type: "Footer", label: "Confirm booking", "on-click-action": { name: "complete", payload: {} } },
          ],
        },
      },
    ],
  };
}

/** CSAT 1–5 star rating flow tied to an order. */
export function buildCSATFlow(orderId: string): FlowJSON {
  return {
    version: "5.0",
    screens: [
      {
        id: "RATING",
        title: "Rate your order",
        terminal: true,
        data: { orderId: { type: "string", __example__: orderId } },
        layout: {
          type: "SingleColumnLayout",
          children: [
            {
              type: "RadioButtonsGroup",
              name: "rating",
              label: "How was your order?",
              required: true,
              "data-source": [
                { id: "5", title: "⭐⭐⭐⭐⭐ Excellent" },
                { id: "4", title: "⭐⭐⭐⭐ Good" },
                { id: "3", title: "⭐⭐⭐ Okay" },
                { id: "2", title: "⭐⭐ Poor" },
                { id: "1", title: "⭐ Bad" },
              ],
            },
            { type: "TextInput", name: "comment", label: "Comments (optional)", required: false },
            { type: "Footer", label: "Submit", "on-click-action": { name: "complete", payload: {} } },
          ],
        },
      },
    ],
  };
}

export type FlowType = "CHECKOUT" | "BOOKING" | "SURVEY";

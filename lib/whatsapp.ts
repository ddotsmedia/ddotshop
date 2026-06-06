import twilio from "twilio";

export {
  buildOrderMessage,
  buildAbandonedCartMessage,
  buildLowStockMessage,
  waMeLink,
} from "@/lib/wa-format";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

const client = sid && token && sid.startsWith("AC") ? twilio(sid, token) : null;

export const whatsappConfigured = Boolean(client);

function toWhatsApp(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  const e164 = clean.startsWith("+") ? clean : `+${clean}`;
  return `whatsapp:${e164}`;
}

/** Send a WhatsApp text message via Twilio. Throws if Twilio is not configured. */
export async function sendWhatsAppMessage(phone: string, body: string): Promise<string> {
  if (!client) throw new Error("Twilio WhatsApp not configured");
  const msg = await client.messages.create({ from, to: toWhatsApp(phone), body });
  return msg.sid;
}

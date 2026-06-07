import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import {
  handleFlowResponse,
  handleTextReply,
  handleVoiceNote,
  type InboundParams,
} from "@/lib/wa-inbound";

export const dynamic = "force-dynamic";

function twiml(message: string | null): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw)) as InboundParams &
    Record<string, string>;

  // Signature validation (enforced only when a real auth token is set).
  const token = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature") ?? "";
  if (token && token !== "placeholder") {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhooks/twilio`;
    const valid = twilio.validateRequest(token, signature, url, params as Record<string, string>);
    if (!valid) return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // 1) WhatsApp Flow completion — Body carries JSON payload.
    if (params.Body && params.Body.trim().startsWith("{")) {
      try {
        const payload = JSON.parse(params.Body) as Record<string, unknown>;
        if (payload && typeof payload === "object") {
          const reply = await handleFlowResponse(params, payload);
          return twiml(reply);
        }
      } catch {
        /* not JSON — fall through to text */
      }
    }

    // 2) Voice note → voice order.
    const numMedia = Number(params.NumMedia ?? 0);
    if (numMedia > 0 && (params.MediaContentType0 ?? "").startsWith("audio")) {
      const reply = await handleVoiceNote(params);
      return twiml(reply);
    }

    // 3) Text replies (voice-confirm, reviews) — see lib/wa-inbound.
    const reply = await handleTextReply(params);
    return twiml(reply);
  } catch {
    return twiml(null);
  }
}

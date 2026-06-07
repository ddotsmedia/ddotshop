import { toFile } from "openai";
import { openai } from "@/lib/openai";
import { complete, wrapUserContent, parseJsonResponse } from "@/lib/claude";

export interface VoiceOrderItem {
  productName: string;
  qty: number;
  variant?: string;
}
export interface VoiceOrderIntent {
  items: VoiceOrderItem[];
  address?: string;
}

interface CatalogProduct {
  id: string;
  name: string;
}

/** Download audio from Twilio and transcribe with OpenAI Whisper. */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(audioUrl, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error(`Audio download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const file = await toFile(buf, "voice.ogg", { type: "audio/ogg" });
  const result = await openai.audio.transcriptions.create({ file, model: "whisper-1" });
  return result.text;
}

/** Extract structured order intent from a transcript using Claude Haiku. */
export async function extractOrderIntent(
  transcript: string,
  products: CatalogProduct[],
  shopId: string,
): Promise<VoiceOrderIntent | null> {
  const catalog = products.map((p) => p.name);
  const raw = await complete({
    task: "describe",
    shopId,
    maxTokens: 400,
    system:
      "You extract grocery/retail order intent from a voice transcript. Match to the catalog. Output strict JSON only.",
    prompt: `Catalog: ${JSON.stringify(catalog)}
Transcript: ${wrapUserContent(transcript)}
Return ONLY JSON: {"items":[{"productName":"<exact catalog name>","qty":<number>,"variant":"<optional>"}],"address":"<optional>"}
Only include products that exist in the catalog.`,
  });
  const parsed = parseJsonResponse<VoiceOrderIntent>(raw);
  if (!parsed || !Array.isArray(parsed.items)) return null;
  return parsed;
}

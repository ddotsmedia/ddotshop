import Anthropic from "@anthropic-ai/sdk";
import { pickModel, logUsage, type ModelId } from "@/lib/model-router";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder",
});

/** Always wrap untrusted user-supplied text before interpolating into a prompt. */
export function wrapUserContent(text: string): string {
  const safe = String(text).replace(/<\/?user_content>/gi, "");
  return `<user_content>${safe}</user_content>`;
}

interface CompleteParams {
  task: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
  shopId?: string | null;
  tenantId?: string | null;
  model?: ModelId;
}

/** Non-streaming completion. Returns the assistant text and logs usage. */
export async function complete(params: CompleteParams): Promise<string> {
  const model = params.model ?? pickModel(params.task);
  const res = await anthropic.messages.create({
    model,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  await logUsage({
    shopId: params.shopId,
    tenantId: params.tenantId,
    feature: params.task,
    model,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Parse a JSON object out of a model response, tolerating code fences / prose. */
export function parseJsonResponse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

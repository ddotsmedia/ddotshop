import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/claude";
import { pickModel, logUsage } from "@/lib/model-router";

export const dynamic = "force-dynamic";

const Body = z.object({ message: z.string().min(1).max(500), shopSlug: z.string() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const { message, shopSlug } = parsed.data;

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    select: {
      id: true,
      name: true,
      tenant: { select: { id: true } },
      products: {
        where: { isPublished: true },
        select: { name: true, price: true, description: true },
        take: 20,
      },
    },
  });
  if (!shop) return new Response("Shop not found", { status: 404 });

  const products = shop.products.map((p) => ({
    name: p.name,
    price: Number(p.price),
    desc: p.description?.slice(0, 100) ?? "",
  }));

  const model = pickModel("chatbot");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let outputText = "";
      try {
        const mstream = anthropic.messages.stream({
          model,
          max_tokens: 400,
          system: `You are a friendly shopping assistant for "${shop.name}". Answer concisely about products. Always suggest ordering on WhatsApp. Products: ${JSON.stringify(products)}`,
          messages: [{ role: "user", content: `<user_content>${message}</user_content>` }],
        });

        mstream.on("text", (delta) => {
          outputText += delta;
          controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
        });

        await mstream.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(encoder.encode("data: Sorry, I couldn't respond right now.\n\n"));
      } finally {
        controller.close();
        logUsage({
          shopId: shop.id,
          tenantId: shop.tenant?.id,
          feature: "chatbot",
          model,
          inputTokens: Math.ceil(JSON.stringify(products).length / 4) + message.length,
          outputTokens: Math.ceil(outputText.length / 4),
        }).catch(() => {});
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

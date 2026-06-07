import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

// Submits the flow JSON to Meta's WhatsApp Business /flows endpoint.
// Requires a Meta WABA access token + business account id (not configured in dev).
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const flow = await prisma.wAFlowTemplate.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
  });
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = process.env.META_WABA_TOKEN;
  const wabaId = process.env.META_WABA_ID;

  // TODO[~]: live Meta Flows publish requires META_WABA_TOKEN + META_WABA_ID. See BLOCKERS.md.
  if (!token || !wabaId) {
    const updated = await prisma.wAFlowTemplate.update({
      where: { id: flow.id },
      data: { published: true, metaFlowId: `local-${flow.id.slice(-8)}` },
    });
    return NextResponse.json({ flow: updated, note: "Marked published locally (Meta API not configured)" });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/flows`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: flow.name, categories: ["OTHER"], flow_json: JSON.stringify(flow.flowJson) }),
    });
    const data = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || !data.id) {
      return NextResponse.json({ error: data.error?.message ?? "Meta publish failed" }, { status: 502 });
    }
    const updated = await prisma.wAFlowTemplate.update({
      where: { id: flow.id },
      data: { published: true, metaFlowId: data.id },
    });
    return NextResponse.json({ flow: updated });
  } catch {
    return NextResponse.json({ error: "Meta publish failed" }, { status: 502 });
  }
}

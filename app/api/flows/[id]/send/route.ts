import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";

const Body = z.object({ customerPhone: z.string().min(6).max(20) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  const flow = await prisma.wAFlowTemplate.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
  });
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!flow.published) {
    return NextResponse.json({ error: "Publish the flow first" }, { status: 409 });
  }

  // Never call Twilio from a route — queue it.
  await waQueue.add(JOBS.FLOW_SEND, {
    phone: parsed.data.customerPhone,
    flowId: flow.metaFlowId ?? flow.id,
    flowName: flow.name,
    shopId: ctx.shopId,
  });

  return NextResponse.json({ queued: true });
}

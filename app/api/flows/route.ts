import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const ALLOWED = new Set(["PRO", "AGENCY"]);

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const flows = await prisma.wAFlowTemplate.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ flows, plan: ctx.plan });
}

const Body = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["CHECKOUT", "BOOKING", "SURVEY"]),
  flowJson: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED.has(ctx.plan)) {
    return NextResponse.json({ error: "WhatsApp Flows require the Pro or Agency plan" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid flow" }, { status: 400 });
  }
  const flow = await prisma.wAFlowTemplate.create({
    data: {
      shopId: ctx.shopId,
      name: parsed.data.name,
      type: parsed.data.type,
      flowJson: parsed.data.flowJson as object,
    },
  });
  return NextResponse.json({ flow }, { status: 201 });
}

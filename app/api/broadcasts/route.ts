import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { CreateBroadcastSchema } from "@/lib/validations";

const ALLOWED_PLANS = new Set(["PRO", "AGENCY"]);

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const broadcasts = await prisma.broadcast.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ broadcasts, plan: ctx.plan });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_PLANS.has(ctx.plan)) {
    return NextResponse.json(
      { error: "Broadcasts require the Pro or Agency plan" },
      { status: 403 },
    );
  }
  const parsed = CreateBroadcastSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const broadcast = await prisma.broadcast.create({
    data: {
      shopId: ctx.shopId,
      name: parsed.data.name,
      message: parsed.data.message,
      mediaUrl: parsed.data.mediaUrl,
      targetTags: parsed.data.targetTags,
      scheduledAt: parsed.data.scheduledAt,
      status: parsed.data.scheduledAt ? "SCHEDULED" : "DRAFT",
    },
  });
  return NextResponse.json({ broadcast }, { status: 201 });
}

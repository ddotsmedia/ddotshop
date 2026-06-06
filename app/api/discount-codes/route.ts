import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { CreateDiscountSchema } from "@/lib/validations";

export async function GET() {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const codes = await prisma.discountCode.findMany({
    where: { shopId: ctx.shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = CreateDiscountSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  try {
    const code = await prisma.discountCode.create({
      data: {
        shopId: ctx.shopId,
        code: d.code.toUpperCase(),
        type: d.type,
        value: d.value,
        minOrder: d.minOrder,
        maxUses: d.maxUses,
        expiresAt: d.expiresAt,
      },
    });
    return NextResponse.json({ code }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
}

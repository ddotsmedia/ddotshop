import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { getToken } from "@/lib/shiprocket";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Email + password required" }, { status: 400 });

  try {
    const token = await getToken(parsed.data.email, parsed.data.password);
    await prisma.shop.update({ where: { id: ctx.shopId }, data: { shiprocketToken: token } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Shiprocket connection failed" }, { status: 502 });
  }
}

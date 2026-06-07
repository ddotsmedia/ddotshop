import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const code6 = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const Body = z.object({ customerPhone: z.string().min(6), shopId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { customerPhone, shopId } = parsed.data;

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const customer = await prisma.customer.findUnique({
    where: { shopId_phone: { shopId, phone: customerPhone } },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  let link = await prisma.referralLink.findFirst({
    where: { customerId: customer.id, shopId },
  });
  if (!link) {
    link = await prisma.referralLink.create({
      data: { customerId: customer.id, shopId, code: code6() },
    });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ referralUrl: `${base}/shop/${shop.slug}/ref/${link.code}` });
}

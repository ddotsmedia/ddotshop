export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";

const PostSchema = z
  .object({
    customerPhone: z.string().min(1, "Phone is required"),
    customerName: z.string().max(200).optional(),
    company: z.string().max(200).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status"); // "pending" | "approved" | undefined

  const where: { shopId: string; isApproved?: boolean } = { shopId: ctx.shopId };
  if (status === "pending") where.isApproved = false;
  if (status === "approved") where.isApproved = true;

  const customers = await prisma.wholesaleCustomer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = PostSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { customerPhone, customerName, company } = parsed.data;

  const customer = await prisma.wholesaleCustomer.upsert({
    where: {
      shopId_customerPhone: {
        shopId: ctx.shopId,
        customerPhone,
      },
    },
    update: {
      customerName: customerName ?? undefined,
      company: company ?? undefined,
    },
    create: {
      shopId: ctx.shopId,
      customerPhone,
      customerName,
      company,
      isApproved: false,
    },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
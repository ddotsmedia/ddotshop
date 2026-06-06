import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateShopSchema, UpdateShopSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const shop = await prisma.shop.findUnique({
    where: { tenantId: session.user.tenantId },
  });
  return NextResponse.json({ shop });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = CreateShopSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { shopName, slug, whatsappNumber, currency, locale } = parsed.data;

    const taken = await prisma.shop.findUnique({ where: { slug } });
    if (taken) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    const existing = await prisma.shop.findUnique({
      where: { tenantId: session.user.tenantId },
    });
    if (existing) {
      return NextResponse.json({ error: "Shop already exists" }, { status: 409 });
    }

    const shop = await prisma.shop.create({
      data: {
        tenantId: session.user.tenantId,
        name: shopName,
        slug,
        whatsappNumber,
        currency,
        locale,
      },
    });
    return NextResponse.json({ shop }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.shopId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = UpdateShopSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const shop = await prisma.shop.update({
      where: { id: session.user.shopId },
      data: parsed.data,
    });
    revalidatePath(`/shop/${shop.slug}`);
    return NextResponse.json({ shop });
  } catch {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

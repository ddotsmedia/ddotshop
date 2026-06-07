import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; code: string } },
) {
  const link = await prisma.referralLink.findUnique({ where: { code: params.code } });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dest = new URL(`/shop/${params.slug}`, base);

  if (link) {
    await prisma.referralLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
    const res = NextResponse.redirect(dest);
    res.cookies.set("ref", params.code, { maxAge: 30 * 24 * 60 * 60, path: "/" });
    return res;
  }
  return NextResponse.redirect(dest);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SLUG_RE = /^[a-z0-9-]{3,30}$/;
const RESERVED = new Set(["app", "www", "api", "admin", "shop", "dashboard", "login", "signup"]);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase() ?? "";
  if (!SLUG_RE.test(slug) || RESERVED.has(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  const existing = await prisma.shop.findUnique({
    where: { slug },
    select: { id: true },
  });
  return NextResponse.json({ available: !existing });
}

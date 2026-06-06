import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { shopId, path, referrer } = await req.json();
    if (!shopId || typeof shopId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const ua = req.headers.get("user-agent") ?? "";
    const device = /mobile/i.test(ua)
      ? "mobile"
      : /tablet|ipad/i.test(ua)
        ? "tablet"
        : "desktop";
    const country = req.headers.get("cf-ipcountry") ?? undefined;

    // Fire-and-forget; never block.
    prisma.pageView
      .create({ data: { shopId, path: String(path ?? "/"), device, country, referrer } })
      .catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

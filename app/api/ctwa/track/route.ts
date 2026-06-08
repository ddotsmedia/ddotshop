export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TrackSchema = z.object({
  shopId: z.string().min(1),
  utmSource: z.string().min(1),
});

// Public, no auth — called from storefront/redirect on WhatsApp click.
// Fire-and-forget: always returns ok quickly.
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) {
      // Invalid payload — still return ok, never block the storefront
      return NextResponse.json({ ok: true });
    }
    const { shopId, utmSource } = parsed.data;

    // Increment clicks — no-op if campaign doesn't exist (updateMany returns count: 0)
    prisma.cTWACampaign
      .updateMany({
        where: { shopId, utmSource },
        data: { clicks: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface errors to the caller
    return NextResponse.json({ ok: true });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateGiftCard } from "@/lib/gift-card";

const Body = z.object({
  code: z.string().min(1),
  shopId: z.string(),
  amount: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ valid: false }, { status: 400 });
  const { code, shopId, amount } = parsed.data;
  const result = await validateGiftCard(code, shopId, amount);
  const applied = result.valid ? Math.min(result.balance ?? 0, amount) : 0;
  return NextResponse.json({ ...result, applied });
}

import { NextRequest, NextResponse } from "next/server";
import { ValidateDiscountSchema } from "@/lib/validations";
import { evaluateDiscount } from "@/lib/discounts";

export async function POST(req: NextRequest) {
  const parsed = ValidateDiscountSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ valid: false, discountAmount: 0 }, { status: 400 });
  }
  const { code, shopId, orderTotal } = parsed.data;
  const result = await evaluateDiscount(shopId, code, orderTotal);
  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/session";
import { waQueue, JOBS } from "@/lib/queue";

const Patch = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let ctx;
  try {
    ctx = await requireShop();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.preOrder.findFirst({
    where: { id: params.id, shopId: ctx.shopId },
    select: { id: true, customerPhone: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const pre = await prisma.preOrder.update({ where: { id: params.id }, data: { status: parsed.data.status } });

  if (parsed.data.status === "READY") {
    waQueue
      .add(JOBS.GENERIC_WA, { phone: existing.customerPhone, message: "🎉 Your pre-order is ready! Come pick it up or confirm delivery." })
      .catch(() => {});
  }
  return NextResponse.json({ preOrder: pre });
}

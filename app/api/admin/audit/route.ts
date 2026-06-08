export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }
  void admin;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(sp.get("limit") ?? 50)));

  const [actions, total] = await Promise.all([
    prisma.adminAction.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminAction.count(),
  ]);

  return NextResponse.json({ actions, total, page, totalPages: Math.ceil(total / limit) });
}
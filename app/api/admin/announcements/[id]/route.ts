export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  const ann = await prisma.platformAnnouncement.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!ann) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.platformAnnouncement.update({
    where: { id },
    data: { isActive: false },
  });

  await logAdminAction({
    adminId: admin.adminId,
    action: "DELETE_ANNOUNCEMENT",
    targetType: "PlatformAnnouncement",
    targetId: id,
    details: {},
    ip: clientIp(req),
  });

  return NextResponse.json({ success: true });
}
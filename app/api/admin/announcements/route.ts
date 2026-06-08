export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";
import { z } from "zod";

const CreateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1),
  type: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  expiresAt: z.string().datetime().optional().nullable(),
});

// GET is public — no requireSuperAdmin
export async function GET(req: NextRequest) {
  void req;
  const now = new Date();
  const announcements = await prisma.platformAnnouncement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }

  const parsed = CreateAnnouncementSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { title, body, type, expiresAt } = parsed.data;

  const announcement = await prisma.platformAnnouncement.create({
    data: {
      title,
      body,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await logAdminAction({
    adminId: admin.adminId,
    action: "CREATE_ANNOUNCEMENT",
    targetType: "PlatformAnnouncement",
    targetId: announcement.id,
    details: { title, type },
    ip: clientIp(req),
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

function generatePassword(length = 8): string {
  // Use randomBytes for cryptographically secure generation
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i]! % chars.length];
  }
  return out;
}

export async function POST(
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

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const temporaryPassword = generatePassword(8);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await logAdminAction({
    adminId: admin.adminId,
    action: "RESET_PASSWORD",
    targetType: "User",
    targetId: id,
    details: { targetEmail: user.email },
    ip: clientIp(req),
  });

  return NextResponse.json({ temporaryPassword });
}
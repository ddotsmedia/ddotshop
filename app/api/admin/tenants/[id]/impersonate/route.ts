export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";
import { createHmac } from "node:crypto";

/** Minimal compact JWT signed with HMAC-SHA256. */
function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expSeconds: number,
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const now = Math.floor(Date.now() / 1000);
  const claims = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + expSeconds }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret)
    .update(`${header}.${claims}`)
    .digest("base64url");
  return `${header}.${claims}.${sig}`;
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
    select: { id: true, role: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET not configured" }, { status: 500 });
  }

  const token = signJwt(
    { sub: user.id, role: "TENANT", imp: admin.adminId },
    secret,
    15 * 60, // 15 minutes
  );

  await logAdminAction({
    adminId: admin.adminId,
    action: "IMPERSONATE_TENANT",
    targetType: "User",
    targetId: id,
    details: { targetEmail: user.email },
    ip: clientIp(req),
  });

  return NextResponse.json({ token });
}
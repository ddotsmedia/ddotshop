import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export interface AdminContext {
  adminId: string;
  email: string;
}

/**
 * Throws a 403 Response if the caller is not a SUPER_ADMIN.
 * Use at the top of every /api/admin handler.
 */
export async function requireSuperAdmin(): Promise<AdminContext> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  return { adminId: session.user.id, email: session.user.email ?? "" };
}

/** Best-effort client IP from forwarding headers. */
export function clientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined
  );
}

/** Append an immutable audit-log entry. Never throws. */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: unknown;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.adminAction.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        details: (params.details ?? undefined) as never,
        ip: params.ip ?? null,
      },
    });
  } catch {
    /* audit logging must never break the request */
  }
}

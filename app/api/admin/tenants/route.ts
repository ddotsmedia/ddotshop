export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateTenantSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  plan: z.enum(["STARTER", "GROWTH", "PRO", "AGENCY"]).default("STARTER"),
});

function randomPassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  // use Math.random for password generation — crypto not needed here (server side, single use)
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

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
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const search = sp.get("search") ?? "";

  const where = {
    role: "TENANT",
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { orders: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }

  const parsed = CreateTenantSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, email, plan } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const temporaryPassword = randomPassword(10);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "TENANT",
      createdByAdmin: true,
      tenant: {
        create: { name, plan },
      },
    },
    include: { tenant: true },
  });

  await logAdminAction({
    adminId: admin.adminId,
    action: "CREATE_TENANT",
    targetType: "User",
    targetId: user.id,
    details: { email, plan },
    ip: clientIp(req),
  });

  return NextResponse.json({ user, temporaryPassword }, { status: 201 });
}
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction, clientIp } from "@/lib/admin-guard";
import { z } from "zod";

const PatchTenantSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  adminNotes: z.string().optional(),
  plan: z.enum(["STARTER", "GROWTH", "PRO", "AGENCY"]).optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return e as Response;
  }
  void admin;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tenant: {
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              isPublished: true,
              isVerified: true,
              currency: true,
              region: true,
              createdAt: true,
              _count: { select: { orders: true, products: true, customers: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shopId = user.tenant?.shop?.id;

  const [recentOrders, orderCount, revenueResult] = await Promise.all([
    shopId
      ? prisma.order.findMany({
          where: { shopId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            customerName: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    shopId ? prisma.order.count({ where: { shopId } }) : Promise.resolve(0),
    shopId
      ? prisma.order.findMany({
          where: { shopId, paymentStatus: "PAID" },
          select: { total: true },
        })
      : Promise.resolve([]),
  ]);

  const revenue = revenueResult.reduce((sum, o) => sum + Number(o.total), 0);

  return NextResponse.json({
    user,
    recentOrders,
    stats: { orderCount, revenue },
  });
}

export async function PATCH(
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

  const parsed = PatchTenantSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, tenant: { select: { id: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userUpdate: Record<string, unknown> = {};
  if (data.adminNotes !== undefined) userUpdate.adminNotes = data.adminNotes;
  if (data.isSuspended !== undefined) {
    userUpdate.isSuspended = data.isSuspended;
    if (data.isSuspended) {
      userUpdate.suspendedAt = new Date();
      userUpdate.suspendedReason = data.suspendedReason ?? "Suspended by admin";
    } else {
      userUpdate.suspendedAt = null;
      userUpdate.suspendedReason = null;
    }
  }
  if (data.name !== undefined) userUpdate.name = data.name;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: userUpdate,
  });

  if ((data.plan !== undefined || data.name !== undefined) && user.tenant?.id) {
    const tenantUpdate: Record<string, unknown> = {};
    if (data.plan !== undefined) tenantUpdate.plan = data.plan;
    if (data.name !== undefined) tenantUpdate.name = data.name;
    await prisma.tenant.update({ where: { id: user.tenant.id }, data: tenantUpdate });
  }

  await logAdminAction({
    adminId: admin.adminId,
    action: "UPDATE_TENANT",
    targetType: "User",
    targetId: id,
    details: data,
    ip: clientIp(req),
  });

  return NextResponse.json({ user: updatedUser });
}

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

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: {
      isSuspended: true,
      suspendedAt: new Date(),
      suspendedReason: "deleted by admin",
    },
  });

  await logAdminAction({
    adminId: admin.adminId,
    action: "DELETE_TENANT",
    targetType: "User",
    targetId: id,
    details: { softDelete: true },
    ip: clientIp(req),
  });

  return NextResponse.json({ success: true });
}
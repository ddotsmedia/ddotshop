"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  LogIn,
  Ban,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface TenantDetail {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedReason: string | null;
    lastLoginAt: string | null;
    loginCount: number;
    adminNotes: string | null;
    createdAt: string;
    tenant: {
      id: string;
      name: string;
      plan: string;
      shop: {
        id: string;
        name: string;
        slug: string;
        isPublished: boolean;
        isVerified: boolean;
        currency: string;
        region: string;
        createdAt: string;
        _count: { orders: number; products: number; customers: number };
      } | null;
    } | null;
  };
  recentOrders: {
    id: string;
    customerName: string;
    total: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
  stats: { orderCount: number; revenue: number };
}

const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  GROWTH: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [resetPwd, setResetPwd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/tenants/${id}`);
    if (res.ok) {
      const d = (await res.json()) as TenantDetail;
      setData(d);
      setAdminNotes(d.user.adminNotes ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveNotes() {
    setSavingNotes(true);
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes }),
    });
    setSavingNotes(false);
    if (res.ok) {
      toast({ title: "Notes saved", variant: "success" });
    } else {
      toast({ title: "Failed to save notes", variant: "danger" });
    }
  }

  async function handleResetPassword() {
    const res = await fetch(`/api/admin/tenants/${id}/reset-password`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setResetPwd(d.temporaryPassword as string);
    } else {
      toast({ title: "Failed to reset password", variant: "danger" });
    }
  }

  async function handleImpersonate() {
    const res = await fetch(`/api/admin/tenants/${id}/impersonate`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      toast({
        title: "Impersonation token generated",
        description: `Token: ${(d.token as string).slice(0, 40)}…`,
        variant: "success",
      });
    } else {
      toast({ title: "Impersonation failed", variant: "danger" });
    }
  }

  async function handleSuspend() {
    if (!data) return;
    const willSuspend = !data.user.isSuspended;
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isSuspended: willSuspend,
        suspendedReason: willSuspend ? "Suspended by admin" : undefined,
      }),
    });
    if (res.ok) {
      toast({
        title: willSuspend ? "Tenant suspended" : "Tenant unsuspended",
        variant: "success",
      });
      void load();
    } else {
      toast({ title: "Action failed", variant: "danger" });
    }
  }

  async function handleDelete() {
    if (!confirm("Soft-delete this tenant? They will be suspended.")) return;
    const res = await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Tenant removed", variant: "success" });
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  async function copyPwd() {
    if (!resetPwd) return;
    await navigator.clipboard.writeText(resetPwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  type OrderRow = TenantDetail["recentOrders"][number];
  const orderColumns: Column<OrderRow>[] = [
    { key: "customerName", label: "Customer", render: (o) => o.customerName },
    {
      key: "total",
      label: "Total",
      render: (o) => `$${Number(o.total).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">{o.status}</span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (o) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {o.paymentStatus}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (o) => new Date(o.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[#6b7280]">Loading tenant…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-danger">Tenant not found.</p>
      </div>
    );
  }

  const { user, recentOrders, stats } = data;
  const plan = user.tenant?.plan ?? "STARTER";

  return (
    <div>
      <PageHeader title={user.name ?? user.email} subtitle="Tenant detail">
        <Link href="/admin-panel/tenants">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[#374151]">Profile</h3>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-lg font-bold text-red-600">
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#111827]">{user.name ?? "(no name)"}</p>
              <p className="text-sm text-[#6b7280]">{user.email}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6b7280]">Joined</dt>
              <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#6b7280]">Last login</dt>
              <dd className="font-medium">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#6b7280]">Login count</dt>
              <dd className="font-medium">{user.loginCount}</dd>
            </div>
          </dl>
        </div>

        {/* Status card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[#374151]">Status</h3>
          <div className="mb-3">
            {user.isSuspended ? (
              <Badge variant="danger">Suspended</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
          {user.isSuspended && (
            <div className="mt-2 space-y-1 text-sm">
              {user.suspendedAt && (
                <p className="text-[#6b7280]">
                  Since: {new Date(user.suspendedAt).toLocaleDateString()}
                </p>
              )}
              {user.suspendedReason && (
                <p className="text-[#6b7280]">Reason: {user.suspendedReason}</p>
              )}
            </div>
          )}
          <div className="mt-4">
            <Label htmlFor="adminNotes" className="text-xs">Admin Notes</Label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Private notes…"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 bg-red-600 text-white hover:bg-red-700"
            >
              {savingNotes ? "Saving…" : "Save Notes"}
            </Button>
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[#374151]">Plan & Stats</h3>
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded px-3 py-1 text-sm font-semibold ${PLAN_BADGE[plan]}`}>
              {plan}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total orders</span>
              <span className="font-semibold">{stats.orderCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Revenue</span>
              <span className="font-semibold">${stats.revenue.toFixed(2)}</span>
            </div>
            {user.tenant?.shop && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Products</span>
                  <span className="font-semibold">{user.tenant.shop._count.products}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Customers</span>
                  <span className="font-semibold">{user.tenant.shop._count.customers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Shop slug</span>
                  <span className="font-medium text-[#374151]">{user.tenant.shop.slug}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#374151]">Recent Orders</h3>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          emptyMessage="No orders yet."
        />
      </div>

      {/* Reset password result */}
      {resetPwd && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-sm font-semibold text-green-800">New temporary password:</p>
          <div className="flex items-center gap-2">
            <Input value={resetPwd} readOnly className="max-w-xs font-mono" />
            <Button size="icon" variant="secondary" onClick={copyPwd}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-xs text-green-700">Shown once — share securely.</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-4 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-red-600">Danger Zone</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleResetPassword}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <KeyRound className="h-4 w-4" /> Reset Password
          </Button>
          <Button
            onClick={handleImpersonate}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <LogIn className="h-4 w-4" /> Impersonate
          </Button>
          <Button
            onClick={handleSuspend}
            variant="secondary"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Ban className="h-4 w-4" />{" "}
            {user.isSuspended ? "Unsuspend" : "Suspend"}
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
          >
            <Trash2 className="h-4 w-4" /> Delete Tenant
          </Button>
        </div>
      </div>
    </div>
  );
}

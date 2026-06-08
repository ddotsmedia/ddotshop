"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  KeyRound,
  LogIn,
  Ban,
  Trash2,
} from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface TenantUser {
  id: string;
  name: string | null;
  email: string;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: {
    plan: string;
    shop: {
      id: string;
      name: string;
      slug: string;
      _count: { orders: number };
    } | null;
  } | null;
}

const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  GROWTH: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

function initials(name: string | null, email: string) {
  const src = name ?? email;
  return src.slice(0, 2).toUpperCase();
}

export default function TenantsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/tenants?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleResetPassword(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/tenants/${id}/reset-password`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      toast({
        title: "Password reset",
        description: `Temporary password: ${d.temporaryPassword}`,
        variant: "success",
      });
    } else {
      toast({ title: "Failed to reset password", variant: "danger" });
    }
  }

  async function handleImpersonate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/tenants/${id}/impersonate`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      toast({
        title: "Impersonation token generated",
        description: `Token: ${d.token.slice(0, 30)}…`,
        variant: "success",
      });
    } else {
      toast({ title: "Impersonation failed", variant: "danger" });
    }
  }

  async function handleSuspend(user: TenantUser, e: React.MouseEvent) {
    e.stopPropagation();
    const willSuspend = !user.isSuspended;
    const res = await fetch(`/api/admin/tenants/${user.id}`, {
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Soft-delete this tenant? They will be suspended.")) return;
    const res = await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Tenant removed", variant: "success" });
      void load();
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  const columns: Column<TenantUser>[] = [
    {
      key: "avatar",
      label: "",
      className: "w-12",
      render: (u) => (
        <div className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
          {initials(u.name, u.email)}
        </div>
      ),
    },
    {
      key: "name",
      label: "Name / Email",
      render: (u) => (
        <div>
          <p className="font-medium text-[#111827]">{u.name ?? "(no name)"}</p>
          <p className="text-xs text-[#6b7280]">{u.email}</p>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (u) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${PLAN_BADGE[u.tenant?.plan ?? "STARTER"]}`}
        >
          {u.tenant?.plan ?? "—"}
        </span>
      ),
    },
    {
      key: "shops",
      label: "Shop",
      render: (u) => u.tenant?.shop?.name ?? <span className="text-[#9ca3af]">None</span>,
    },
    {
      key: "orders",
      label: "Orders",
      render: (u) => u.tenant?.shop?._count.orders ?? 0,
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (u) =>
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : <span className="text-[#9ca3af]">Never</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (u) =>
        u.isSuspended ? (
          <Badge variant="danger">Suspended</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[200px]",
      render: (u) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin-panel/tenants/${u.id}`}>
            <Button size="icon" variant="ghost" title="View">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            title="Reset Password"
            onClick={(e) => handleResetPassword(u.id, e)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Impersonate"
            onClick={(e) => handleImpersonate(u.id, e)}
          >
            <LogIn className="h-4 w-4 text-amber-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={u.isSuspended ? "Unsuspend" : "Suspend"}
            onClick={(e) => handleSuspend(u, e)}
          >
            <Ban className={`h-4 w-4 ${u.isSuspended ? "text-green-600" : "text-orange-500"}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete"
            onClick={(e) => handleDelete(u.id, e)}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tenants" subtitle={`${total} total tenants`}>
        <Link href="/admin-panel/tenants/new">
          <Button className="bg-red-600 text-white hover:bg-red-700">
            <Plus className="h-4 w-4" /> New Tenant
          </Button>
        </Link>
      </PageHeader>

      {/* Stats bar */}
      <div className="mb-4 flex gap-4">
        <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm">
          <span className="text-[#6b7280]">Total: </span>
          <span className="font-semibold">{total}</span>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm">
          <span className="text-[#6b7280]">Showing page </span>
          <span className="font-semibold">{page}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            placeholder="Search tenants…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No tenants found."
        onRowClick={(u) => router.push(`/admin-panel/tenants/${u.id}`)}
      />

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[#6b7280]">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

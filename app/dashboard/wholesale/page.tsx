"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Phone, Check, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface WholesaleCustomer {
  id: string;
  customerPhone: string;
  customerName: string | null;
  company: string | null;
  isApproved: boolean;
  discountPct: string | number;
  createdAt: string;
}

export default function WholesalePage() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");

  // Approve dialog state
  const [approveTarget, setApproveTarget] = useState<WholesaleCustomer | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [approving, setApproving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<WholesaleCustomer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    const res = await fetch(`/api/wholesale?${params}`);
    const data = (await res.json()) as { customers?: WholesaleCustomer[] };
    setCustomers(
      (data.customers ?? []).map((c) => ({
        ...c,
        discountPct: Number(c.discountPct),
      })),
    );
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  function openApprove(c: WholesaleCustomer) {
    setApproveTarget(c);
    setDiscountInput(String(Number(c.discountPct) || ""));
  }

  async function submitApprove() {
    if (!approveTarget) return;
    const pct = parseFloat(discountInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Enter a valid discount (0–100)", variant: "danger" });
      return;
    }
    setApproving(true);
    const res = await fetch(`/api/wholesale/${approveTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true, discountPct: pct }),
    });
    setApproving(false);
    setApproveTarget(null);
    if (res.ok) {
      toast({ title: "Customer approved", variant: "success" });
      load();
    } else {
      toast({ title: "Approval failed", variant: "danger" });
    }
  }

  async function rejectCustomer(c: WholesaleCustomer) {
    const res = await fetch(`/api/wholesale/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: false }),
    });
    if (res.ok) {
      toast({ title: "Customer set to pending", variant: "success" });
      load();
    } else {
      toast({ title: "Update failed", variant: "danger" });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/wholesale/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      toast({ title: "Customer removed", variant: "success" });
      load();
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  const columns: Column<WholesaleCustomer>[] = [
    {
      key: "company",
      label: "Company / Name",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-[#6b7280]">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium leading-tight">{c.company ?? c.customerName ?? "—"}</p>
            {c.company && c.customerName && (
              <p className="text-xs text-[#6b7280]">{c.customerName}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (c) => (
        <span className="flex items-center gap-1 text-sm text-[#6b7280]">
          <Phone className="h-3.5 w-3.5" />
          {c.customerPhone}
        </span>
      ),
    },
    {
      key: "discountPct",
      label: "Discount %",
      render: (c) =>
        Number(c.discountPct) > 0 ? (
          <span className="font-semibold text-wa-green">{Number(c.discountPct)}%</span>
        ) : (
          <span className="text-[#9ca3af]">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (c) =>
        c.isApproved ? (
          <Badge variant="success">Approved</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        ),
    },
    {
      key: "createdAt",
      label: "Applied",
      render: (c) => <span className="text-sm text-[#6b7280]">{formatDate(c.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (c) => (
        <div className="flex items-center gap-1">
          {!c.isApproved ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openApprove(c);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-wa-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-wa-dark transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                rejectCustomer(c);
              }}
            >
              <X className="h-3.5 w-3.5" />
              Revoke
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(c);
            }}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  const displayName = (c: WholesaleCustomer) => c.company ?? c.customerName ?? c.customerPhone;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wholesale"
        subtitle="Manage B2B customers and wholesale discount approvals"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6b7280]">Total applications</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "—" : customers.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6b7280]">Approved</p>
          <p className="mt-1 text-2xl font-bold text-wa-green">
            {loading ? "—" : customers.filter((c) => c.isApproved).length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6b7280]">Pending review</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {loading ? "—" : customers.filter((c) => !c.isApproved).length}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No wholesale applications yet."
      />

      {/* Approve dialog */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(o) => {
          if (!o) setApproveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Approve {approveTarget ? displayName(approveTarget) : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280]">
            Set a wholesale discount percentage for this customer. They will receive this
            discount on all eligible orders.
          </p>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              Discount %
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder="e.g. 15"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="max-w-[120px]"
                autoFocus
              />
              <span className="text-sm text-[#6b7280]">% off all products</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveTarget(null)}>
              Cancel
            </Button>
            <button
              disabled={approving}
              onClick={submitApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-wa-green px-5 py-2.5 font-semibold text-white hover:bg-wa-dark disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              {approving ? "Approving…" : "Approve"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove wholesale customer?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280]">
            <strong>{deleteTarget ? displayName(deleteTarget) : ""}</strong> will be removed
            from the wholesale programme. This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

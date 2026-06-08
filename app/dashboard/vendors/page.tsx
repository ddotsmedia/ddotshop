"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Store,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commissionPct: string | number;
  payoutAccount: string | null;
  isActive: boolean;
  _count: { products: number };
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  commissionPct: string;
  payoutAccount: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  commissionPct: "",
  payoutAccount: "",
};

// ─── Upgrade empty-state ────────────────────────────────────────────────────

function UpgradeCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center gap-4">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-500">
        <Store className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#111827]">Agency Plan Required</h3>
        <p className="mt-1 max-w-sm text-sm text-[#6b7280]">
          Multi-vendor marketplace is an Agency plan feature. Upgrade to manage
          vendors, track commission, and run a marketplace from your shop.
        </p>
      </div>
      <a href="/dashboard/settings?tab=billing">
        <Button>
          Upgrade to Agency <ArrowUpRight className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}

// ─── Form fields helper ────────────────────────────────────────────────────

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#374151]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // toggle active loading ids
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vendors");
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { vendors?: Vendor[] };
    setVendors(data.vendors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Open / close modal ───────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditingId(v.id);
    setForm({
      name: v.name,
      email: v.email ?? "",
      phone: v.phone ?? "",
      commissionPct: String(Number(v.commissionPct)),
      payoutAccount: v.payoutAccount ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // ── Save (create / update) ────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Vendor name is required", variant: "danger" });
      return;
    }
    const pct = parseFloat(form.commissionPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Commission must be 0–100", variant: "danger" });
      return;
    }

    const body = {
      name: form.name.trim(),
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
      commissionPct: pct,
      ...(form.payoutAccount.trim() && { payoutAccount: form.payoutAccount.trim() }),
    };

    setSaving(true);
    const url = editingId ? `/api/vendors/${editingId}` : "/api/vendors";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      toast({
        title: editingId ? "Vendor updated" : "Vendor added",
        variant: "success",
      });
      closeModal();
      void load();
    } else {
      const err = (await res.json()) as { error?: string };
      toast({ title: err.error ?? "Save failed", variant: "danger" });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/vendors/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) {
      toast({ title: "Vendor deleted", variant: "success" });
      void load();
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  async function toggleActive(v: Vendor) {
    setTogglingIds((prev) => new Set(prev).add(v.id));
    const res = await fetch(`/api/vendors/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
    if (res.ok) {
      void load();
    } else {
      toast({ title: "Update failed", variant: "danger" });
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      label: "Name",
      render: (v) => <span className="font-medium text-[#111827]">{v.name}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (v) =>
        v.email ? (
          <span className="text-[#374151]">{v.email}</span>
        ) : (
          <span className="text-[#9ca3af]">—</span>
        ),
    },
    {
      key: "products",
      label: "Products",
      render: (v) => (
        <span className="font-medium tabular-nums">{v._count.products}</span>
      ),
    },
    {
      key: "commissionPct",
      label: "Commission %",
      render: (v) => (
        <span className="tabular-nums">{Number(v.commissionPct).toFixed(2)}%</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleActive(v);
          }}
          disabled={togglingIds.has(v.id)}
          className="cursor-pointer disabled:opacity-50"
          title={v.isActive ? "Click to deactivate" : "Click to activate"}
        >
          {v.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="muted">Inactive</Badge>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24",
      render: (v) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(v);
            }}
            title="Edit vendor"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(v.id);
            }}
            title="Delete vendor"
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loading && forbidden) {
    return (
      <div>
        <PageHeader title="Vendors" subtitle="Multi-vendor marketplace" />
        <UpgradeCard />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage your marketplace vendors">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        emptyMessage="No vendors yet."
        emptyAction={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add your first vendor
          </Button>
        }
      />

      {/* ── Add / Edit modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <FormField label="Vendor Name" required>
              <Input
                placeholder="e.g. Sunrise Textiles"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                placeholder="vendor@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormField>

            <FormField label="Phone">
              <Input
                placeholder="+971 50 000 0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormField>

            <FormField label="Commission %" required>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="0.00"
                value={form.commissionPct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, commissionPct: e.target.value }))
                }
              />
            </FormField>

            <FormField label="Payout Account">
              <Input
                placeholder="Bank account / UPI / IBAN"
                value={form.payoutAccount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, payoutAccount: e.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete vendor?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280]">
            The vendor will be removed. Products assigned to this vendor will be
            unlinked but not deleted.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

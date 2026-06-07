"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Send, Upload, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Flow {
  id: string;
  name: string;
  type: string;
  published: boolean;
  createdAt: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [plan, setPlan] = useState("STARTER");
  const [loading, setLoading] = useState(true);
  const [sendId, setSendId] = useState<string | null>(null);
  const [phone, setPhone] = useState("+971");

  async function load() {
    setLoading(true);
    const d = await fetch("/api/flows").then((r) => r.json());
    setFlows(d.flows ?? []);
    setPlan(d.plan ?? "STARTER");
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function publish(id: string) {
    const res = await fetch(`/api/flows/${id}/publish`, { method: "POST" });
    if (res.ok) {
      toast({ title: "Flow published", variant: "success" });
      load();
    } else toast({ title: "Publish failed", variant: "danger" });
  }

  async function sendTest() {
    if (!sendId) return;
    const res = await fetch(`/api/flows/${sendId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerPhone: phone }),
    });
    setSendId(null);
    if (res.ok) toast({ title: "Test flow queued", variant: "success" });
    else {
      const e = await res.json().catch(() => ({}));
      toast({ title: e.error ?? "Send failed", variant: "danger" });
    }
  }

  const allowed = plan === "PRO" || plan === "AGENCY";

  const columns: Column<Flow>[] = [
    { key: "name", label: "Flow", render: (f) => <span className="font-medium">{f.name}</span> },
    { key: "type", label: "Type", render: (f) => <Badge variant="info">{f.type}</Badge> },
    {
      key: "published",
      label: "Status",
      render: (f) => <Badge variant={f.published ? "success" : "muted"}>{f.published ? "Published" : "Draft"}</Badge>,
    },
    { key: "createdAt", label: "Created", render: (f) => formatDate(f.createdAt) },
    {
      key: "actions",
      label: "",
      render: (f) => (
        <div className="flex gap-1">
          {!f.published && (
            <Button size="sm" variant="secondary" onClick={() => publish(f.id)}>
              <Upload className="h-3.5 w-3.5" /> Publish
            </Button>
          )}
          {f.published && (
            <Button size="sm" onClick={() => setSendId(f.id)}>
              <Send className="h-3.5 w-3.5" /> Test
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="WhatsApp Flows" subtitle="In-chat checkout, booking & surveys">
        <Link href="/dashboard/whatsapp/flows/new">
          <Button>
            <Plus className="h-4 w-4" /> New flow
          </Button>
        </Link>
      </PageHeader>

      {!allowed && (
        <Card className="mb-4 border-l-4 border-l-warning">
          <CardContent className="text-sm text-[#6b7280]">
            WhatsApp Flows require the <strong>Pro</strong> or <strong>Agency</strong> plan.
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} data={flows} loading={loading} emptyMessage="No flows yet." />

      <Dialog open={!!sendId} onOpenChange={(o) => !o && setSendId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test flow</DialogTitle>
          </DialogHeader>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971…" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSendId(null)}>Cancel</Button>
            <Button onClick={sendTest}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

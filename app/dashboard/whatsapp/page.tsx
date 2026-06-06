"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Broadcast {
  id: string;
  name: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "muted" | "info" | "warning" | "success" | "danger"> = {
  DRAFT: "muted",
  SCHEDULED: "info",
  SENDING: "warning",
  SENT: "success",
  FAILED: "danger",
};

export default function WhatsAppPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [plan, setPlan] = useState("STARTER");
  const [shop, setShop] = useState<{ whatsappNumber: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [b, s] = await Promise.all([
      fetch("/api/broadcasts").then((r) => r.json()),
      fetch("/api/shop").then((r) => r.json()),
    ]);
    setBroadcasts(b.broadcasts ?? []);
    setPlan(b.plan ?? "STARTER");
    setShop(s.shop ?? null);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function send(id: string) {
    const res = await fetch(`/api/broadcasts/${id}/send`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `Queued to ${data.queued} customers`, variant: "success" });
      load();
    } else {
      toast({ title: data.error ?? "Send failed", variant: "danger" });
    }
  }

  const columns: Column<Broadcast>[] = [
    { key: "name", label: "Campaign", render: (b) => <span className="font-medium">{b.name}</span> },
    { key: "targetCount", label: "Target" },
    { key: "sentCount", label: "Sent" },
    { key: "failedCount", label: "Failed" },
    {
      key: "status",
      label: "Status",
      render: (b) => <Badge variant={STATUS_VARIANT[b.status] ?? "muted"}>{b.status}</Badge>,
    },
    { key: "createdAt", label: "Created", render: (b) => formatDate(b.createdAt) },
    {
      key: "actions",
      label: "",
      render: (b) =>
        b.status === "DRAFT" || b.status === "SCHEDULED" ? (
          <Button size="sm" onClick={() => send(b.id)}>
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Broadcast campaigns to your customers">
        <Link href="/dashboard/whatsapp/new">
          <Button>
            <Plus className="h-4 w-4" /> New broadcast
          </Button>
        </Link>
      </PageHeader>

      <Tabs defaultValue="broadcasts">
        <TabsList>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts">
          {plan !== "PRO" && plan !== "AGENCY" && (
            <Card className="mb-4 border-l-4 border-l-warning">
              <CardContent className="text-sm text-[#6b7280]">
                Broadcasts require the <strong>Pro</strong> or <strong>Agency</strong> plan.{" "}
                <Link href="/dashboard/settings/billing" className="font-semibold text-wa-dark">
                  Upgrade →
                </Link>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={columns}
            data={broadcasts}
            loading={loading}
            emptyMessage="No broadcasts yet."
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="space-y-3">
              <CardTitle>WhatsApp Business</CardTitle>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Business number</span>
                <span className="font-medium">{shop?.whatsappNumber ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">WABA status</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Message templates sync from Twilio (coming soon).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

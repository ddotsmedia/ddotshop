"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function NewBroadcastPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name || !message) return;
    setSaving(true);
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        message,
        scheduledAt: when === "later" && scheduledAt ? scheduledAt : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: data.error ?? "Failed", variant: "danger" });
      return;
    }
    toast({ title: "Broadcast saved", variant: "success" });
    router.push("/dashboard/whatsapp");
    router.refresh();
  }

  return (
    <div>
      <Link href="/dashboard/whatsapp" className="mb-4 inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="New broadcast" subtitle="Compose a WhatsApp campaign" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <Label>Campaign name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Eid Sale 2026" />
              </div>
              <div>
                <Label>Message ({message.length}/1000)</Label>
                <Textarea
                  rows={6}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! 🎉 Big sale this weekend…"
                />
              </div>
              <div>
                <Label>Schedule</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={when === "now"} onChange={() => setWhen("now")} className="accent-wa-green" />
                    Send now
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={when === "later"} onChange={() => setWhen("later")} className="accent-wa-green" />
                    Schedule
                  </label>
                </div>
                {when === "later" && (
                  <Input
                    type="datetime-local"
                    className="mt-2 max-w-xs"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving || !name || !message}>
                  {saving ? "Saving…" : "Save broadcast"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <CardTitle className="mb-3">Preview</CardTitle>
            <div className="rounded-lg bg-[#e5ddd5] p-4">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-wa-light p-2 text-sm shadow-sm">
                {message || "Your message preview…"}
                <span className="mt-1 block text-right text-[10px] text-[#667781]">12:00 ✓✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

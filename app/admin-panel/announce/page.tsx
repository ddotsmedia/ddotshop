"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

const TYPE_STYLES: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("INFO");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    if (res.ok) {
      const d = await res.json();
      setAnnouncements(d.announcements ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        type,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Announcement created", variant: "success" });
      setTitle("");
      setBody("");
      setType("INFO");
      setExpiresAt("");
      setShowForm(false);
      void load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Failed to create announcement",
        description: (err as { error?: string }).error ?? "Unknown error",
        variant: "danger",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this announcement?")) return;
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Announcement removed", variant: "success" });
      void load();
    } else {
      toast({ title: "Failed to remove announcement", variant: "danger" });
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Broadcast platform-wide messages">
        <Button
          className="bg-red-600 text-white hover:bg-red-700"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </PageHeader>

      {/* New announcement form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#374151]">New Announcement</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Scheduled maintenance at…"
                />
              </div>
              <div>
                <Label htmlFor="ann-body">Body</Label>
                <textarea
                  id="ann-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Full announcement text…"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="ann-expires">Expires At (optional)</Label>
                  <Input
                    id="ann-expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {submitting ? "Publishing…" : "Publish"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>

            {/* Live preview */}
            <div>
              <p className="mb-2 text-xs font-medium text-[#6b7280]">Live Preview</p>
              <div
                className={`rounded-xl border p-4 ${
                  type === "CRITICAL"
                    ? "border-red-200 bg-red-50"
                    : type === "WARNING"
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Megaphone
                    className={`h-4 w-4 ${
                      type === "CRITICAL"
                        ? "text-red-600"
                        : type === "WARNING"
                        ? "text-amber-600"
                        : "text-blue-600"
                    }`}
                  />
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[type]}`}
                  >
                    {type}
                  </span>
                </div>
                <h4
                  className={`font-semibold ${
                    type === "CRITICAL"
                      ? "text-red-800"
                      : type === "WARNING"
                      ? "text-amber-800"
                      : "text-blue-800"
                  }`}
                >
                  {title || "Title will appear here"}
                </h4>
                <p
                  className={`mt-1 text-sm ${
                    type === "CRITICAL"
                      ? "text-red-700"
                      : type === "WARNING"
                      ? "text-amber-700"
                      : "text-blue-700"
                  }`}
                >
                  {body || "Body text will appear here…"}
                </p>
                {expiresAt && (
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Expires: {new Date(expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-[#9ca3af]" />
          <p className="text-[#6b7280]">No active announcements.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
            >
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[ann.type]}`}>
                    {ann.type}
                  </span>
                  <span className="text-xs text-[#9ca3af]">
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                  {ann.expiresAt && (
                    <span className="text-xs text-[#9ca3af]">
                      Expires: {new Date(ann.expiresAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-[#111827]">{ann.title}</h4>
                <p className="mt-1 text-sm text-[#6b7280]">{ann.body}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(ann.id)}
                className="shrink-0 text-danger hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

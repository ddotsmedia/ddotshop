"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  UserCheck,
  UserMinus,
  Star,
  ShoppingCart,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Segment {
  key: string;
  label: string;
  count: number;
  customerIds: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WA_GREEN = "#25D366";

const SEGMENT_META: Record<
  string,
  { icon: React.ReactNode; description: string; color: string }
> = {
  "first-time": {
    icon: <Users className="h-5 w-5" />,
    description: "Customers who have placed only one order — prime for a welcome re-engagement.",
    color: "text-blue-600",
  },
  repeat: {
    icon: <UserCheck className="h-5 w-5" />,
    description: "Loyal customers with two or more orders — your most valuable audience.",
    color: "text-green-600",
  },
  lapsed: {
    icon: <UserMinus className="h-5 w-5" />,
    description: "Haven't ordered in 60+ days — a win-back campaign can recover them.",
    color: "text-orange-600",
  },
  "high-value": {
    icon: <Star className="h-5 w-5" />,
    description: "Top 20% by lifetime spend — reward them with exclusive offers.",
    color: "text-yellow-600",
  },
  abandoners: {
    icon: <ShoppingCart className="h-5 w-5" />,
    description: "Have a pending order but never paid — nudge them to complete checkout.",
    color: "text-red-600",
  },
};

function segmentMeta(key: string) {
  return (
    SEGMENT_META[key] ?? {
      icon: <Users className="h-5 w-5" />,
      description: "Custom customer segment.",
      color: "text-gray-600",
    }
  );
}

// ─── Segment card ─────────────────────────────────────────────────────────────

function SegmentCard({
  segment,
}: {
  segment: Segment;
}) {
  const meta = segmentMeta(segment.key);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg bg-gray-50 p-2 ${meta.color}`}>{meta.icon}</div>
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ color: WA_GREEN }}
        >
          {segment.count.toLocaleString()}
        </span>
      </div>

      <div>
        <p className="font-semibold text-[#111827]">{segment.label}</p>
        <p className="mt-1 text-sm text-[#6b7280]">{meta.description}</p>
      </div>

      <Link
        href={`/dashboard/whatsapp/new?segment=${segment.key}`}
        className="mt-auto"
      >
        <Button
          size="sm"
          className="w-full text-white"
          style={{ backgroundColor: WA_GREEN }}
        >
          Broadcast to segment
        </Button>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/segment");
      if (!res.ok) throw new Error("Failed to load segments");
      const data = (await res.json()) as { segments: Segment[] };
      setSegments(data.segments ?? []);
    } catch {
      toast({ title: "Could not load segments", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function getAIInsights() {
    setInsightLoading(true);
    setInsights([]);
    try {
      const res = await fetch("/api/ai/segment", { method: "POST" });
      if (res.status === 429) {
        toast({ title: "AI quota exceeded — upgrade your plan", variant: "danger" });
        return;
      }
      if (!res.ok) throw new Error("AI request failed");
      const data = (await res.json()) as {
        segments: Segment[];
        insights: string[];
      };
      setSegments(data.segments ?? segments);
      const received = data.insights ?? [];
      if (received.length === 0) {
        toast({ title: "No insights returned — try again later", variant: "default" });
      } else {
        setInsights(received);
        toast({ title: "AI insights ready", variant: "success" });
      }
    } catch {
      toast({ title: "Could not get AI insights", variant: "danger" });
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Customer Segments" subtitle="Understand and target your customers">
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() => void getAIInsights()}
          disabled={insightLoading || loading}
          style={{ backgroundColor: WA_GREEN }}
          className="text-white"
        >
          {insightLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Get AI insights
        </Button>
      </PageHeader>

      {/* AI Insights panel */}
      {insights.length > 0 && (
        <div className="mb-6 rounded-xl border border-[#25D366]/30 bg-[#f0fdf4] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: WA_GREEN }} />
            <span className="font-semibold text-[#111827]">AI Marketing Recommendations</span>
          </div>
          <ul className="space-y-2">
            {insights.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: WA_GREEN }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Segments grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-[#6b7280]">No customers yet.</p>
          <p className="mt-1 text-xs text-[#9ca3af]">
            Segments will appear once customers start placing orders.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => (
            <SegmentCard key={seg.key} segment={seg} />
          ))}
        </div>
      )}
    </div>
  );
}

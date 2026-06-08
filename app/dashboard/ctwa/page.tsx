"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Plus,
  Megaphone,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { toast } from "@/components/ui/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  utmSource: string;
  utmMedium: string | null;
  utmCampaign: string | null;
  clicks: number;
  orders: number;
  revenue: number;
  spend: number;
  roi: number | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RoiBadge({ roi }: { roi: number | null }) {
  if (roi === null) return <span className="text-xs text-gray-400">—</span>;
  const color =
    roi >= 3
      ? "text-emerald-600 bg-emerald-50"
      : roi >= 1
        ? "text-amber-600 bg-amber-50"
        : "text-red-600 bg-red-50";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {roi.toFixed(2)}x
    </span>
  );
}

// ─── New Campaign Form ────────────────────────────────────────────────────────

interface FormState {
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  spend: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  spend: "",
};

function NewCampaignPanel({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.utmSource.trim()) {
      toast({ title: "Name and UTM Source are required", variant: "danger" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ctwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          utmSource: form.utmSource.trim(),
          utmMedium: form.utmMedium.trim() || undefined,
          utmCampaign: form.utmCampaign.trim() || undefined,
          spend: form.spend ? Number(form.spend) : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ title: err.error ?? "Failed to save campaign", variant: "danger" });
        return;
      }
      toast({ title: "Campaign saved", variant: "success" });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">New Campaign</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Campaign Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Summer Sale FB Ad"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            UTM Source <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.utmSource}
            onChange={(e) => set("utmSource", e.target.value)}
            placeholder="e.g. facebook"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">UTM Medium</label>
          <input
            type="text"
            value={form.utmMedium}
            onChange={(e) => set("utmMedium", e.target.value)}
            placeholder="e.g. cpc"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">UTM Campaign</label>
          <input
            type="text"
            value={form.utmCampaign}
            onChange={(e) => set("utmCampaign", e.target.value)}
            placeholder="e.g. summer2024"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Ad Spend (AED)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.spend}
            onChange={(e) => set("spend", e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-wa-green text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-wa-dark disabled:opacity-60 text-sm"
          >
            {saving ? "Saving…" : "Save Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start gap-3">
      <div className="rounded-lg bg-wa-green/10 p-2.5">
        <Icon className="h-5 w-5 text-wa-green" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CTWAPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ctwa");
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { campaigns: Campaign[] };
      setCampaigns(data.campaigns);
    } catch {
      toast({ title: "Failed to load campaigns", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(campaign: Campaign) {
    setToggling(campaign.id);
    try {
      const res = await fetch("/api/ctwa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, isActive: !campaign.isActive }),
      });
      if (!res.ok) throw new Error("patch failed");
      toast({
        title: campaign.isActive ? "Campaign paused" : "Campaign activated",
        variant: "success",
      });
      await load();
    } catch {
      toast({ title: "Failed to update campaign", variant: "danger" });
    } finally {
      setToggling(null);
    }
  }

  // ── Summary totals ──
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const overallRoi = totalSpend > 0 ? totalRevenue / totalSpend : null;

  // ── Chart data (top 8 by revenue) ──
  const chartData = [...campaigns]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name, revenue: c.revenue }));

  return (
    <div className="space-y-6">
      <PageHeader title="Ad Manager (CTWA)" subtitle="Track Click-to-WhatsApp campaign performance">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-wa-green text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-wa-dark flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </PageHeader>

      {showForm && (
        <NewCampaignPanel onClose={() => setShowForm(false)} onSaved={load} />
      )}

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointerClick} />
        <SummaryCard label="Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} />
        <SummaryCard label="Revenue" value={`AED ${fmt(totalRevenue)}`} icon={DollarSign} />
        <SummaryCard
          label="Overall ROI"
          value={overallRoi !== null ? `${overallRoi.toFixed(2)}x` : "—"}
          icon={TrendingUp}
          sub={totalSpend > 0 ? `Spend: AED ${fmt(totalSpend)}` : "No spend recorded"}
        />
      </div>

      {/* Bar chart */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-gray-800">Revenue by Campaign</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} />
              <Tooltip
                formatter={(value) => [`AED ${fmt(Number(value))}`, "Revenue"]}
                contentStyle={{ borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#25D366" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-wa-green" />
          <p className="font-semibold text-gray-800 text-sm">Campaigns</p>
          <span className="ml-auto text-xs text-gray-400">{campaigns.length} total</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Create your first Click-to-WhatsApp campaign above
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Source</th>
                  <th className="px-5 py-3 text-right">Clicks</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Spend</th>
                  <th className="px-5 py-3 text-right">ROI</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.utmCampaign && (
                        <div className="text-xs text-gray-400">{c.utmCampaign}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {c.utmSource}
                      </span>
                      {c.utmMedium && (
                        <span className="ml-1.5 text-xs text-gray-400">{c.utmMedium}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">
                      {c.orders.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium text-gray-900">
                      AED {fmt(c.revenue)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-600">
                      AED {fmt(c.spend)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RoiBadge roi={c.roi} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        disabled={toggling === c.id}
                        onClick={() => toggleActive(c)}
                        title={c.isActive ? "Pause campaign" : "Activate campaign"}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {c.isActive ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-wa-green" />
                            <span className="text-wa-dark">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Paused</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tracking snippet helper */}
      {campaigns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-800">Tracking Snippet</p>
          <p className="mb-3 text-xs text-gray-500">
            Fire this from your storefront when a visitor clicks a WhatsApp CTA button from an ad.
            Replace <code className="bg-gray-100 px-1 rounded text-[11px]">SHOP_ID</code> and{" "}
            <code className="bg-gray-100 px-1 rounded text-[11px]">UTM_SOURCE</code> with actual
            values read from URL params.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-xs text-green-300 leading-relaxed">
{`fetch('/api/ctwa/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ shopId: 'SHOP_ID', utmSource: 'UTM_SOURCE' }),
});`}
          </pre>
        </div>
      )}
    </div>
  );
}

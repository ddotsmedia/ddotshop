"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface RevenueData {
  dailyRevenue: { date: string; revenue: number }[];
  byPlan: { plan: string; revenue: number }[];
  topTenants: {
    shopId: string;
    name: string;
    email: string;
    plan: string;
    revenue: number;
  }[];
  mrr: number;
}

const PLAN_PRICES: Record<string, number> = {
  STARTER: 49,
  GROWTH: 149,
  PRO: 349,
  AGENCY: 999,
};

const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  GROWTH: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

function KpiCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#6b7280]">{title}</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-600">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none text-[#111827]">{value}</p>
    </div>
  );
}

type TopTenant = RevenueData["topTenants"][number] & { id: string };

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/revenue");
      if (res.ok) setData((await res.json()) as RevenueData);
      setLoading(false);
    }
    void load();
  }, []);

  function fmt(n: number) {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(2)}`;
  }

  // Filter daily revenue by range
  const filteredDaily = (() => {
    if (!data) return [];
    const arr = data.dailyRevenue;
    if (range === "all") return arr;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return arr.slice(-days);
  })();

  const totalRevenue = filteredDaily.reduce((s, d) => s + d.revenue, 0);

  const topTenantColumns: Column<TopTenant>[] = [
    { key: "name", label: "Shop", render: (t) => <span className="font-medium">{t.name}</span> },
    { key: "email", label: "Email", render: (t) => <span className="text-sm text-[#6b7280]">{t.email}</span> },
    {
      key: "plan",
      label: "Plan",
      render: (t) => (
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${PLAN_BADGE[t.plan]}`}>
          {t.plan}
        </span>
      ),
    },
    {
      key: "planPrice",
      label: "MRR Contrib.",
      render: (t) => `$${PLAN_PRICES[t.plan] ?? 0}`,
    },
    {
      key: "revenue",
      label: "All-time Revenue",
      render: (t) => <span className="font-semibold text-[#111827]">{fmt(t.revenue)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Revenue" subtitle="Platform-wide revenue analytics" />

      {/* Range toggle */}
      <div className="mb-6 flex gap-2">
        {(["7d", "30d", "90d", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              range === r
                ? "bg-red-600 text-white"
                : "border border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50"
            }`}
          >
            {r === "all" ? "All time" : r}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Total Revenue" value={loading ? "…" : fmt(totalRevenue)} icon={DollarSign} />
        <KpiCard title="MRR" value={loading ? "…" : fmt(data?.mrr ?? 0)} icon={TrendingUp} />
        <KpiCard
          title="Avg per Tenant"
          value={
            loading
              ? "…"
              : data?.topTenants.length
              ? fmt(totalRevenue / Math.max(1, data.topTenants.length))
              : "$0.00"
          }
          icon={Users}
        />
        <KpiCard title="Annual Run Rate" value={loading ? "…" : fmt((data?.mrr ?? 0) * 12)} icon={BarChart3} />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#374151]">
            Revenue over time ({range})
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={filteredDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#374151]">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.byPlan ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tenants table */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#374151]">Top Tenants by Revenue</h3>
        <DataTable<TopTenant>
          columns={topTenantColumns}
          data={(data?.topTenants ?? []).map((t) => ({ ...t, id: t.shopId }))}
          loading={loading}
          emptyMessage="No revenue data yet."
        />
      </div>
    </div>
  );
}

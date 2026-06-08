"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Store,
  DollarSign,
  TrendingUp,
  UserPlus,
  BarChart3,
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
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisWeek: number;
  planBreakdown: Record<string, number>;
  topShops: { name: string; orderCount: number }[];
}

interface RevenueData {
  dailyRevenue: { date: string; revenue: number }[];
  mrr: number;
}

interface AuditAction {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  ip: string | null;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
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
      {sub && <p className="mt-1 text-xs text-[#9ca3af]">{sub}</p>}
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  GROWTH: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [audit, setAudit] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sRes, rRes, aRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/revenue"),
        fetch("/api/admin/audit?limit=10"),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (rRes.ok) setRevenue(await rRes.json());
      if (aRes.ok) {
        const d = await aRes.json();
        setAudit(d.actions ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  function fmt(n: number) {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(2)}`;
  }

  const auditColumns: Column<AuditAction>[] = [
    {
      key: "action",
      label: "Action",
      render: (r) => (
        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          {r.action}
        </span>
      ),
    },
    { key: "targetType", label: "Target Type", render: (r) => r.targetType },
    { key: "targetId", label: "Target", render: (r) => r.targetId ?? "—" },
    {
      key: "createdAt",
      label: "Time",
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    { key: "ip", label: "IP", render: (r) => r.ip ?? "—" },
  ];

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="Platform-wide metrics and activity" />

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Tenants"
          value={loading ? "…" : (stats?.totalUsers ?? 0)}
          icon={Users}
          sub="All registered tenants"
        />
        <KpiCard
          title="Active Shops"
          value={loading ? "…" : (stats?.totalShops ?? 0)}
          icon={Store}
          sub="Live storefronts"
        />
        <KpiCard
          title="All-time Revenue"
          value={loading ? "…" : fmt(stats?.totalRevenue ?? 0)}
          icon={DollarSign}
          sub="Paid orders"
        />
        <KpiCard
          title="This Month"
          value={loading ? "…" : fmt(stats?.revenueThisMonth ?? 0)}
          icon={TrendingUp}
          sub="Revenue MTD"
        />
        <KpiCard
          title="New This Week"
          value={loading ? "…" : (stats?.newUsersThisWeek ?? 0)}
          icon={UserPlus}
          sub="New tenants"
        />
        <KpiCard
          title="MRR"
          value={loading ? "…" : fmt(revenue?.mrr ?? 0)}
          icon={BarChart3}
          sub="Monthly recurring"
        />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Daily Revenue */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#374151]">Daily Revenue (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue?.dailyRevenue ?? []}>
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

        {/* Plan breakdown */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#374151]">Tenants by Plan</h3>
          <div className="mb-4 grid grid-cols-2 gap-3">
            {["STARTER", "GROWTH", "PRO", "AGENCY"].map((plan) => (
              <div
                key={plan}
                className="flex items-center justify-between rounded-lg border border-[#e5e7eb] px-3 py-2"
              >
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${PLAN_COLORS[plan]}`}
                >
                  {plan}
                </span>
                <span className="text-lg font-bold text-[#111827]">
                  {loading ? "…" : (stats?.planBreakdown[plan] ?? 0)}
                </span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={["STARTER", "GROWTH", "PRO", "AGENCY"].map((plan) => ({
                plan,
                count: stats?.planBreakdown[plan] ?? 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent audit */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#374151]">Recent Admin Activity</h3>
        <DataTable
          columns={auditColumns}
          data={audit}
          loading={loading}
          emptyMessage="No admin actions yet."
        />
      </div>
    </div>
  );
}

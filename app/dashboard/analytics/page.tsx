"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Percent } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AiInsightsCard } from "@/components/dashboard/AiInsightsCard";

interface Data {
  kpis: {
    revenue: number;
    orders: number;
    aov: number;
    pageViews: number;
    conversionRate: number;
    revenueChange: number;
    ordersChange: number;
  };
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; sales: number }[];
  devices: { device: string; count: number; percent: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  mobile: "#25D366",
  desktop: "#3B82F6",
  tablet: "#9CA3AF",
  unknown: "#D1D5DB",
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/data?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Your shop performance">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${days === d ? "bg-white shadow-sm" : "text-[#6b7280]"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </PageHeader>

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="Revenue" value={data.kpis.revenue} currency="AED" change={data.kpis.revenueChange} icon={DollarSign} />
            <MetricCard title="Orders" value={data.kpis.orders} change={data.kpis.ordersChange} icon={ShoppingCart} />
            <MetricCard title="Avg order" value={data.kpis.aov} currency="AED" icon={TrendingUp} />
            <MetricCard title="Page views" value={data.kpis.pageViews} icon={Eye} />
            <MetricCard title="Conversion" value={`${data.kpis.conversionRate}%`} icon={Percent} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <CardTitle className="mb-4">Revenue by day</CardTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.revenueByDay}>
                    <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#25D366" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CardTitle className="mb-4">Orders by day</CardTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.revenueByDay}>
                    <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#25D366" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CardTitle className="mb-4">Top products</CardTitle>
                {data.topProducts.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#9ca3af]">No sales yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#128C7E" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CardTitle className="mb-4">Devices</CardTitle>
                {data.devices.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#9ca3af]">No visits yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={data.devices}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(e: { device?: string; percent?: number }) =>
                          `${e.device ?? ""} ${Math.round((e.percent ?? 0) * 100)}%`
                        }
                        labelLine={false}
                      >
                        {data.devices.map((d) => (
                          <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? "#D1D5DB"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <AiInsightsCard />
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Zap } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface Metrics {
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number; externalMb: number };
  cpu: { cores: number; loadAvg: { load1: number; load5: number; load15: number } };
  uptime: number;
  db: { count: number; avgMs: number; p95Ms: number; slowCount: number };
}

interface Queue {
  id?: string;
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export function MonitoringClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function refresh() {
      try {
        const [mRes, qRes] = await Promise.all([
          fetch("/api/admin/metrics"),
          fetch("/api/admin/queues"),
        ]);
        if (mRes.ok) setMetrics(await mRes.json());
        if (qRes.ok) {
          const data = await qRes.json();
          setQueues(data.queues ?? []);
        }
      } catch {}
      setLoading(false);
    }

    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const queueColumns: Column<Queue>[] = [
    { key: "name", label: "Queue" },
    { key: "waiting", label: "Waiting", render: (r) => r.waiting },
    { key: "active", label: "Active", render: (r) => r.active },
    { key: "completed", label: "Completed", render: (r) => r.completed },
    { key: "failed", label: "Failed", render: (r) => r.failed },
    { key: "delayed", label: "Delayed", render: (r) => r.delayed },
  ];

  return (
    <div className="space-y-6">
      {/* System metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Memory (RSS)"
          value={`${metrics?.memory.rssMb ?? 0} MB`}
          icon={Activity}
        />
        <MetricCard
          title="Heap Used"
          value={`${metrics?.memory.heapUsedMb ?? 0} MB`}
          icon={Activity}
        />
        <MetricCard
          title="CPU Load (1m)"
          value={`${metrics?.cpu.loadAvg.load1.toFixed(2) ?? 0}`}
          icon={Zap}
        />
        <MetricCard
          title="Uptime"
          value={`${Math.floor((metrics?.uptime ?? 0) / 3600)}h`}
          icon={Activity}
        />
      </div>

      {/* Database metrics */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#374151]">Database Queries (last 200)</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[#e5e7eb] px-3 py-2">
            <p className="text-xs text-[#6b7280]">Total</p>
            <p className="text-lg font-bold text-[#111827]">{metrics?.db.count ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] px-3 py-2">
            <p className="text-xs text-[#6b7280]">Avg</p>
            <p className="text-lg font-bold text-[#111827]">{metrics?.db.avgMs.toFixed(1) ?? 0}ms</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] px-3 py-2">
            <p className="text-xs text-[#6b7280]">P95</p>
            <p className="text-lg font-bold text-[#111827]">{metrics?.db.p95Ms ?? 0}ms</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] px-3 py-2">
            <p className="text-xs text-[#6b7280]">Slow (&gt;200ms)</p>
            <p className="text-lg font-bold text-[#111827]">{metrics?.db.slowCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Queue status */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#374151]">Job Queues</h3>
        <DataTable columns={queueColumns} data={queues} loading={loading} emptyMessage="No queues" />
      </div>
    </div>
  );
}

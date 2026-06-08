"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";

interface AuditAction {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  ip: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?page=${page}&limit=50`);
    if (res.ok) {
      const d = await res.json();
      setActions(d.actions ?? []);
      setTotal(d.total ?? 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const header = ["id", "adminId", "action", "targetType", "targetId", "ip", "createdAt"];
    const rows = actions.map((a) => [
      a.id,
      a.adminId,
      a.action,
      a.targetType,
      a.targetId ?? "",
      a.ip ?? "",
      a.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`${total} total actions`}>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Action
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Target Type
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Target ID
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Admin
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                IP
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={`s${i}`} className="border-t border-[#f3f4f6]">
                  {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && actions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#6b7280]">
                  No admin actions yet.
                </td>
              </tr>
            )}

            {!loading &&
              actions.map((a) => {
                const isExpanded = expanded.has(a.id);
                const hasDetails = a.details !== null && a.details !== undefined;
                return (
                  <React.Fragment key={a.id}>
                    <tr
                      className="border-t border-[#f3f4f6] transition-colors hover:bg-surface"
                      style={{ height: 52 }}
                    >
                      <td className="px-3 py-2">
                        {hasDetails && (
                          <button
                            onClick={() => toggleExpand(a.id)}
                            className="text-[#9ca3af] hover:text-[#374151]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          {a.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#374151]">{a.targetType}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[#6b7280]">
                        {a.targetId ? a.targetId.slice(0, 12) + "…" : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-[#6b7280]">
                        {a.adminId.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-2 text-xs text-[#9ca3af]">{a.ip ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-[#6b7280]">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr className="border-t border-[#f3f4f6] bg-gray-50">
                        <td />
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                            {JSON.stringify(a.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[#6b7280]">
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

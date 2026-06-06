"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AiInsightsCard() {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    const res = await fetch(`/api/ai/insights${refresh ? "?refresh=1" : ""}`);
    const data = await res.json();
    setInsights(data.insights ?? null);
    setReason(data.reason ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="border-l-4 border-l-wa-green p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-wa-green" />
          <h3 className="text-base font-semibold">AI Insights</h3>
        </div>
        {insights && (
          <button onClick={() => load(true)} className="text-[#9ca3af] hover:text-[#111827]">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && reason === "upgrade" && (
        <div className="mt-3 flex items-start gap-2 text-sm text-[#6b7280]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          Upgrade to Growth for AI sales insights.
        </div>
      )}

      {!loading && insights && (
        <ul className="mt-3 space-y-2">
          {insights.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#374151]">
              <span className="text-wa-green">•</span>
              {t}
            </li>
          ))}
        </ul>
      )}

      {!loading && !insights && reason !== "upgrade" && (
        <p className="mt-3 text-sm text-[#6b7280]">
          Insights appear once you have orders. Powered by Claude.
        </p>
      )}
    </Card>
  );
}

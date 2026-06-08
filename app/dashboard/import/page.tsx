"use client";

import { useRef, useState } from "react";
import { Upload, Store, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number;
  skipped: number;
  source: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ImportPage() {
  // CSV state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // Shopify state
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [shopifyLoading, setShopifyLoading] = useState(false);

  // History (in-component state — last few import results)
  const [history, setHistory] = useState<ImportResult[]>([]);

  // ───── Helpers ─────

  function addHistory(result: ImportResult) {
    setHistory((prev) => [result, ...prev].slice(0, 10));
  }

  // ───── CSV import ─────

  async function handleCsvImport() {
    if (!csvFile) {
      toast({ title: "Please select a CSV file first", variant: "danger" });
      return;
    }

    setCsvLoading(true);
    try {
      const form = new FormData();
      form.append("file", csvFile);

      const res = await fetch("/api/import/csv", { method: "POST", body: form });
      const data = (await res.json()) as { imported?: number; skipped?: number; error?: string };

      if (!res.ok) {
        toast({ title: data.error ?? "CSV import failed", variant: "danger" });
        return;
      }

      const imported = data.imported ?? 0;
      const skipped = data.skipped ?? 0;

      toast({
        title: `Imported ${imported} product${imported !== 1 ? "s" : ""}${skipped ? ` (${skipped} skipped)` : ""}`,
        variant: "success",
      });

      addHistory({
        imported,
        skipped,
        source: `CSV — ${csvFile.name}`,
        timestamp: new Date(),
      });

      // Reset file input
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast({ title: "Network error during CSV import", variant: "danger" });
    } finally {
      setCsvLoading(false);
    }
  }

  // ───── Shopify import ─────

  async function handleShopifyImport() {
    if (!shopDomain.trim() || !accessToken.trim()) {
      toast({ title: "Please enter both shop domain and access token", variant: "danger" });
      return;
    }

    setShopifyLoading(true);
    try {
      const res = await fetch("/api/import/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain: shopDomain.trim(), accessToken: accessToken.trim() }),
      });
      const data = (await res.json()) as { imported?: number; skipped?: number; error?: string };

      if (!res.ok) {
        toast({ title: data.error ?? "Shopify import failed", variant: "danger" });
        return;
      }

      const imported = data.imported ?? 0;
      const skipped = data.skipped ?? 0;

      toast({
        title: `Imported ${imported} product${imported !== 1 ? "s" : ""}${skipped ? ` (${skipped} skipped)` : ""} from Shopify`,
        variant: "success",
      });

      addHistory({
        imported,
        skipped,
        source: `Shopify — ${shopDomain.trim()}`,
        timestamp: new Date(),
      });
    } catch {
      toast({ title: "Network error during Shopify import", variant: "danger" });
    } finally {
      setShopifyLoading(false);
    }
  }

  // ───── Render ─────

  return (
    <div>
      <PageHeader
        title="Import Products"
        subtitle="Bulk-import your catalog from a Shopify CSV export or directly from your Shopify store"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── CSV Card ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#dcf8c6]">
              <Upload className="h-5 w-5 text-[#0a5c36]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827]">Import from CSV</h3>
              <p className="text-xs text-[#6b7280]">Shopify product export format</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-[#374151]">
            Export your products from{" "}
            <span className="font-medium">Shopify Admin → Products → Export</span> and upload the
            CSV here. Imported products are saved as <span className="font-medium">drafts</span>.
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              Select CSV file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#374151] file:mr-3 file:rounded-md file:border-0 file:bg-wa-green file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-wa-dark focus:outline-none focus:ring-2 focus:ring-wa-green/30"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            />
            {csvFile && (
              <p className="mt-1 text-xs text-[#6b7280]">
                {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={!csvFile || csvLoading}
            onClick={handleCsvImport}
            className="w-full"
          >
            <Upload className="h-4 w-4" />
            {csvLoading ? "Importing…" : "Upload & Import"}
          </Button>
        </div>

        {/* ── Shopify Card ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f0fdf4]">
              <Store className="h-5 w-5 text-[#128C7E]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827]">Connect Shopify Store</h3>
              <p className="text-xs text-[#6b7280]">Import live via Shopify Admin API</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-[#374151]">
            Enter your Shopify store domain and a private-app access token with{" "}
            <span className="font-medium">read_products</span> permission. Up to 250 products are
            fetched per request.
          </p>

          <div className="mb-3 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                Shop domain
              </label>
              <input
                type="text"
                placeholder="your-store.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-wa-green focus:outline-none focus:ring-2 focus:ring-wa-green/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                Access token
              </label>
              <input
                type="password"
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-wa-green focus:outline-none focus:ring-2 focus:ring-wa-green/20"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={!shopDomain.trim() || !accessToken.trim() || shopifyLoading}
            onClick={handleShopifyImport}
            className="w-full"
          >
            <Store className="h-4 w-4" />
            {shopifyLoading ? "Importing…" : "Import from Shopify"}
          </Button>
        </div>
      </div>

      {/* ── Import History ── */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6b7280]">
            Import History (this session)
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-[#374151]">Source</th>
                  <th className="px-4 py-3 font-medium text-[#374151]">Imported</th>
                  <th className="px-4 py-3 font-medium text-[#374151]">Skipped</th>
                  <th className="px-4 py-3 font-medium text-[#374151]">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="flex items-center gap-2 px-4 py-3 text-[#111827]">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                      <span className="truncate max-w-[220px]">{entry.source}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-success">{entry.imported}</td>
                    <td className="px-4 py-3 text-[#6b7280]">
                      {entry.skipped > 0 ? (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-warning" />
                          {entry.skipped}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

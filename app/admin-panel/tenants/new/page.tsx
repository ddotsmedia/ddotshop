"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
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

interface CreatedTenant {
  user: {
    id: string;
    name: string;
    email: string;
  };
  temporaryPassword: string;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("STARTER");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedTenant | null>(null);
  const [copied, setCopied] = useState<"email" | "pass" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, plan }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setCreated(data as CreatedTenant);
    } else {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Failed to create tenant",
        description: (err as { error?: string }).error ?? "Unknown error",
        variant: "danger",
      });
    }
  }

  async function copyText(text: string, field: "email" | "pass") {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  if (created) {
    return (
      <div>
        <PageHeader title="Tenant Created" subtitle="Save these credentials" />
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                Success
              </span>
              <h3 className="font-semibold text-[#111827]">{created.user.name}</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-white p-3">
                <p className="mb-1 text-xs font-medium text-[#6b7280]">Email</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-medium text-[#111827]">{created.user.email}</code>
                  <button
                    onClick={() => copyText(created.user.email, "email")}
                    className="text-[#6b7280] hover:text-[#111827]"
                  >
                    {copied === "email" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="mb-1 text-xs font-medium text-[#6b7280]">Temporary Password</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-bold tracking-widest text-[#111827]">
                    {created.temporaryPassword}
                  </code>
                  <button
                    onClick={() => copyText(created.temporaryPassword, "pass")}
                    className="text-[#6b7280] hover:text-[#111827]"
                  >
                    {copied === "pass" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">
              Password shown once only. Share securely with the tenant.
            </p>

            <div className="mt-5 flex gap-2">
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => router.push(`/admin-panel/tenants/${created.user.id}`)}
              >
                View Tenant
              </Button>
              <Button variant="secondary" onClick={() => setCreated(null)}>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="New Tenant" subtitle="Create a tenant account">
        <Link href="/admin-panel/tenants">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                minLength={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter — $49/mo</SelectItem>
                  <SelectItem value="GROWTH">Growth — $149/mo</SelectItem>
                  <SelectItem value="PRO">Pro — $349/mo</SelectItem>
                  <SelectItem value="AGENCY">Agency — $999/mo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Password will be auto-generated and shown once after creation.
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Link href="/admin-panel/tenants">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? "Creating…" : "Create Tenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PLANS = [
  { name: "STARTER", price: "Free", features: ["Up to 30 products", "WhatsApp orders", "100 AI calls/mo"] },
  { name: "GROWTH", price: "AED 49/mo", features: ["Unlimited products", "AI insights", "1,000 AI calls/mo"] },
  { name: "PRO", price: "AED 149/mo", features: ["WhatsApp broadcasts", "5,000 AI calls/mo", "Priority support"] },
  { name: "AGENCY", price: "AED 499/mo", features: ["Multi-shop", "50,000 AI calls/mo", "White-label"] },
];

export default async function BillingPage() {
  const session = await auth();
  const plan = session?.user.plan ?? "STARTER";

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usage = await prisma.aIUsageLog.groupBy({
    by: ["model"],
    where: { tenantId: session?.user.tenantId, createdAt: { gte: since } },
    _count: true,
  });
  const haikuCalls = usage.find((u) => u.model.includes("haiku"))?._count ?? 0;
  const sonnetCalls = usage.find((u) => u.model.includes("sonnet"))?._count ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-sm text-[#6b7280]">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Billing</h2>
        <Badge variant="success">{plan}</Badge>
      </div>

      <Card>
        <CardContent>
          <CardTitle className="mb-3">AI usage this month</CardTitle>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Haiku calls</span>
              <span className="font-medium">{haikuCalls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Sonnet calls</span>
              <span className="font-medium">{sonnetCalls}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.name} className={p.name === plan ? "border-wa-green ring-1 ring-wa-green" : ""}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{p.name}</h3>
                {p.name === plan && <Badge variant="success">Current</Badge>}
              </div>
              <p className="text-xl font-extrabold">{p.price}</p>
              <ul className="space-y-1 text-sm text-[#6b7280]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-1.5">
                    <Check className="h-4 w-4 text-wa-green" /> {f}
                  </li>
                ))}
              </ul>
              {p.name !== plan && (
                <Button variant="secondary" className="w-full" disabled>
                  Upgrade
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-[#9ca3af]">
        Billing integration coming soon — contact support to change plans.
      </p>
    </div>
  );
}

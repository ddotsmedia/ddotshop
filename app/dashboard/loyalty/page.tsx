import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LoyaltySettings } from "@/components/dashboard/LoyaltySettings";
import { Link2, MousePointerClick, TrendingUp } from "lucide-react";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const session = await auth();
  const shopId = session!.user.shopId!;

  const program =
    (await prisma.loyaltyProgram.findUnique({ where: { shopId } })) ??
    (await prisma.loyaltyProgram.create({ data: { shopId } }));

  const [leaders, refs] = await Promise.all([
    prisma.customerPoints.findMany({
      where: { shopId },
      orderBy: { points: "desc" },
      take: 10,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    prisma.referralLink.aggregate({
      where: { shopId },
      _count: true,
      _sum: { clicks: true, conversions: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty & Referrals" subtitle="Reward repeat customers" />

      <LoyaltySettings
        initial={{
          pointsPerAED: program.pointsPerAED,
          rewardThreshold: program.rewardThreshold,
          rewardValue: Number(program.rewardValue),
          isActive: program.isActive,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Referral links" value={refs._count} icon={Link2} />
        <MetricCard title="Clicks" value={refs._sum.clicks ?? 0} icon={MousePointerClick} />
        <MetricCard title="Conversions" value={refs._sum.conversions ?? 0} icon={TrendingUp} />
      </div>

      <Card>
        <CardContent>
          <CardTitle className="mb-3">Points leaderboard</CardTitle>
          {leaders.length === 0 ? (
            <p className="text-sm text-[#6b7280]">No points earned yet.</p>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {leaders.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-5 text-[#9ca3af]">{i + 1}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-wa-light text-xs font-semibold text-wa-dark">
                    {initials(l.customer?.name ?? l.customer?.phone)}
                  </span>
                  <span className="flex-1 font-medium">{l.customer?.name ?? l.customer?.phone ?? "—"}</span>
                  <span className="text-[#6b7280]">{l.lifetime} lifetime</span>
                  <span className="font-semibold text-wa-dark">{l.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { NotifyAllButton } from "@/components/dashboard/NotifyAllButton";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await auth();
  const shopId = session!.user.shopId!;

  const [wish, wait] = await Promise.all([
    prisma.wishlist.groupBy({ by: ["productId"], where: { shopId }, _count: true }),
    prisma.waitlist.groupBy({ by: ["productId"], where: { shopId, notified: false }, _count: true }),
  ]);

  const ids = Array.from(new Set([...wish.map((w) => w.productId), ...wait.map((w) => w.productId)]));
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const wishCount = new Map(wish.map((w) => [w.productId, w._count]));
  const waitCount = new Map(wait.map((w) => [w.productId, w._count]));

  return (
    <div className="space-y-6">
      <PageHeader title="Wishlist & Waitlist" subtitle="Demand signals from shoppers" />

      <Card>
        <CardContent>
          <CardTitle className="mb-3">By product</CardTitle>
          {ids.length === 0 ? (
            <p className="text-sm text-[#6b7280]">No wishlist or waitlist activity yet.</p>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {ids.map((id) => (
                <div key={id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="flex-1 font-medium">{nameOf.get(id) ?? "—"}</span>
                  <span className="text-[#6b7280]">❤️ {wishCount.get(id) ?? 0} wishlisted</span>
                  <span className="text-[#6b7280]">🔔 {waitCount.get(id) ?? 0} waiting</span>
                  {(waitCount.get(id) ?? 0) > 0 && <NotifyAllButton productId={id} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

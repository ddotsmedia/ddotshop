import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.shopId) redirect("/onboarding");

  const shop = await prisma.shop.findUnique({
    where: { id: session.user.shopId },
    select: { slug: true, name: true },
  });
  if (!shop) redirect("/onboarding");

  const shopDomain = (process.env.NEXT_PUBLIC_SHOP_DOMAIN ?? "ddotsshop.com").replace(
    /:\d+$/,
    "",
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar shopSlug={shop.slug} shopDomain={shopDomain} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar shopSlug={shop.slug} userName={session.user.name} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

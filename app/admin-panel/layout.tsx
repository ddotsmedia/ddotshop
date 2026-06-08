import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Red top banner — sticky over everything */}
      <div className="fixed inset-x-0 top-0 z-50 bg-red-900 py-2 text-center text-sm text-white">
        🔴 SUPER ADMIN MODE — admin.ddotshop.com
      </div>

      {/* Sidebar sits below the banner */}
      <div className="mt-[40px] flex h-[calc(100vh-40px)] w-full overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-surface p-6">{children}</main>
      </div>
    </div>
  );
}

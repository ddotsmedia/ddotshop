"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Megaphone,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin-panel", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin-panel/tenants", label: "Tenants", icon: Users, exact: false },
  { href: "/admin-panel/revenue", label: "Revenue", icon: TrendingUp, exact: false },
  { href: "/admin-panel/announce", label: "Announcements", icon: Megaphone, exact: false },
  { href: "/admin-panel/audit", label: "Audit Log", icon: ClipboardList, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#e5e7eb] bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-5 py-4">
        <span className="text-lg font-bold tracking-tight text-[#111827]">DdotsShop</span>
        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-l-[3px] border-red-500 bg-red-500/10 pl-[9px] text-red-500"
                      : "text-[#374151] hover:bg-gray-100",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#e5e7eb] px-4 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#374151] transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit to Dashboard
        </Link>
        <p className="mt-2 truncate px-2 text-[11px] text-[#9ca3af]">admin@ddotshop.com</p>
      </div>
    </aside>
  );
}

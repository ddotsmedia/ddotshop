"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import Link from "next/link";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/products": "Products",
  "/dashboard/categories": "Categories",
  "/dashboard/orders": "Orders",
  "/dashboard/customers": "Customers",
  "/dashboard/analytics": "Analytics",
  "/dashboard/whatsapp": "WhatsApp",
  "/dashboard/settings": "Settings",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((k) => k !== "/dashboard" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLES[match] : "Dashboard";
}

export function Topbar({
  shopSlug,
  userName,
}: {
  shopSlug: string;
  userName?: string | null;
}) {
  const pathname = usePathname();
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
      <h1 className="text-lg font-bold text-[#111827]">{titleFor(pathname)}</h1>
      <div className="flex items-center gap-3">
        <Badge variant="muted" className="font-mono">
          {shopSlug}
        </Badge>
        <button className="relative text-[#6b7280] hover:text-[#111827]">
          <Bell className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-wa-green text-sm font-semibold text-white">
              {initials(userName)}
            </span>
            <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-[#e5e7eb]" />
            <DropdownMenuItem
              className="text-danger"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

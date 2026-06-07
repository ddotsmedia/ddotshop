"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  MessageCircle,
  Settings,
  ShoppingBag,
  ExternalLink,
  Tag,
  Gift,
  Star,
  Zap,
  Boxes,
  Heart,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "STORE",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/products", label: "Products", icon: Package },
      { href: "/dashboard/categories", label: "Categories", icon: Tag },
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
      { href: "/dashboard/customers", label: "Customers", icon: Users },
      { href: "/dashboard/flash-sales", label: "Flash Sales", icon: Zap },
      { href: "/dashboard/bundles", label: "Bundles", icon: Boxes },
      { href: "/dashboard/gift-cards", label: "Gift Cards", icon: Gift },
      { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
      { href: "/dashboard/pre-orders", label: "Pre-orders", icon: Clock },
      { href: "/dashboard/subscriptions", label: "Subscriptions", icon: RefreshCw },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/dashboard/loyalty", label: "Loyalty", icon: Gift },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "ACCOUNT",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({
  shopSlug,
  shopDomain = "ddotsshop.com",
}: {
  shopSlug: string;
  shopDomain?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-[#9ca3af] md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-wa-green text-white">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold text-white">DdotsShop</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#4b5563]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-l-[3px] border-wa-green bg-wa-green/10 font-semibold text-wa-green"
                        : "hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <a
        href={`https://${shopSlug}.${shopDomain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="m-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white hover:bg-white/10"
      >
        View Shop
        <ExternalLink className="h-4 w-4" />
      </a>
    </aside>
  );
}

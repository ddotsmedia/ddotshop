"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ShopHeader } from "./ShopHeader";
import { FlashSaleCountdown } from "./FlashSaleCountdown";
import { BundleCard, type BundleView } from "./BundleCard";
import { CategoryFilter } from "./CategoryFilter";
import { ProductGrid } from "./ProductGrid";
import { ProductModal } from "./ProductModal";
import { CartDrawer } from "./CartDrawer";
import { ChatWidget } from "./ChatWidget";
import { useCart } from "@/lib/stores/cart.store";
import type { ShopInfo, ShopProduct, ShopCategory } from "./types";

export function StorefrontView({
  shop,
  products,
  categories,
  flashEndsAt,
  bundles = [],
}: {
  shop: ShopInfo;
  products: ShopProduct[];
  categories: ShopCategory[];
  flashEndsAt?: string | null;
  bundles?: BundleView[];
}) {
  const setShopInfo = useCart((s) => s.setShopInfo);
  const [activeCat, setActiveCat] = useState("all");
  const [modal, setModal] = useState<ShopProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const phone = typeof window !== "undefined" ? window.localStorage.getItem(`ddotsshop-phone-${shop.slug}`) : null;
    if (!phone) return;
    fetch(`/api/wishlist?shopId=${shop.id}&customerPhone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((d) => setWishlisted(new Set(d.productIds ?? [])))
      .catch(() => {});
  }, [shop.id, shop.slug]);

  useEffect(() => {
    setShopInfo({
      shopSlug: shop.slug,
      shopName: shop.name,
      shopPhone: shop.whatsappNumber,
      currency: shop.currency,
    });
  }, [shop, setShopInfo]);

  useEffect(() => {
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: shop.id, path: `/shop/${shop.slug}` }),
    }).catch(() => {});
  }, [shop.id, shop.slug]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.categoryId === activeCat);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCat, query]);

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-white md:max-w-[768px]">
      <ShopHeader shop={shop} onCart={() => setCartOpen(true)} onSearch={() => setSearchOpen((o) => !o)} />
      {flashEndsAt && <FlashSaleCountdown endsAt={flashEndsAt} />}

      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-4 py-2">
          <Search className="h-4 w-4 text-[#9ca3af]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="flex-1 py-1 text-sm outline-none"
          />
        </div>
      )}

      {bundles.length > 0 && activeCat === "all" && !query && (
        <div className="px-3 pt-3">
          <h2 className="mb-2 text-sm font-bold">🎁 Bundle Deals</h2>
          <div className="space-y-2">
            {bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} currency={shop.currency} />
            ))}
          </div>
        </div>
      )}

      <CategoryFilter categories={categories} active={activeCat} onChange={setActiveCat} />
      <ProductGrid
        products={filtered}
        currency={shop.currency}
        shopId={shop.id}
        slug={shop.slug}
        wishlisted={wishlisted}
        onOpen={setModal}
      />

      <ProductModal product={modal} currency={shop.currency} shopId={shop.id} slug={shop.slug} onClose={() => setModal(null)} />
      <CartDrawer shop={shop} open={cartOpen} onClose={() => setCartOpen(false)} />
      <ChatWidget shopSlug={shop.slug} themeColor={shop.themeColor} />

      <footer className="border-t border-[#e5e7eb] py-6 text-center text-xs text-[#9ca3af]">
        Powered by <span className="font-semibold text-wa-dark">Ddotsshop.com</span>
      </footer>
    </div>
  );
}

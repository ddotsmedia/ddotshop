import Link from "next/link";
import { MessageCircle, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-wa-green text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">DdotsShop</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#374151]">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">Start free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-wa-light px-3 py-1 text-xs font-semibold text-wa-dark">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered WhatsApp commerce
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold tracking-[-2px] text-[#111827] sm:text-6xl">
          Sell on WhatsApp with a beautiful online store
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#6b7280]">
          Launch a branded catalog at <strong>yourshop.ddotsshop.com</strong>. Customers
          browse, add to cart, and checkout straight to your WhatsApp. Built for UAE &amp; GCC.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Create your shop — free</Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="secondary">
              See features
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[#e5e7eb] bg-surface py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
          {[
            {
              icon: MessageCircle,
              title: "WhatsApp checkout",
              body: "Every order lands in your WhatsApp, formatted and ready. No app for customers to install.",
            },
            {
              icon: Sparkles,
              title: "AI built in",
              body: "Auto-write product descriptions in English & Arabic, smart search, and sales insights.",
            },
            {
              icon: Zap,
              title: "UAE payments",
              body: "Telr cards & Apple Pay, Stripe international, UPI QR, or cash on delivery.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-wa-light text-wa-dark">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-[#6b7280]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e5e7eb] py-8 text-center text-sm text-[#9ca3af]">
        © {new Date().getFullYear()} DdotsShop — WhatsApp Commerce for UAE &amp; GCC
      </footer>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";

const GREEN = "#25D366";
const DARK = "#0F1923";
const SURFACE = "#F9FAFB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 64,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow .2s",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: GREEN, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>D</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>DdotsShop</span>
        </a>
        <div className="nav-center" style={{ display: "flex", gap: 28 }}>
          {[
            ["Features", "#features"],
            ["Pricing", "#pricing"],
            ["How it works", "#how"],
            ["For UAE", "#uae"],
          ].map(([label, href]) => (
            <a key={label} href={href} style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/login" style={{ color: TEXT, textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "8px 12px" }}>
            Log In
          </a>
          <a
            href="/signup"
            style={{ background: GREEN, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 9999 }}
          >
            Start free →
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ padding: "96px 24px 80px", textAlign: "center" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <span
          style={{
            display: "inline-block",
            background: "#F0FDF4",
            color: "#15803D",
            border: "1px solid #BBF7D0",
            borderRadius: 9999,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          ✦ Trusted by 500+ UAE businesses
        </span>
        <h1 style={{ fontSize: "clamp(2.5rem,6vw,4rem)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.1, color: TEXT, margin: 0 }}>
          Sell on WhatsApp with a
          <br />
          <span style={{ color: GREEN }}>professional online store</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: MUTED, maxWidth: 580, margin: "24px auto 0", lineHeight: 1.6 }}>
          Launch your branded catalog at yourshop.ddotsshop.com. Customers browse, add to cart, and checkout straight to your WhatsApp. Built for UAE &amp; GCC.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
          <a href="/signup" style={{ background: GREEN, color: "#fff", textDecoration: "none", fontWeight: 700, padding: "16px 32px", borderRadius: 12, fontSize: "1.05rem", boxShadow: "0 4px 24px rgba(37,211,102,0.3)" }}>
            Create your shop — free
          </a>
          <a href="#how" style={{ background: "#fff", color: TEXT, textDecoration: "none", fontWeight: 600, padding: "16px 32px", borderRadius: 12, fontSize: "1.05rem", border: `1px solid ${BORDER}` }}>
            Watch demo →
          </a>
        </div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginTop: 24, fontSize: 13, color: MUTED }}>
          <span>✓ Setup in 5 minutes</span>
          <span>✓ No credit card</span>
          <span>✓ AED 49/month</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    ["$45B", "WhatsApp commerce 2026"],
    ["45–60%", "Higher conversion rate"],
    ["35%", "More sales vs redirect"],
    ["500+", "UAE shops on DdotsShop"],
  ];
  return (
    <section style={{ background: DARK, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 24 }}>
        {stats.map(([v, l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: GREEN, letterSpacing: "-1px" }}>{v}</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PhoneMockup() {
  const products = [
    { name: "Black Abaya", price: "AED 220", sale: true },
    { name: "Silk Scarf", price: "AED 95", sale: false },
    { name: "Leather Bag", price: "AED 340", sale: false },
    { name: "Gold Earrings", price: "AED 150", sale: false },
  ];
  return (
    <div style={{ width: 280, background: "#1a1a1a", borderRadius: 40, padding: 12, flexShrink: 0, margin: "0 auto" }}>
      <div style={{ background: "#fff", borderRadius: 30, overflow: "hidden", height: 520, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 56, background: GREEN, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", color: "#fff" }}>
          <span style={{ width: 28, height: 28, borderRadius: 9999, background: "rgba(255,255,255,0.25)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Layla&apos;s Boutique</span>
          <span>🛒</span>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "10px 12px", overflowX: "auto" }}>
          {["All", "Abayas", "Scarves", "Bags"].map((c, i) => (
            <span key={c} style={{ whiteSpace: "nowrap", fontSize: 11, padding: "4px 10px", borderRadius: 9999, background: i === 0 ? GREEN : "#F3F4F6", color: i === 0 ? "#fff" : MUTED, fontWeight: 600 }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 12px", flex: 1, overflow: "hidden" }}>
          {products.map((p) => (
            <div key={p.name} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", position: "relative" }}>
              {p.sale && <span style={{ position: "absolute", top: 6, left: 6, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>SALE</span>}
              <div style={{ background: "#F3F4F6", height: 70 }} />
              <div style={{ padding: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TEXT }}>{p.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{p.price}</div>
                <div style={{ marginTop: 4, background: GREEN, color: "#fff", fontSize: 9, fontWeight: 600, textAlign: "center", padding: "3px 0", borderRadius: 6 }}>+ Cart</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🛒 3 items · AED 495</span>
          <span>Order on WhatsApp →</span>
        </div>
      </div>
    </div>
  );
}

function PhoneSection() {
  const features = [
    ["Beautiful product catalog", "Mobile-first storefront at yourshop.ddotsshop.com"],
    ["WhatsApp native checkout", "Cart converts to a perfect WA message. One tap."],
    ["Real-time inventory", "Stock tracking, low-stock alerts, variants."],
    ["AI product descriptions", "Claude AI writes copy in English & Arabic instantly."],
    ["UAE payments built in", "Telr, Apple Pay, Stripe, UPI QR, Tabby BNPL."],
    ["Automated WA messages", "Order confirmations, cart recovery, broadcasts."],
    ["Customer loyalty & referrals", "Points system, referral links, VIP segments."],
    ["Analytics & AI insights", "Revenue, top products, AI sales summary daily."],
  ];
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 56, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        <PhoneMockup />
        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
          {features.map(([title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <span style={{ width: 24, height: 24, borderRadius: 9999, background: "#F0FDF4", color: GREEN, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontWeight: 700, color: TEXT, fontSize: 15 }}>{title}</div>
                <div style={{ color: MUTED, fontSize: 13 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const cats: { icon: string; name: string; items: string[] }[] = [
    { icon: "🛒", name: "STORE & CATALOG", items: ["Unlimited products + variants", "Category management", "Product bundles & combo deals", "Flash sales with countdown timer", "Pre-orders with deposit payment", "AI product description generator"] },
    { icon: "💬", name: "WHATSAPP COMMERCE", items: ["WhatsApp-native checkout (no redirect)", "WA Flows in-chat ordering", "Voice note order processing", "Automated order confirmations", "Abandoned cart recovery (30 min)", "WA broadcast campaigns"] },
    { icon: "💳", name: "PAYMENTS & FINANCE", items: ["Telr (UAE) + Stripe + UPI QR", "Tabby & Tamara BNPL", "Apple Pay & Google Pay", "Digital gift cards (AED)", "UAE VAT 5% auto-calculation", "FTA-compliant tax invoices"] },
    { icon: "🤖", name: "AI FEATURES", items: ["Claude AI product descriptions", "Smart semantic search", "AI sales insights dashboard", "In-shop AI chatbot (24/7)", "AI upsell suggestions in cart", "Voice note intent extraction"] },
    { icon: "👥", name: "CUSTOMERS & LOYALTY", items: ["Full customer CRM", "Loyalty points system", "Referral link generator", "Wishlist + price drop alerts", "Back-in-stock notifications", "Post-delivery review collection"] },
    { icon: "📊", name: "ANALYTICS & GROWTH", items: ["Revenue & order analytics", "Page view tracking", "Device breakdown charts", "Customer segments (AI)", "Recurring subscriptions (MRR)", "White-label agency portal"] },
  ];
  return (
    <section id="features" style={{ padding: "80px 24px", background: SURFACE }}>
      <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 48px" }}>
        <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: TEXT, margin: 0 }}>Everything you need to sell on WhatsApp</h2>
        <p style={{ color: MUTED, marginTop: 12 }}>24 powerful features across 6 categories. No other platform comes close.</p>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {cats.map((c) => (
          <div key={c.name} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, textAlign: "left" }}>
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: TEXT, margin: "10px 0 12px" }}>{c.name}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {c.items.map((i) => (
                <li key={i} style={{ fontSize: 13, color: MUTED, padding: "4px 0", display: "flex", gap: 8 }}>
                  <span style={{ color: GREEN }}>•</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["①", "Sign up", "Create your account and choose your shop name"],
    ["②", "Add products", "Upload photos, set prices, AI writes the descriptions"],
    ["③", "Share your link", "Share yourshop.ddotsshop.com anywhere — WhatsApp, Instagram, bio"],
    ["④", "Get orders", "Customers browse, add to cart, order lands in your WhatsApp"],
  ];
  return (
    <section id="how" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: TEXT, marginBottom: 48 }}>Up and running in 5 minutes</h2>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {steps.map(([n, t, s]) => (
            <div key={t} style={{ flex: "1 1 160px", minWidth: 150 }}>
              <div style={{ width: 48, height: 48, borderRadius: 9999, background: GREEN, color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, margin: "0 auto 12px" }}>{n}</div>
              <div style={{ fontWeight: 700, color: TEXT }}>{t}</div>
              <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const rows: [string, string, string, string, string][] = [
    ["WhatsApp native checkout", "✅", "❌", "❌", "❌"],
    ["AI product descriptions", "✅", "❌", "❌", "❌"],
    ["Voice note ordering", "✅", "❌", "❌", "❌"],
    ["Arabic / RTL storefront", "✅", "❌", "✅", "✅"],
    ["UAE payments (Telr/Tabby)", "✅", "❌", "✅", "✅"],
    ["Loyalty + referral", "✅", "❌", "✅", "❌"],
    ["Flash sales + bundles", "✅", "❌", "❌", "✅"],
    ["Digital gift cards", "✅", "❌", "❌", "❌"],
    ["VAT auto-calculation", "✅", "❌", "✅", "✅"],
    ["WA broadcast campaigns", "✅", "❌", "✅", "✅"],
    ["Starting price", "AED 49", "₹499", "SAR 299", "SAR 199"],
  ];
  const cell = (v: string) => {
    if (v === "✅") return <span style={{ color: GREEN, fontWeight: 700 }}>✅</span>;
    if (v === "❌") return <span style={{ color: "#EF4444" }}>❌</span>;
    return <span style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{v}</span>;
  };
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: TEXT, textAlign: "center", marginBottom: 40 }}>Why DdotsShop beats the rest</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 12, fontSize: 13, color: MUTED }}>Feature</th>
                <th style={{ padding: 12, background: GREEN, color: "#fff", borderRadius: "10px 10px 0 0", fontSize: 14 }}>
                  DdotsShop <span style={{ fontSize: 11, background: "rgba(255,255,255,0.25)", padding: "1px 6px", borderRadius: 9999 }}>⭐ Best</span>
                </th>
                <th style={{ padding: 12, fontSize: 13, color: MUTED }}>instacall.in</th>
                <th style={{ padding: 12, fontSize: 13, color: MUTED }}>Zid</th>
                <th style={{ padding: 12, fontSize: 13, color: MUTED }}>Salla</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: 12, fontSize: 13, color: TEXT }}>{r[0]}</td>
                  <td style={{ padding: 12, textAlign: "center", background: "#F0FDF4" }}>{cell(r[1])}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{cell(r[2])}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{cell(r[3])}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{cell(r[4])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    ["DdotsShop grew my abaya sales 3x in 2 months. Customers love ordering on WhatsApp.", "Fatima Al-Mansouri", "Dubai Fashion Boutique"],
    ["The AI descriptions save me hours every week. Worth every dirham.", "Rajan Pillai", "Kerala Spices Shop, Sharjah"],
    ["Finally a WhatsApp store that works for Arabic customers. RTL is perfect.", "Mohammed Al-Rashidi", "Riyadh Home Decor"],
  ];
  const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <section style={{ padding: "80px 24px", background: SURFACE }}>
      <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: TEXT, textAlign: "center", marginBottom: 40 }}>Loved by UAE &amp; GCC sellers</h2>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {items.map(([quote, name, shop]) => (
          <div key={name} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
            <div style={{ color: "#F59E0B", marginBottom: 10 }}>⭐⭐⭐⭐⭐</div>
            <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.6, margin: 0 }}>&ldquo;{quote}&rdquo;</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
              <span style={{ width: 36, height: 36, borderRadius: 9999, background: "#F0FDF4", color: GREEN, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>{initials(name)}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{name}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{shop}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  const plans = [
    { name: "STARTER", price: 49, tag: "Test the water", popular: false, cta: "Start free trial", filled: false, features: ["1 shop", "50 products", "Subdomain storefront", "Basic dashboard", "WhatsApp order link"] },
    { name: "GROWTH", price: 149, tag: "For serious sellers", popular: true, cta: "Get started →", filled: true, features: ["Everything in Starter +", "Unlimited products", "Custom domain", "Telr + Stripe payments", "Auto WA confirmations", "AI descriptions", "Inventory tracking", "Flash sales", "Gift cards", "Loyalty points", "Analytics"] },
    { name: "PRO", price: 349, tag: "Scale without limits", popular: false, cta: "Go Pro →", filled: false, features: ["Everything in Growth +", "WA Flows in-chat checkout", "Voice note ordering", "AI chatbot", "Tabby/Tamara BNPL", "Customer CRM", "Arabic RTL storefront", "AI personalization", "Subscriptions", "WA broadcasts", "VAT invoices"] },
    { name: "AGENCY", price: 999, tag: "For agencies & resellers", popular: false, cta: "Contact us →", filled: false, features: ["Everything in Pro +", "Up to 20 shops", "White-label portal", "B2B wholesale mode", "Multi-vendor marketplace", "Agency analytics", "Client billing"] },
  ];
  const priceOf = (p: number) => (yearly ? Math.round(p * 10) : p);
  return (
    <section id="pricing" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: TEXT, margin: 0 }}>Simple pricing. No commissions.</h2>
          <div style={{ display: "inline-flex", gap: 4, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 9999, padding: 4, marginTop: 20 }}>
            <button onClick={() => setYearly(false)} style={{ border: "none", cursor: "pointer", padding: "6px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 600, background: !yearly ? "#fff" : "transparent", color: TEXT, boxShadow: !yearly ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Monthly</button>
            <button onClick={() => setYearly(true)} style={{ border: "none", cursor: "pointer", padding: "6px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 600, background: yearly ? "#fff" : "transparent", color: TEXT, boxShadow: yearly ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Yearly <span style={{ color: GREEN }}>2 months free</span></button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 20 }}>
          {plans.map((p) => (
            <div key={p.name} style={{ position: "relative", background: "#fff", border: p.popular ? `2px solid ${GREEN}` : `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
              {p.popular && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 9999 }}>MOST POPULAR</span>}
              <div style={{ fontWeight: 800, fontSize: 14, color: TEXT, letterSpacing: 1 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{p.tag}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: TEXT }}>
                AED {priceOf(p.price)}
                <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>/{yearly ? "yr" : "mo"}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: 12.5, color: MUTED, padding: "4px 0", display: "flex", gap: 6 }}>
                    <span style={{ color: GREEN }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/signup" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, background: p.filled ? GREEN : "#fff", color: p.filled ? "#fff" : TEXT, border: p.filled ? "none" : `1px solid ${BORDER}` }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: MUTED, fontSize: 13, marginTop: 24 }}>✓ No setup fees &nbsp; ✓ No transaction commissions &nbsp; ✓ Cancel anytime &nbsp; ✓ UAE company — SHAMS Free Zone</p>
      </div>
    </section>
  );
}

function UaeSection() {
  const items = [
    ["🇦🇪", "UAE Payments", "Telr, N-Genius, Ziina, Tabby, Tamara — all UAE-native gateways"],
    ["🌙", "Arabic & RTL", "Full right-to-left Arabic storefront, auto-translated product listings"],
    ["📋", "VAT Compliant", "Auto 5% VAT, FTA-compliant invoices, TRN support, Peppol e-invoicing"],
    ["💱", "6 GCC Currencies", "AED, SAR, KWD, BHD, OMR, QAR with live conversion"],
    ["🏢", "UAE Company", "SHAMS Free Zone registered, local support in UAE timezone"],
    ["⚡", "Dubai Summer Sales", "Flash sale scheduler built for DSS, White Friday, Ramadan campaigns"],
  ];
  return (
    <section id="uae" style={{ padding: "80px 24px", background: DARK, color: "#fff" }}>
      <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, textAlign: "center", marginBottom: 40 }}>Built specifically for UAE &amp; GCC</h2>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {items.map(([icon, title, sub]) => (
          <div key={title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, margin: "10px 0 6px" }}>{title}</div>
            <div style={{ color: "#9CA3AF", fontSize: 13 }}>{sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: "96px 24px", textAlign: "center", background: "#fff" }}>
      <div style={{ fontSize: 48 }}>🚀</div>
      <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: TEXT, margin: "12px 0" }}>Ready to build your WhatsApp store?</h2>
      <p style={{ color: MUTED, maxWidth: 520, margin: "0 auto 28px" }}>Join 500+ UAE &amp; GCC merchants selling smarter on WhatsApp. Setup in 5 minutes.</p>
      <a href="/signup" style={{ display: "inline-block", background: GREEN, color: "#fff", textDecoration: "none", fontWeight: 700, padding: "18px 48px", fontSize: "1.1rem", borderRadius: 12, boxShadow: "0 4px 24px rgba(37,211,102,0.3)" }}>
        Create your shop — free →
      </a>
      <p style={{ color: MUTED, fontSize: 13, marginTop: 16 }}>AED 49/month after trial · No credit card required</p>
    </section>
  );
}

function Footer() {
  const cols: { title: string; links: string[] }[] = [
    { title: "Product", links: ["Features", "Pricing", "How it works", "Demo", "Changelog"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact", "SHAMS Free Zone"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "VAT Policy"] },
  ];
  return (
    <footer style={{ background: "#080E15", color: MUTED, padding: "48px 24px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: GREEN, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>D</span>
            <span style={{ fontWeight: 800, color: "#fff" }}>DdotsShop</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>WhatsApp commerce for UAE &amp; GCC</p>
          <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 18 }}>
            <span>💬</span>
            <span>📷</span>
            <span>in</span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{c.title}</div>
            {c.links.map((l) => (
              <a key={l} href="#" style={{ display: "block", color: "#9CA3AF", textDecoration: "none", fontSize: 13, padding: "5px 0" }}>
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1100, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
        <span>© 2026 DdotsShop — Ddotsmedia IT Solutions, SHAMS Free Zone, UAE</span>
        <span>Made with ❤️ in Abu Dhabi</span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main style={{ background: "#fff", color: TEXT, scrollBehavior: "smooth" }}>
      <Nav />
      <Hero />
      <StatsBar />
      <PhoneSection />
      <FeaturesGrid />
      <HowItWorks />
      <Comparison />
      <Testimonials />
      <Pricing />
      <UaeSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

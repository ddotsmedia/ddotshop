"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Loader2 } from "lucide-react";

const CURRENCIES = ["AED", "USD", "INR", "SAR", "QAR"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugState, setSlugState] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [whatsappNumber, setWhatsappNumber] = useState("+971");
  const [currency, setCurrency] = useState("AED");
  const [locale, setLocale] = useState<"EN" | "AR">("EN");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Debounced slug availability check.
  useEffect(() => {
    if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
      setSlugState(slug ? "taken" : "idle");
      return;
    }
    setSlugState("checking");
    const t = setTimeout(async () => {
      const res = await fetch(`/api/shop/check?slug=${slug}`);
      const data = await res.json();
      setSlugState(data.available ? "ok" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, slug, whatsappNumber, currency, locale }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create shop");
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-wa-green" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Name your shop</h1>
            <div>
              <Label>Shop name</Label>
              <Input
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value);
                  if (!slug) {
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                    );
                  }
                }}
                placeholder="Aisha's Boutique"
              />
            </div>
            <div>
              <Label>Shop address (URL)</Label>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center rounded-[10px] border border-[#e5e7eb] bg-white px-2">
                  <Input
                    className="border-0 px-1 focus:ring-0"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="aishas-boutique"
                  />
                  <span className="whitespace-nowrap text-sm text-[#9ca3af]">.ddotsshop.com</span>
                </div>
                <span className="w-5">
                  {slugState === "checking" && <Loader2 className="h-4 w-4 animate-spin text-[#9ca3af]" />}
                  {slugState === "ok" && <Check className="h-4 w-4 text-success" />}
                  {slugState === "taken" && <X className="h-4 w-4 text-danger" />}
                </span>
              </div>
              {slugState === "taken" && (
                <p className="mt-1 text-xs text-danger">Not available — try another.</p>
              )}
            </div>
            <Button
              className="w-full"
              disabled={!shopName || slugState !== "ok"}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Your WhatsApp number</h1>
            <p className="text-sm text-[#6b7280]">Orders will be sent here.</p>
            <div>
              <Label>WhatsApp number</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={whatsappNumber.replace(/\D/g, "").length < 8}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Currency &amp; language</h1>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as "EN" | "AR")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="AR">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting} onClick={submit}>
                {submitting ? "Creating…" : "Launch shop"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

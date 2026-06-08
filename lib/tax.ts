// Multi-region tax config (supersedes the UAE-only lib/vat.ts logic for invoices).

export interface TaxConfig {
  label: string;
  rate: number;
  number: string | null;
  complianceNote: string;
}

export function getTaxConfig(shop: {
  taxType?: string | null;
  taxRate?: number | string | null;
  taxNumber?: string | null;
  region?: string | null;
}): TaxConfig {
  const rate = Number(shop.taxRate ?? 0);
  const number = shop.taxNumber ?? null;
  const region = (shop.region ?? "").toUpperCase();

  if (region === "UAE") return { label: "VAT", rate, number, complianceNote: "FTA compliant" };
  if (region === "INDIA") return { label: "GST", rate, number, complianceNote: "GSTIN required" };
  if (region === "SAUDI") return { label: "VAT", rate, number, complianceNote: "ZATCA compliant" };

  // Fall back to taxType when region is unset.
  if (shop.taxType === "VAT") return { label: "VAT", rate, number, complianceNote: "" };
  if (shop.taxType === "GST") return { label: "GST", rate, number, complianceNote: "" };
  return { label: "Tax", rate, number, complianceNote: "" };
}

export function calculateTax(subtotal: number, rate: number): number {
  return Math.round(subtotal * (rate / 100) * 100) / 100;
}

export function formatTaxLine(amount: number, config: TaxConfig, currency: string): string {
  return `${config.label} ${config.rate}%: ${currency} ${amount.toFixed(2)}`;
}

// Region → defaults applied when a seller switches region in settings.
export const REGION_DEFAULTS: Record<string, { currency: string; taxType: string; taxRate: number }> = {
  UAE: { currency: "AED", taxType: "VAT", taxRate: 5 },
  INDIA: { currency: "INR", taxType: "GST", taxRate: 18 },
  SAUDI: { currency: "SAR", taxType: "VAT", taxRate: 15 },
  KUWAIT: { currency: "KWD", taxType: "NONE", taxRate: 0 },
  INTERNATIONAL: { currency: "USD", taxType: "NONE", taxRate: 0 },
};

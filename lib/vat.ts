import { prisma } from "@/lib/prisma";

export function calculateVAT(subtotal: number, rate: number): number {
  return Math.round(subtotal * (rate / 100) * 100) / 100;
}

export function calculateTotal(subtotal: number, vatAmount: number, discount: number): number {
  return Math.max(0, Math.round((subtotal - discount + vatAmount) * 100) / 100);
}

export function formatVATLine(vatAmount: number, rate: number, currency: string): string {
  return `VAT ${rate}%: ${currency} ${vatAmount.toFixed(2)}`;
}

/** UAE TRN is 15 digits. */
export function isTRNValid(trn: string): boolean {
  return /^\d{15}$/.test(trn.trim());
}

export interface VATInfo {
  enabled: boolean;
  rate: number;
  vatNumber: string | null;
}

export async function getVATConfig(shopId: string): Promise<VATInfo> {
  const cfg = await prisma.vATConfig.findUnique({ where: { shopId } });
  return {
    enabled: cfg?.enabled ?? false,
    rate: cfg ? Number(cfg.rate) : 5,
    vatNumber: cfg?.vatNumber ?? null,
  };
}

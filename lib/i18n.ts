import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

export type Locale = "EN" | "AR";
type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { EN: en, AR: ar };

/** Lightweight storefront dictionary lookup, keyed by shop locale. */
export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? en;
}

export function isRTL(locale: Locale): boolean {
  return locale === "AR";
}

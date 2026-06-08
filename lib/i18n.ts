import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import ml from "@/messages/ml.json";
import hi from "@/messages/hi.json";

export type Locale = "EN" | "AR" | "ML" | "HI";
type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { EN: en, AR: ar, ML: ml, HI: hi };

/** Lightweight storefront dictionary lookup, keyed by shop locale. */
export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? en;
}

export function isRTL(locale: Locale): boolean {
  return locale === "AR";
}

export function htmlLang(locale: Locale): string {
  return { EN: "en", AR: "ar", ML: "ml", HI: "hi" }[locale] ?? "en";
}

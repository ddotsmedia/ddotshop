// Client-only helper to remember a shopper's phone per shop (for wishlist/waitlist).
export function getStoredPhone(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`ddotsshop-phone-${slug}`);
}

export function setStoredPhone(slug: string, phone: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`ddotsshop-phone-${slug}`, phone);
}

/** Returns a stored phone or prompts for one. Null if user cancels. */
export function ensurePhone(slug: string): string | null {
  const stored = getStoredPhone(slug);
  if (stored) return stored;
  const entered = window.prompt("Enter your WhatsApp number (e.g. +9715…)")?.trim();
  if (!entered || entered.replace(/\D/g, "").length < 8) return null;
  setStoredPhone(slug, entered);
  return entered;
}

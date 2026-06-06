import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "AED"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(isNaN(value) ? 0 : value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm");
}

const slugId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${base || "shop"}-${slugId()}`;
}

export function extractR2Key(url: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL ?? "https://assets.ddotsshop.com";
  return url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

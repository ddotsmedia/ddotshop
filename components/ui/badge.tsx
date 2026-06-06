import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const styles: Record<BadgeVariant, string> = {
  default: "bg-wa-light text-wa-dark",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  muted: "bg-gray-100 text-gray-600",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

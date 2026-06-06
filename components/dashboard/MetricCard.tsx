import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  currency,
}: {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  currency?: string;
}) {
  const positive = (change ?? 0) >= 0;
  const display =
    currency && typeof value === "number" ? formatCurrency(value, currency) : value;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#6b7280]">{title}</p>
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full",
            positive ? "bg-green-100 text-success" : "bg-red-100 text-danger",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none text-[#111827]">{display}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            positive ? "text-success" : "text-danger",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(change)}%
          {changeLabel && <span className="font-normal text-[#9ca3af]">{changeLabel}</span>}
        </p>
      )}
    </Card>
  );
}

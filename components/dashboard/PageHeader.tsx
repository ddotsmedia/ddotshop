import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-center justify-between gap-4", className)}>
      <div>
        <h2 className="text-[1.75rem] font-bold tracking-[-1px] text-[#111827]">{title}</h2>
        {subtitle && <p className="text-sm text-[#6b7280]">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

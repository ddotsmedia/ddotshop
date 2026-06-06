"use client";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[95vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-white p-4 shadow-md animate-in slide-in-from-bottom-2",
            t.variant === "danger" && "border-red-200",
            t.variant === "success" && "border-green-200",
            (!t.variant || t.variant === "default") && "border-[#e5e7eb]",
          )}
        >
          {t.variant === "success" && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          )}
          {t.variant === "danger" && (
            <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
          )}
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className="text-sm font-semibold text-[#111827]">{t.title}</p>
            )}
            {t.description && (
              <p className="text-sm text-[#6b7280]">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[#9ca3af] hover:text-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

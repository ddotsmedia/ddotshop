import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "Nothing here yet",
  emptyAction,
  loading = false,
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]",
                  c.className,
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            [0, 1, 2].map((i) => (
              <tr key={`s${i}`} className="border-t border-[#f3f4f6]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="text-[#6b7280]">{emptyMessage}</p>
                {emptyAction && <div className="mt-3 flex justify-center">{emptyAction}</div>}
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-t border-[#f3f4f6] transition-colors",
                  onRowClick && "cursor-pointer hover:bg-surface",
                )}
                style={{ height: 52 }}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-2", c.className)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

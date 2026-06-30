import { useMemo, type ReactNode } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Pagination } from "./Pagination";
import type { Column, DataTableProps } from "./types";
import { cn } from "../../../lib/utils";

export function DataTable<T>({
  data,
  columns,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 5000],
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === "function") {
      return column.accessor(item);
    }

    return item[column.accessor] as ReactNode;
  };

  const getSortKey = (column: Column<T>) =>
    column.sortKey || (typeof column.accessor === "string" ? column.accessor : undefined);

  const handleSort = (column: Column<T>) => {
    if (!onSort || !column.sortable) {
      return;
    }

    const sortKey = getSortKey(column);
    if (!sortKey) {
      return;
    }

    const nextOrder = sortBy === sortKey && sortOrder === "asc" ? "desc" : "asc";
    onSort(sortKey, nextOrder);
  };

  const handleClearSort = () => {
    onSort?.(undefined, undefined);
  };

  const sortIndicator = useMemo(() => {
    return (column: Column<T>) => {
      if (!column.sortable) {
        return null;
      }

      const sortKey = getSortKey(column);
      if (!sortKey) {
        return null;
      }

      if (sortBy !== sortKey) {
        return null;
      }

      return sortOrder === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4 text-cyan-700" />
      ) : (
        <ArrowDown className="ml-1 h-4 w-4 text-cyan-700" />
      );
    };
  }, [sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      {sortBy ? (
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={handleClearSort}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-cyan-100"
          >
            <X size={14} />
            Clear Sort
          </button>
        </div>
      ) : null}

      <div className="max-h-[38rem] overflow-auto rounded-xl border border-cyan-100 bg-white/90 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur">
            <tr className="border-b border-cyan-100 bg-cyan-50/70">
              {columns.map((column, index) => (
                <th
                  key={`${column.header}-${index}`}
                  scope="col"
                  aria-sort={
                    column.sortable && getSortKey(column)
                      ? sortBy === getSortKey(column)
                        ? sortOrder === "desc"
                          ? "descending"
                          : "ascending"
                        : "none"
                      : undefined
                  }
                  className={cn(
                    column.className,
                    index !== columns.length - 1 && "border-r border-cyan-100",
                    "h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4",
                    sortBy === getSortKey(column) && "bg-cyan-100 text-cyan-700",
                    {
                      "text-left": column.headerAlign === "left",
                      "text-center": column.headerAlign === "center" || !column.headerAlign,
                      "text-right": column.headerAlign === "right",
                    },
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex w-full items-center gap-1.5 select-none"
                    >
                      {column.header}
                      {sortIndicator(column)}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {column.header}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "border-b border-slate-200/70 hover:bg-cyan-50/40",
                  rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/45",
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={`${column.header}-${index}`}
                    className={cn(
                      column.className,
                      index !== columns.length - 1 && "border-r border-slate-200/70",
                      "px-3 py-3 text-sm text-slate-700 sm:px-4",
                      {
                        "text-left": column.cellAlign === "left" || !column.cellAlign,
                        "text-center": column.cellAlign === "center",
                        "text-right": column.cellAlign === "right",
                      },
                    )}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}

            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  No data available
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}

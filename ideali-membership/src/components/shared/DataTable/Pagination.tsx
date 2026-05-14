import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

function getPageSizeLabel(size: number) {
  return size === 5000 ? "All" : size.toString();
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [],
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  if (safeTotalPages <= 1) {
    return null;
  }

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + pageSize - 1, totalItems);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50/75 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="order-2 flex flex-col gap-3 sm:order-1 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm font-medium text-slate-500">
          Showing {startIndex}-{endIndex} of {totalItems}
        </p>

        {onPageSizeChange ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Show</span>
            <select
              value={pageSize.toString()}
              onChange={(event) => onPageSizeChange(Number.parseInt(event.target.value, 10))}
              className="h-9 min-w-[4.5rem] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size.toString()}>
                  {getPageSizeLabel(size)}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500">entries</span>
          </div>
        ) : null}
      </div>

      <div className="order-1 flex flex-wrap items-center justify-center gap-2 sm:order-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronsLeft size={16} className={currentPage === 1 ? "text-slate-300" : "text-slate-700"} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} className={currentPage === 1 ? "text-slate-300" : "text-slate-700"} />
        </button>

        <div className="flex items-center gap-1.5">
          <select
            value={currentPage.toString()}
            onChange={(event) => onPageChange(Number.parseInt(event.target.value, 10))}
            className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none"
            aria-label="Current page"
          >
            {Array.from({ length: safeTotalPages }, (_, index) => index + 1).map((page) => (
              <option key={page} value={page.toString()}>
                {page}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">of {safeTotalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === safeTotalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={16} className={currentPage === safeTotalPages ? "text-slate-300" : "text-slate-700"} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage === safeTotalPages}
          title="Last page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronsRight size={16} className={currentPage === safeTotalPages ? "text-slate-300" : "text-slate-700"} />
        </button>
      </div>
    </div>
  );
}

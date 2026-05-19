import { Pagination } from "../../../components/shared/DataTable/Pagination";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 5000];

type InvoicesPaginationProps = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecordsCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function InvoicesPagination({
  currentPage,
  pageSize,
  totalPages,
  totalRecordsCount,
  onPageChange,
  onPageSizeChange,
}: InvoicesPaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={totalRecordsCount}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
}

import { useSearchParams } from "react-router-dom";

export const useTableParams = (defaultPageSize = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageNo = Number.parseInt(searchParams.get("pageNo") || "1", 10);
  const pageSize = Number.parseInt(
    searchParams.get("pageSize") || defaultPageSize.toString(),
    10,
  );
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined;

  const handlePageChange = (newPage: number) => {
    const params: Record<string, string> = {
      pageNo: newPage.toString(),
      pageSize: pageSize.toString(),
    };

    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    setSearchParams(params);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params: Record<string, string> = {
      pageNo: "1",
      pageSize: newPageSize.toString(),
    };

    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    setSearchParams(params);
  };

  const handleSort = (newSortBy?: string, newSortOrder?: "asc" | "desc") => {
    const params: Record<string, string> = {
      pageNo: "1",
      pageSize: pageSize.toString(),
    };

    if (newSortBy && newSortOrder) {
      params.sortBy = newSortBy;
      params.sortOrder = newSortOrder;
    }

    setSearchParams(params);
  };

  return {
    pageNo,
    pageSize,
    sortBy,
    sortOrder,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  };
};

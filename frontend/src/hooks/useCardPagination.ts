import { useEffect, useMemo, useState } from 'react';

export const CARDS_PER_PAGE = 4;

export function useCardPagination<T>(
  items: T[],
  pageSize: number = CARDS_PER_PAGE,
  resetKey?: string
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    pagedItems,
    currentPage,
    totalPages,
    setPage,
    totalItems: items.length,
    pageSize,
  };
}

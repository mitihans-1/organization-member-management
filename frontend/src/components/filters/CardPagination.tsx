import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CardPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const CardPagination: React.FC<CardPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}) => {
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <p className="text-sm text-gray-600">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2 justify-center sm:justify-end">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`min-w-[40px] py-2 rounded-lg border text-sm font-bold ${
              currentPage === n
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={`Page ${n}`}
            aria-current={currentPage === n ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CardPagination;

import React from 'react';
import { X } from 'lucide-react';
import FilterSection from './FilterSection';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterConfig {
  key: string;
  title: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  filters: FilterConfig[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterKey: string, value: string, checked: boolean) => void;
  onClearFilters: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  /** Card styling on desktop (guest pages) */
  variant?: 'default' | 'card';
  className?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  isMobileOpen,
  onCloseMobile,
  variant = 'default',
  className = '',
}) => {
  const hasActiveFilters = Object.values(selectedFilters).some((arr) => arr.length > 0);

  const desktopCard =
    variant === 'card'
      ? 'lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm lg:bg-white'
      : '';

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-80 max-w-[min(20rem,90vw)] bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto lg:h-auto lg:w-64 lg:max-w-none lg:shrink-0 lg:border-r-0
          lg:sticky lg:top-20 lg:self-start
          ${desktopCard}
          ${className}
        `.trim()}
      >
        <div className="p-6 h-full lg:h-auto lg:max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <div className="hidden lg:flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filters.length === 0 ? (
              <p className="text-sm text-gray-500">No filter options yet.</p>
            ) : (
              filters.map((filter) =>
                filter.options.length > 0 ? (
                  <FilterSection
                    key={filter.key}
                    title={filter.title}
                    options={filter.options}
                    selectedValues={selectedFilters[filter.key] || []}
                    onChange={(value, checked) =>
                      onFilterChange(filter.key, value, checked)
                    }
                  />
                ) : null
              )
            )}
          </div>

          <div className="mt-8 lg:hidden">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;

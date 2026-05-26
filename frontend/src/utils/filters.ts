export interface FilterConfig {
  key: string;
  title: string;
  options: { value: string; label: string; count?: number }[];
}

export type FilterFieldDef<T> = {
  key: string;
  title: string;
  getValue?: (item: T) => string | string[] | null | undefined;
};

type FilterResolver<T> = (item: T) => string | string[] | null | undefined;

function resolveFieldValue<T>(
  item: T,
  key: string,
  getValue?: FilterResolver<T>
): string | string[] | null | undefined {
  if (getValue) return getValue(item);
  return item[key as keyof T] as string | string[] | null | undefined;
}

function valuesForFilter<T>(
  item: T,
  key: string,
  getValue?: FilterResolver<T>
): string[] {
  const raw = resolveFieldValue(item, key, getValue);
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map(String);
  }
  return [String(raw)];
}

/**
 * Extract unique filter values from an array of items
 */
export function extractFilterOptions<T>(
  items: T[],
  key: keyof T | string,
  title: string,
  getValue?: FilterResolver<T>
): FilterConfig {
  const valueMap = new Map<string, number>();
  const fieldKey = String(key);

  items.forEach((item) => {
    const values = valuesForFilter(item, fieldKey, getValue);
    values.forEach((strValue) => {
      valueMap.set(strValue, (valueMap.get(strValue) || 0) + 1);
    });
  });

  const options = Array.from(valueMap.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    key: fieldKey,
    title,
    options,
  };
}

export function buildFilterResolvers<T>(
  definitions: FilterFieldDef<T>[]
): Record<string, FilterResolver<T>> {
  return Object.fromEntries(
    definitions.map((def) => [
      def.key,
      (item: T) => resolveFieldValue(item, def.key, def.getValue),
    ])
  );
}

/**
 * Filter an array of items based on search text and selected filters
 */
function matchesSearchText<T>(
  item: T,
  searchLower: string,
  searchFields: (keyof T)[],
  extraSearchGetters?: FilterResolver<T>[]
): boolean {
  const fromFields = searchFields.some((field) => {
    const value = item[field];
    if (value === null || value === undefined) return false;

    if (Array.isArray(value)) {
      return value.some((v) => String(v).toLowerCase().includes(searchLower));
    }

    return String(value).toLowerCase().includes(searchLower);
  });

  if (fromFields) return true;

  return (extraSearchGetters ?? []).some((getter) => {
    const value = getter(item);
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) {
      return value.some((v) => String(v).toLowerCase().includes(searchLower));
    }
    return String(value).toLowerCase().includes(searchLower);
  });
}

export function filterItems<T>(
  items: T[],
  searchText: string,
  selectedFilters: Record<string, string[]>,
  searchFields: (keyof T)[],
  filterResolvers?: Record<string, FilterResolver<T>>,
  extraSearchGetters?: FilterResolver<T>[]
): T[] {
  return items.filter((item) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      if (
        !matchesSearchText(item, searchLower, searchFields, extraSearchGetters)
      ) {
        return false;
      }
    }

    for (const [filterKey, selectedValues] of Object.entries(selectedFilters)) {
      if (selectedValues.length === 0) continue;

      const resolver = filterResolvers?.[filterKey];
      const itemValues = valuesForFilter(item, filterKey, resolver);

      if (itemValues.length === 0) return false;

      const matchesFilter = itemValues.some((v) => selectedValues.includes(v));
      if (!matchesFilter) return false;
    }

    return true;
  });
}

/**
 * Initialize filter configs from item data
 */
export function initializeFilters<T>(
  items: T[],
  filterDefinitions: FilterFieldDef<T>[]
): FilterConfig[] {
  return filterDefinitions.map(({ key, title, getValue }) =>
    extractFilterOptions(items, key, title, getValue)
  );
}

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import FilterCheckbox from './FilterCheckbox';

interface FilterSectionProps {
  title: string;
  options: { value: string; label: string; count?: number }[];
  selectedValues: string[];
  onChange: (value: string, checked: boolean) => void;
  defaultExpanded?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  options,
  selectedValues,
  onChange,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left mb-3"
      >
        <span className="text-sm font-bold text-gray-900">{title}</span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="space-y-1">
          {options.map((option) => (
            <FilterCheckbox
              key={option.value}
              label={option.label}
              value={option.value}
              count={option.count}
              checked={selectedValues.includes(option.value)}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterSection;
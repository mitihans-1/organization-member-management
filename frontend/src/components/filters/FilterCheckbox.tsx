import React from 'react';

interface FilterCheckboxProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
  count?: number;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
  label,
  value,
  checked,
  onChange,
  count,
}) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(value, e.target.checked)}
        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      />
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      {count !== undefined && (
        <span className="text-xs font-bold text-gray-400">{count}</span>
      )}
    </label>
  );
};

export default FilterCheckbox;
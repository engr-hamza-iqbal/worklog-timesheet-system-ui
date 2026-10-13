import React from 'react';
import SearchableSelect from '../../../components/SearchableSelect.jsx';

export default function SearchableEmployeeSelect({
  users = [],
  selectedId = '',
  onSelect,
  disabled = false,
}) {
  return (
    <div className="w-full sm:w-80">
      <SearchableSelect
        items={users}
        selectedId={selectedId}
        onSelect={onSelect}
        disabled={disabled}
        placeholder="Select employee..."
        searchPlaceholder="Search by name or email..."
        emptyMessage="No employees"
        getItemLabel={(u) => u.name}
        getItemSubtext={(u) => u.email}
        renderIcon={(u, isSelected) => (
          <div
            className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      />
    </div>
  );
}

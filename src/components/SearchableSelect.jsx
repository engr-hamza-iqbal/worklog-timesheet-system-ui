import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  id,
  items = [],
  selectedId = null,
  onSelect,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  getItemLabel = (item) => item?.name || item?.title || item?.label || '',
  getItemSubtext = (item) => item?.email || item?.description || item?.subtext || null,
  getItemBadge = () => null, // e.g. { label: 'Admin', variant: 'violet' }
  getItemNote = () => null,  // e.g. '(you)'
  renderIcon = null,         // (item, isSelected) => ReactNode
  filterItem = null,         // custom (item, searchTerm) => boolean
  disabled = false,
  className = '',
  dropdownWidthClass = 'w-full sm:w-96',
  emptyMessage = 'No options found',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) || null;
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    if (filterItem) {
      return items.filter((item) => filterItem(item, term));
    }
    return items.filter((item) => {
      const label = getItemLabel(item)?.toLowerCase() || '';
      const subtext = getItemSubtext(item)?.toLowerCase() || '';
      return label.includes(term) || subtext.includes(term);
    });
  }, [items, searchTerm, filterItem, getItemLabel, getItemSubtext]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (item) => {
    onSelect(item.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderItemIcon = (item, isSelected) => {
    if (renderIcon) {
      return renderIcon(item, isSelected);
    }
    const label = getItemLabel(item);
    const initial = label ? label.charAt(0).toUpperCase() : '•';
    return (
      <div
        className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
          isSelected
            ? 'bg-indigo-600 text-white'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
        }`}
      >
        {initial}
      </div>
    );
  };

  const selectedLabel = selectedItem ? getItemLabel(selectedItem) : '';
  const selectedSubtext = selectedItem ? getItemSubtext(selectedItem) : null;
  const selectedNote = selectedItem ? getItemNote(selectedItem) : null;

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-left text-sm text-slate-800 shadow-2xs hover:bg-slate-50 focus:border-slate-900 focus:outline-none transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedItem && renderItemIcon(selectedItem, false)}
          <div className="truncate">
            {selectedItem ? (
              <span className="font-medium text-slate-900">
                {selectedLabel}
                {selectedSubtext && (
                  <span className="text-slate-400 font-normal text-xs ml-1.5">
                    ({selectedSubtext})
                  </span>
                )}
                {selectedNote && (
                  <span className="text-[11px] text-slate-400 italic ml-1">
                    {selectedNote}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 ${dropdownWidthClass} max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-slate-400">
              <span>{filteredItems.length} found</span>
              {searchTerm && <span>Filtering by &ldquo;{searchTerm}&rdquo;</span>}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50 [scrollbar-width:thin]">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedId;
                const label = getItemLabel(item);
                const subtext = getItemSubtext(item);
                const badge = getItemBadge(item);
                const note = getItemNote(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left rounded-lg text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-950 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderItemIcon(item, isSelected)}
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium text-slate-900">
                            {label}
                          </span>
                          {note && (
                            <span className="text-[10px] text-slate-400 italic">
                              {note}
                            </span>
                          )}
                        </div>
                        {subtext && (
                          <div className="truncate text-[11px] text-slate-500">
                            {subtext}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            badge.variant === 'violet'
                              ? 'bg-violet-100 text-violet-700'
                              : badge.variant === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {badge.label}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="text-indigo-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {emptyMessage} {searchTerm ? `matching "${searchTerm}"` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

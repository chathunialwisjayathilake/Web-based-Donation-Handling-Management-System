import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';

const FilterBar = ({ 
  itemCount, 
  filters = { category: '', priority: '', status: '', search: '' }, 
  onFilterChange 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categories, setCategories] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setActiveDropdown(null);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleSearch = (e) => {
    const newFilters = { ...filters, search: e.target.value };
    if (onFilterChange) onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { category: '', priority: '', status: '', search: '' };
    if (onFilterChange) onFilterChange(cleared);
  };

  const filterOptions = {
    category: categories.map(c => c.name),
    priority: ['CRITICAL', 'URGENT', 'ROUTINE'],
    status: ['PENDING', 'APPROVED', 'COMPLETED'],
    sort: [
      { label: 'Newest First', value: 'newest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Quantity: High-Low', value: 'qty_desc' },
      { label: 'Quantity: Low-High', value: 'qty_asc' }
    ]
  };

  return (
    <div className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between font-['Work_Sans'] relative z-40">
      <div className="flex items-center gap-3 w-full" ref={dropdownRef}>
        <div className="relative w-72 group mr-2">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">search</span>
          <input 
            value={filters.search}
            onChange={handleSearch}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 placeholder:text-slate-400 transition-all focus:bg-white" 
            placeholder="Search Ledger Name..." 
            type="text"
          />
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>

        {['category', 'priority', 'status', 'sort'].map((key) => (
          <div key={key} className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}
              className={`px-5 py-2.5 rounded-2xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all ${
                filters[key] 
                  ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' 
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 group'
              }`}
            >
              <span className="flex items-center gap-2">
                {key === 'sort' && <span className="material-symbols-outlined text-sm">swap_vert</span>}
                {filters[key] || key}
              </span>
              <span className={`material-symbols-outlined text-lg transition-transform ${activeDropdown === key ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {activeDropdown === key && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 ml-2">Select {key}</div>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => handleSelect(key, '')}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-500 transition-colors uppercase tracking-widest"
                  >
                    All {key === 'sort' ? 'Defaults' : `${key}s`}
                  </button>
                  {filterOptions[key].map((option) => (
                    <button
                      key={option.value || option}
                      onClick={() => handleSelect(key, option.value || option)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${
                        filters[key] === (option.value || option)
                          ? 'bg-primary text-white shadow-lg' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {option.label || option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        
        {(filters.category || filters.priority || filters.status || filters.search) && (
          <button 
            onClick={clearFilters}
            className="text-[10px] font-bold text-primary hover:text-red-600 px-4 uppercase tracking-[0.2em] transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>
      
      {itemCount >= 0 && (
        <div className="text-[10px] font-bold text-slate-400 px-4 whitespace-nowrap uppercase tracking-widest border-l border-slate-100 ml-4 py-2">
          Found <span className="text-slate-900">{itemCount}</span> Match{itemCount !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

import React, { useState } from 'react';
import FilterBar from './FilterBar';
import CategoryTable from './CategoryTable';

import AddCategoryModal from './AddCategoryModal';

const ManageCategories = ({ onAddNew }) => {
  const [categoryCount, setCategoryCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsAddModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 font-['Work_Sans']">Item Categories</h1>
          <p className="text-slate-500 mt-2 font-medium">Define and organize stewardship classifications for medical inventory.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setIsAddModalOpen(true);
          }}
          className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined font-semibold">add</span>
          Add New Category
        </button>
      </section>

      {/* Filters Section */}
      <FilterBar itemCount={categoryCount} />

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <CategoryTable 
          onCountChange={setCategoryCount} 
          refreshKey={refreshKey} 
          onEdit={handleEdit}
        />
        
        {/* Simple Footer for Consistency */}
        <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Total Classifications: <span className="text-slate-900">{categoryCount} Categories</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCategoryModal 
        isOpen={isAddModalOpen} 
        category={editingCategory}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCategory(null);
        }} 
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setIsAddModalOpen(false);
          setEditingCategory(null);
        }}
      />
    </div>
  );
};

export default ManageCategories;

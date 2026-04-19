import React, { useState } from 'react';
import api from '../../utils/api';

const CategoryTable = ({ onCountChange, refreshKey, onEdit }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 6;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
      if (onCountChange) onCountChange(response.data.length);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold animate-pulse">Synchronizing categories...</p>
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(categories.length / ROWS_PER_PAGE);
  const currentCategories = categories.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/30">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Category Name</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Description</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Linked Items</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Status</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Last Modified</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-['Work_Sans']">
            {currentCategories.map((cat) => (
              <tr key={cat.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform font-bold">
                      <span className="material-symbols-outlined">category</span>
                    </div>
                    <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{cat.name}</div>
                  </div>
                </td>
                <td className="px-6 py-6 text-xs text-slate-500 font-medium">{cat.description || 'No description provided'}</td>
                <td className="px-6 py-6">
                  <div className="text-sm font-bold text-slate-900">{cat.attributes?.length || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[#db322f]">Attributes</div>
                </td>
                <td className="px-6 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${cat.status === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                    {cat.status}
                  </span>
                </td>
                <td className="px-6 py-6 text-[11px] font-semibold text-slate-500">
                  {new Date(cat.createdAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit && onEdit(cat)}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to retire "${cat.name}"?`)) {
                          try {
                            await api.delete(`/categories/${cat.id}`);
                            fetchCategories();
                          } catch (err) {
                            alert("Error retiring category: " + err.message);
                          }
                        }
                      }}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-600 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stewardship Navigation Bar */}
      {totalPages > 1 && (
        <div className="px-8 py-5 border border-slate-100 rounded-[20px] bg-white flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900">{Math.min(categories.length, (currentPage - 1) * ROWS_PER_PAGE + 1)}</span> to <span className="text-slate-900">{Math.min(categories.length, currentPage * ROWS_PER_PAGE)}</span> of <span className="text-slate-900">{categories.length}</span> categories
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import axios from 'axios';

const InventoryTable = ({ activeTab, filters, onCountChange, onEdit, page = 1, onPaginationChange }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { category, priority, status, search, sort } = filters || {};

        console.log("🔍 FETCHING LEDGER:", { page, category, priority, status, search, sort });

        const response = await api.get(`/item-donations`, {
          signal: controller.signal,
          params: {
            page,
            limit: 6,
            category,
            priority,
            status,
            search,
            sort,
            activeTab
          }
        });

        // Handle new paginated response format
        const { items: rawData, total, totalPages: fetchedTotalPages } = response.data;
        console.log("✅ FETCH SUCCESS:", { count: rawData?.length, total });

        const mappedItems = (rawData || []).map(item => ({
          id: item.id,
          name: item.itemName,
          category: item.category || 'Uncategorized',
          priority: item.priority ? item.priority.charAt(0) + item.priority.slice(1).toLowerCase() : 'Medium',
          quantity: item.quantity,
          unit: 'units',
          imageUrl: item.imageUrl,
          status: item.status === 'PENDING' ? 'Pending Approval' :
            item.status === 'APPROVED' ? 'Available' : 'Completed',
          updated: new Date(item.createdAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
          }),
          donorName: item.donor?.name || 'Anonymous',
          icon: item.category?.toLowerCase().includes('masks') ? 'masks' :
            item.category?.toLowerCase().includes('blood') ? 'bloodtype' : 'inventory_2',
          iconBg: item.status === 'PENDING' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
        }));

        setItems(mappedItems);
        if (onCountChange) onCountChange(total);
        if (onPaginationChange) onPaginationChange({ total, totalPages: fetchedTotalPages });
        setError(null);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('❌ FETCH ERROR:', err);
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [activeTab, page, filters]);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold animate-pulse">Fetching inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
        <p className="text-slate-600 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-slate-300 text-5xl">inventory_2</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Inventory Found</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">
          The stewardship ledger is currently empty. Direct donations from donors will appear here once registered.
        </p>
        <button className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all">
          Register First Item
        </button>
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-50 bg-slate-50/30">
          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Item Name & Donor</th>
          <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Category</th>
          <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Priority</th>
          <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Quantity</th>
          <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Registered</th>
          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="font-['Work_Sans']">
        {items.map((item) => (
          <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
            <td className="px-8 py-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden font-bold`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined">{item.icon}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">By {item.donorName}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-6 font-medium text-xs text-slate-600">{item.category}</td>
            <td className="px-6 py-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.priority === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100 shadow-[0_0_15px_rgba(220,38,38,0.1)]' :
                item.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                  'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                {item.priority}
              </span>
            </td>
            <td className="px-6 py-6">
              <div className="text-base font-semibold text-slate-900">{item.quantity}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</div>
            </td>
            <td className="px-6 py-6 font-medium">
              <div className="text-[11px] font-semibold text-slate-500">{item.updated.split(',')[0]}</div>
              <div className="text-[10px] text-slate-400 font-medium">{item.updated.split(',')[1]}</div>
            </td>
            <td className="px-8 py-6 text-right relative">
              <div className="flex justify-end gap-2 transition-opacity">
                <button
                  onClick={() => onEdit && onEdit(item)}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30 rounded-xl shadow-sm hover:shadow-md transition-all"
                  title="Edit Item"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to retire "${item.name}"? This action is permanent.`)) {
                      api.delete(`/item-donations/${item.id}`)
                        .then(() => {
                          setItems(items.filter(i => i.id !== item.id));
                          if (onCountChange) onCountChange(items.length - 1);
                        })
                        .catch(err => alert("Error retiring item: " + err.message));
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 rounded-xl shadow-sm hover:shadow-md transition-all"
                  title="Delete Item"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;

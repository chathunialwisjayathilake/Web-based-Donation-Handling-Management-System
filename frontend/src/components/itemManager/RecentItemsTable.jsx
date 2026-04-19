import React from 'react';

const RecentItemsTable = ({ items = [] }) => {
  const getStatusColor = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 5) return 'bg-red-50 text-red-600 border border-red-100';
    if (qty <= 15) return 'bg-orange-50 text-orange-600 border border-orange-100';
    return 'bg-blue-50 text-blue-600 border border-blue-100';
  };

  const getStatusText = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 5) return 'Critical';
    if (qty <= 15) return 'Low Stock';
    return 'Sufficient';
  };

  return (
    <section className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(7,28,54,0.06)] border border-slate-100 overflow-hidden">
      <div className="px-10 py-8 flex justify-between items-center border-b border-slate-50">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 font-['Work_Sans'] tracking-tight">Recently Cataloged Assets</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Latest entries in the stewardship ledger.</p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Sufficient
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
            Critical
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <th className="px-10 py-5">Asset Specification</th>
              <th className="px-8 py-5">Classification</th>
              <th className="px-8 py-5">Availability</th>
              <th className="px-8 py-5">Origin / Donor</th>
              <th className="px-8 py-5">Recorded On</th>
              <th className="px-10 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-['Work_Sans']">
            {items.length > 0 ? items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{item.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">ID: {item.id.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-semibold text-slate-600">{item.category}</td>
                <td className="px-8 py-6">
                  <div className="text-sm font-bold text-slate-900">{item.quantity}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</div>
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500">{item.donor?.name || 'Anonymous'}</td>
                <td className="px-8 py-6">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  <span className={`px-4 py-1.5 ${getStatusColor(item.quantity)} text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm`}>
                    {getStatusText(item.quantity)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-10 py-20 text-center text-slate-400 font-medium italic">
                  No assets cataloged in the recent history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-10 py-6 bg-slate-50/50 flex justify-center border-t border-slate-50">
        <button className="text-xs font-bold text-slate-400 hover:text-primary tracking-[0.15em] uppercase flex items-center gap-3 transition-colors">
          View Full Stewardship Ledger
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};

export default RecentItemsTable;

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const ItemHeader = () => {
  const { user } = useAuth();

  return (
    <header className="w-full h-20 sticky top-0 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 z-30 border-b border-slate-100">
      <div className="flex items-center gap-6">
        {/* Global search removed as requested - using filter-based search instead */}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <NotificationCenter />
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 font-['Work_Sans']">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">{user?.username || 'Blood Manager'}</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Inventory Lead</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
            <span className="text-sm font-semibold text-slate-500">{user?.username?.charAt(0) || 'A'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ItemHeader;

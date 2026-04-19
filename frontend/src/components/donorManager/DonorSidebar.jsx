import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DonorSidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { id: 'donors', title: 'Active Donors', icon: 'group' },

  ];

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-40 w-80 bg-[#0a1526] border-r border-white/5 overflow-hidden">
      {/* Glossy Background Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-[#db322f]/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Brand Header */}
      <div className="px-10 py-12 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <i className="fa-solid fa-heart-pulse text-white text-2xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight text-white font-['Work_Sans'] leading-none uppercase italic">Healio</div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1.5 whitespace-nowrap">Donor Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 py-4 space-y-2 relative z-10 overflow-y-auto font-['Inter']">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-4 mb-6 opacity-50">Operations</div>
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ x: 6 }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-500 group relative ${activeTab === item.id
              ? 'bg-gradient-to-r from-[#db322f] to-[#db322f] text-white shadow-xl shadow-[#db322f]/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeGlow"
                className="absolute inset-0 bg-white/10 rounded-3xl blur-md"
              />
            )}
            <span className={`material-symbols-outlined text-[24px] ${activeTab === item.id ? 'text-white' : 'group-hover:text-[#db322f] transition-colors'}`}>
              {item.icon}
            </span>
            <span className="font-bold text-sm tracking-tight">{item.title}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-8 relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-white/10">
            {user?.username?.charAt(0) || 'D'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white truncate">{user?.username || 'Donor_manager'}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">engagement lead</div>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        </div>

        <button
          onClick={logout}
          className="w-full mt-6 flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-rose-400 transition-colors group font-bold text-xs uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DonorSidebar;

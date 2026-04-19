import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const FundSidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { id: 'manage_funds', title: 'Manage Funds', icon: 'account_balance_wallet' },
    { id: 'requests', title: 'Hospital Requests', icon: 'payments' },
    { id: 'donations', title: 'Donor Contributions', icon: 'volunteer_activism' },
    { id: 'campaigns', title: 'Fund Campaign', icon: 'campaign' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-40 w-72 bg-[#0a1526] border-r border-white/5 overflow-hidden">
      {/* Glossy Background Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Brand Header */}
      <div className="px-8 py-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <i className="fa-solid fa-heart-pulse text-white text-xl"></i>
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-tight text-white font-['Work_Sans'] leading-none">Healio</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1 whitespace-nowrap">Fund Manager Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2 space-y-1 relative z-10 overflow-y-auto font-['Work_Sans']">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-4 mb-4">Financial Operations</div>
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ x: 4 }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id
              ? 'bg-gradient-to-r from-primary to-[#db322f] text-white shadow-lg shadow-primary/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === item.id ? 'text-white' : 'group-hover:text-primary transition-colors'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-semibold tracking-wide font-['Inter']">{item.title}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Footer / User Profile Section */}
      <div className="p-6 border-t border-white/5 relative z-10 bg-black/10">
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <span className="text-lg font-bold text-white uppercase">{user?.username?.charAt(0) || 'F'}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0a1526] rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.username || 'Fund Manager'}</div>
            <div className="text-[11px] font-medium text-slate-500 truncate lowercase">Financial Lead</div>
          </div>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-semibold text-left">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all text-sm font-semibold text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FundSidebar;

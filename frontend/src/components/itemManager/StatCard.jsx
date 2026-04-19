import React from 'react';

const StatCard = ({ title, value, subtext, icon, trend, isPrimary }) => {
  return (
    <div className={`${isPrimary ? 'bg-primary text-white shadow-[0_20px_40px_rgba(183,19,26,0.15)]' : 'bg-white p-6 rounded-lg shadow-[0_20px_40px_rgba(7,28,54,0.06)] border border-outline-variant/5'} p-6 rounded-lg flex flex-col justify-between min-h-[160px] relative overflow-hidden`}>
      {isPrimary && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      )}
      <div className="flex justify-between items-start relative z-10">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isPrimary ? 'text-white/70' : 'text-slate-500'}`}>
          {title}
        </span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPrimary ? 'bg-white/10' : 'bg-slate-50 text-primary'}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="relative z-10">
        <div className={`text-4xl font-semibold ${isPrimary ? 'text-white' : 'text-slate-900'} tracking-tight`}>
          {value}
        </div>
        {trend ? (
          <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${isPrimary ? 'text-white/80' : 'text-green-600'}`}>
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {trend}
          </div>
        ) : (
          <div className={`text-xs font-medium mt-1 ${isPrimary ? 'text-white/80' : 'text-slate-500'}`}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

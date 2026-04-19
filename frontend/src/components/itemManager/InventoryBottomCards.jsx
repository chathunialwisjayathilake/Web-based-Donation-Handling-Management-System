import React from 'react';

const InventoryBottomCards = () => {
  const cards = [
    {
      title: 'STOCK WARNING',
      desc: '4 high-priority items are reaching critical stock levels. Review procurement list.',
      action: 'View Priority Items',
      icon: 'trending_down',
      bg: 'bg-red-50 border-red-100',
      iconWrapper: 'bg-red-100 text-red-600',
      accent: 'text-red-700 hover:text-red-800'
    },
    {
      title: 'RECENT ACTIVITY',
      desc: 'Inventory was updated 15 minutes ago by Alexandria. 42 items logged.',
      action: 'View Full Log',
      icon: 'history',
      bg: 'bg-slate-50 border-slate-200',
      iconWrapper: 'bg-slate-200 text-slate-600',
      accent: 'text-slate-700 hover:text-slate-900'
    },
    {
      title: 'COLLABORATION',
      desc: 'Share this inventory view with Department Heads or Hospital Partners.',
      action: 'Export CSV/PDF',
      icon: 'share',
      bg: 'bg-blue-50/50 border-blue-100',
      iconWrapper: 'bg-blue-100 text-blue-600',
      accent: 'text-blue-700 hover:text-blue-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {cards.map((card, i) => (
        <div key={i} className={`p-8 rounded-[40px] border ${card.bg} flex gap-6 group hover:translate-y-[-4px] transition-all duration-300`}>
          <div className={`w-14 h-14 rounded-full ${card.iconWrapper} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
            <span className="material-symbols-outlined">{card.icon}</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-900 tracking-widest mb-2 uppercase">{card.title}</div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{card.desc}</p>
            <button className={`text-xs font-semibold underline decoration-2 underline-offset-4 ${card.accent} transition-colors uppercase tracking-widest`}>
              {card.action}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryBottomCards;

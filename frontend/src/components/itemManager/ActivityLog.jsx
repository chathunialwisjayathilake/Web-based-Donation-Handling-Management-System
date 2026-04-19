import React from 'react';

const ActivityLog = ({ items = [] }) => {
  const dynamicActivities = items.slice(0, 2).map(item => ({
    type: 'add',
    title: 'Asset Cataloged',
    description: `New batch of <span class="font-bold text-slate-900">${item.itemName}</span> (${item.quantity} units) verified by curator.`,
    time: new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    icon: 'add_task',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  }));

  const activities = [
    ...dynamicActivities,
    {
      type: 'update',
      title: 'Stock Synchronization',
      description: 'Inventory count for <span class="font-bold text-slate-900">Diagnostic Kits</span> adjusted for facility transfer.',
      time: '1 HOUR AGO',
      icon: 'sync',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      type: 'shipment',
      title: 'Logistics Dispatch',
      description: 'Batch #8922 forwarded to Regional Distribution Hub.',
      time: '4 HOURS AGO',
      icon: 'local_shipping',
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-500',
    },
  ];

  return (
    <div className="bg-white h-full rounded-2xl shadow-[0_20px_40px_rgba(7,28,54,0.06)] border border-outline-variant/5 p-8 flex flex-col font-['Work_Sans']">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Live Stewardship</h3>
        <button className="text-primary text-xs font-semibold hover:underline">View All</button>
      </div>
      <div className="flex-1 space-y-8">
        {activities.map((activity, index) => (
          <div key={index} className="flex gap-4 relative">
            {index !== activities.length - 1 && (
              <div className="absolute left-4 top-8 bottom-[-2rem] w-px bg-slate-100"></div>
            )}
            <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center ${activity.iconColor} flex-shrink-0 z-10`}>
              <span className="material-symbols-outlined text-lg">{activity.icon}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{activity.title}</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: activity.description.replace(/font-bold/g, 'font-semibold') }}></p>
              <div className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-tight">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
        <span className="material-symbols-outlined text-slate-400 text-3xl mb-2">auto_awesome</span>
        <div className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Intelligent Summary</div>
        <p className="text-[10px] text-slate-500 mt-2 font-medium">Donation volume is up 4% this morning. Recommended action: Restock Level 2 IV kits.</p>
      </div>
    </div>
  );
};

export default ActivityLog;

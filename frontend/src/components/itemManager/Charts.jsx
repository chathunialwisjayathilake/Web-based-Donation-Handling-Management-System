import React from 'react';

export const AvailabilityTrends = () => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const data = [40, 55, 45, 70, 65, 85, 95]; // Percentages for height

  return (
    <div className="bg-white p-8 rounded-lg shadow-[0_20px_40px_rgba(7,28,54,0.06)] border border-outline-variant/5">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Availability Trends</h3>
          <p className="text-sm text-slate-500">Historical flow of donor items over 30 days</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
          <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white text-slate-900 shadow-sm border border-slate-100">Monthly</button>
          <button className="px-4 py-1.5 text-xs font-bold rounded-md text-slate-500">Weekly</button>
        </div>
      </div>
      
      <div className="h-64 relative flex items-end justify-between gap-4 px-2">
        <div className="absolute inset-0 flex flex-col justify-between opacity-5">
          <div className="border-t border-slate-900 w-full"></div>
          <div className="border-t border-slate-900 w-full"></div>
          <div className="border-t border-slate-900 w-full"></div>
          <div className="border-t border-slate-900 w-full"></div>
        </div>
        
        {data.map((height, index) => (
          <div 
            key={index}
            style={{ height: `${height}%` }}
            className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-sm relative group transition-all duration-500"
          >
            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded">
              {(height * 100).toLocaleString()} units
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4 px-2">
        {weeks.map(week => (
          <span key={week} className="text-[10px] font-bold text-slate-500 uppercase">{week}</span>
        ))}
      </div>
    </div>
  );
};

export const DistributionDonut = ({ data = [] }) => {
  const colors = ['#b7131a', '#0f172a', '#94a3b8', '#cbd5e1', '#f1f5f9'];
  
  // If no data, show a placeholder state
  const hasData = data && data.length > 0;
  const mainStat = hasData ? `${data[0].percentage}%` : '0%';
  const mainLabel = hasData ? data[0].name : 'No Data';

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-[0_20px_40px_rgba(7,28,54,0.06)] border border-slate-100 flex flex-col h-full">
      <h3 className="text-xl font-bold text-slate-900 mb-6 font-['Work_Sans']">Stock Distribution</h3>
      <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
        <div className="w-44 h-44 rounded-full border-[14px] border-slate-50 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{mainStat}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mt-1">{mainLabel}</div>
          </div>
        </div>
        
        {/* SVG Ring for first segment (main visualization) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-44 h-44 transform -rotate-90">
            <circle 
              cx="88" 
              cy="88" 
              fill="transparent" 
              r="81" 
              stroke={hasData ? colors[0] : '#f1f5f9'} 
              strokeDasharray={`${hasData ? (data[0].percentage / 100) * 508 : 0} 508`} 
              strokeLinecap="round" 
              strokeWidth="14"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {hasData ? data.slice(0, 4).map((item, index) => (
          <div key={item.name} className="flex justify-between items-center group">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
              <span className="text-xs font-semibold text-slate-600 transition-colors">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{item.count} items</span>
              <span className="text-xs font-bold text-slate-900">{item.percentage}%</span>
            </div>
          </div>
        )) : (
          <p className="text-center text-slate-400 text-xs py-4">No categories recorded yet.</p>
        )}
      </div>
    </div>
  );
};

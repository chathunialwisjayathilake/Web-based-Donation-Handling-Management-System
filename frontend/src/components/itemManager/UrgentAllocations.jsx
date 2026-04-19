import React from 'react';

const UrgentAllocations = () => {
  const requests = [
    { name: 'Ventilator X-200', hospital: 'St. Jude Trauma' },
    { name: 'Sterile Kits (500)', hospital: 'City General' },
    { name: 'Plasma O-Negative', hospital: 'Burn Center' },
  ];

  return (
    <div className="bg-[#071c36] p-8 rounded-lg shadow-[0_20px_40px_rgba(7,28,54,0.06)] text-white relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <span className="material-symbols-outlined text-7xl">emergency_home</span>
      </div>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
        Urgent Allocations
      </h3>
      <div className="space-y-4 relative z-10">
        {requests.map((req, index) => (
          <div key={index} className="p-4 bg-white/5 rounded-lg flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
            <div>
              <div className="text-sm font-bold">{req.name}</div>
              <div className="text-[10px] text-white/50">Hospital: {req.hospital}</div>
            </div>
            <span className="material-symbols-outlined text-primary text-sm">arrow_forward_ios</span>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-3 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#071c36] transition-all">
        View Dispatch Queue
      </button>
    </div>
  );
};

export default UrgentAllocations;

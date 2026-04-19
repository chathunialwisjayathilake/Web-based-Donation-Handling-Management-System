import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BloodOverview = () => {
    const [stats, setStats] = useState({
        totalUnits: 0,
        criticalTypes: [],
        pendingRequests: 0,
        recentDonations: []
    });
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stockRes = await api.get('/hospital-requests/blood/stock');
                const reqRes = await api.get('/hospital-requests/blood/all');
                
                setStocks(stockRes.data);
                const total = stockRes.data.reduce((acc, curr) => acc + curr.units, 0);
                const critical = stockRes.data.filter(s => s.units < 10).map(s => s.bloodType);
                const pending = reqRes.data.filter(r => r.status === 'PENDING').length;

                setStats({
                    totalUnits: total,
                    criticalTypes: critical,
                    pendingRequests: pending,
                    recentDonations: [] // Placeholder for now
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-10 space-y-12 max-w-[1700px] mx-auto font-['Work_Sans'] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Hematology Core</h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg italic">Strategic oversight of the municipal life-blood reserve and hospital distribution.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">emergency</span>
                        Broadcast Alert
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl">bloodtype</span>
                        </div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 font-['Inter']">Net Reserve Volume</div>
                        <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                            {loading ? "..." : stats.totalUnits} <span className="text-xl text-slate-300 font-bold tracking-normal uppercase ml-2">Units</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-green-600 font-bold text-sm">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            <span>Optimal Supply Level</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl">priority_high</span>
                        </div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 font-['Inter']">Critical Deficits</div>
                        <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                            {loading ? "..." : stats.criticalTypes.length} <span className="text-xl text-slate-300 font-bold tracking-normal uppercase ml-2">Groups</span>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2 text-orange-600 font-bold text-sm">
                            {stats.criticalTypes.map(t => (
                                <span key={t} className="px-2 py-0.5 bg-orange-50 rounded-md border border-orange-100 tracking-tighter">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-sm bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-red-600/20 blur-[80px] rounded-full"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                            <span className="material-symbols-outlined text-3xl">medical_services</span>
                        </div>
                        <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 font-['Inter']">Hospital Queue</div>
                        <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
                            {loading ? "..." : stats.pendingRequests}
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-red-500 font-bold text-sm">
                            <span className="material-symbols-outlined text-lg animate-pulse">emergency</span>
                            <span>Pending Dispatch</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600">monitor_heart</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Supply Health Index</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Synchronization Active</span>
                     </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => {
                            const stock = stocks.find(s => s.bloodType === type);
                            const units = stock?.units || 0;
                            const percentage = Math.min(100, (units / 50) * 100);
                            return (
                                <div key={type} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-red-200 transition-colors group">
                                    <div className="text-sm font-black text-slate-400 mb-2">{type}</div>
                                    <div className="flex items-end gap-2">
                                        <div className="text-3xl font-black text-slate-900 tabular-nums">{units}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Units</div>
                                    </div>
                                    <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${units < 10 ? 'bg-red-600' : 'bg-green-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-slate-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                         <div className="space-y-6">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                <span className="material-symbols-outlined text-red-500">campaign</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Emergency <br/>Drive Protocol</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed italic">Initiate a metropolitan-wide emergency notification for O- and A+ deficits.</p>
                         </div>
                         <button className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all mt-8">
                             Trigger Protocol 7.0
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodOverview;

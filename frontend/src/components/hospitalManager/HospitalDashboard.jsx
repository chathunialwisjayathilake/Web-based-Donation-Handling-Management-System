import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../itemManager/StatCard';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingItems: 0,
    pendingFunds: 0,
    pendingBlood: 0,
    receivedItemTotal: 0,
    receivedBloodTotal: 0,
    receivedFundTotal: 0,
    recentActivity: []
  });
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitalAndStats = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1. Get hospital data for current user
        const hospitalRes = await api.get(`/hospitals/user/${user.id}`);
        const hospitalData = hospitalRes.data;
        
        if (!hospitalData?.id) {
            setError("Hospital profile not found.");
            setLoading(false);
            return;
        }
        
        setHospital(hospitalData);

        // 2. Fetch specific counts
        const [items, funds, blood] = await Promise.all([
            api.get(`/hospital-requests/item/hospital/${hospitalData.id}`),
            api.get(`/hospital-requests/fund/hospital/${hospitalData.id}`),
            api.get(`/hospital-requests/blood/hospital/${hospitalData.id}`)
        ]);

        // 3. Fetch History for Totals
        const historyRes = await api.get(`/hospital-requests/history/hospital/${hospitalData.id}`);
        const history = historyRes.data;

        setStats({
            totalRequests: items.data.length + funds.data.length + blood.data.length,
            pendingItems: items.data.filter(r => r.status === 'PENDING').length,
            pendingFunds: funds.data.filter(r => r.status === 'PENDING').length,
            pendingBlood: blood.data.filter(r => r.status === 'PENDING').length,
            receivedItemTotal: history.filter(h => h.type === 'ITEM').reduce((acc, h) => {
                const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) units/i)?.[1]) || 0;
                return acc + qty;
            }, 0),
            receivedBloodTotal: history.filter(h => h.type === 'BLOOD').reduce((acc, h) => {
                const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) units/i)?.[1]) || 0;
                return acc + qty;
            }, 0),
            receivedFundTotal: history.filter(h => h.type === 'FINANCE' || h.type === 'FUND').reduce((acc, h) => {
                const amt = parseFloat(h.amount) || parseFloat(h.details?.match(/LKR ([\d,]+)/)?.[1]?.replace(/,/g, '')) || 0;
                return acc + amt;
            }, 0),
            recentActivity: history.slice(0, 5) // Use history for activity too
        });

      } catch (error) {
        console.error("Error fetching hospital stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
        fetchHospitalAndStats();
    }
  }, [user]);

  return (
    <div className="p-10 space-y-12 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Work_Sans']">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Coordination Hub</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg italic">
            Managing logistics for <span className="text-primary font-bold">{hospital?.name || "LifeSource Medical Center"}</span>
          </p>
        </div>
        <div className="flex gap-4">
             <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">System Secure</span>
             </div>
        </div>
      </section>

      {error && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-6 text-red-700 shadow-sm"
        >
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <div>
                <div className="text-xl font-bold mb-1">{error}</div>
                <p className="text-sm font-medium opacity-80 leading-relaxed">Your coordination ledger cannot be synchronized because this account is not associated with an authorized hospital. Please contact the system administrator to link your profile.</p>
            </div>
        </motion.div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard
          title="Active Requests"
          value={loading ? "..." : stats.totalRequests}
          icon="analytics"
          trend="Real-time monitoring"
        />
        <StatCard
          title="Item Backlog"
          value={loading ? "..." : stats.pendingItems}
          icon="inventory_2"
          subtext="Pending fulfillment"
        />
        <StatCard
          title="Fund Proposals"
          value={loading ? "..." : stats.pendingFunds}
          icon="payments"
          subtext="In review"
        />
        <StatCard
          title="Blood Deficit"
          value={loading ? "..." : stats.pendingBlood}
          icon="bloodtype"
          subtext="Immediate needs"
          isPrimary={stats.pendingBlood > 0}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-4">
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-xl flex items-center gap-6 group hover:bg-white/60 transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl text-blue-600">inventory_2</span>
            </div>
            <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Items Received</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.receivedItemTotal} <span className="text-sm font-bold text-slate-400">Units</span></div>
            </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-xl flex items-center gap-6 group hover:bg-white/60 transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl text-red-600">bloodtype</span>
            </div>
            <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Blood Received</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.receivedBloodTotal} <span className="text-sm font-bold text-slate-400">Pints</span></div>
            </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-xl flex items-center gap-6 group hover:bg-white/60 transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl text-green-600">payments</span>
            </div>
            <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Funds</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">LKR {stats.receivedFundTotal.toLocaleString()}</div>
            </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-10 text-['Work_Sans']">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.02)] min-h-[400px]">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline transition-all">View All Ledger</button>
             </div>
             
             <div className="space-y-4">
                {stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined uppercase">
                                    {activity.amount ? 'payments' : activity.units ? 'bloodtype' : 'inventory_2'}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800">{activity.itemName || (activity.bloodType ? `${activity.bloodType} (${activity.units} Pints)` : `Fund Request: LKR ${activity.amount}`)}</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                    {new Date(activity.createdAt).toLocaleDateString()} • {activity.priority}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                 activity.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 
                                 activity.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                             }`}>
                                {activity.status}
                             </div>
                             <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
             <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="material-symbols-outlined text-8xl">local_hospital</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Urgent Dispatch</h3>
                    <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">System identified 2 critical blood shortages in your region. Propose a transfer?</p>
                    <button className="w-full py-4 bg-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Initiate Coordination
                    </button>
                </div>
             </div>

             <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Regional Hubs</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400 text-sm">apartment</span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate leading-none mb-1">Central Blood Bank {i}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest truncate">Online • 2.4km Away</div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;

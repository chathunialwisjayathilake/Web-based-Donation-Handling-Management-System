import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const FundOverview = () => {
  const [stats, setStats] = useState({
    totalFunds: 0,
    activeRequests: 0,
    pendingTransfers: 0,
    recentDonations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [donationsRes, requestsRes] = await Promise.all([
          api.get('/fund-donations'),
          api.get('/hospital-requests/fund/all')
        ]);

        const donations = donationsRes.data || [];
        const requests = requestsRes.data || [];

        // Calculated available capital: Only include COMPLETED (Settled) donations
        const settledInflow = donations
          .filter(d => d.status === 'COMPLETED')
          .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

        const settledOutflow = requests
          .filter(r => r.status === 'COMPLETED')
          .reduce((sum, r) => sum + (parseFloat(r.approvedAmount || r.amount) || 0), 0);

        const BASE_CAPITAL = 20000;
        const currentCapital = Math.max(0, BASE_CAPITAL + settledInflow - settledOutflow);

        // Calculate statistics
        const activeReqs = requests.filter(r => r.status === 'PENDING').length;

        const urgentPending = requests.filter(r => r.status === 'PENDING' && (r.priority === 'URGENT' || r.priority === 'HIGH' || r.priority === 'EMERGENCY')).length;

        const formattedDonations = donations.slice(0, 5).map(d => ({
          id: d._id || d.id,
          donor: d.donor?.name || "Anonymous Donor",
          amount: parseFloat(d.amount) || 0,
          date: d.createdAt,
          status: d.status
        }));

        setStats({
          totalFunds: currentCapital,
          activeRequests: activeReqs,
          pendingTransfers: urgentPending > 0 ? urgentPending : activeReqs,
          recentDonations: formattedDonations
        });
      } catch (err) {
        console.error("Failed to fetch fund dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-[1700px] mx-auto font-['Work_Sans'] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Financial Dashboard</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg italic">Real-time stewardship of community-driven humanitarian capital.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">account_balance</span>
            Reconcile
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 font-['Inter']">Available Capital</div>
            <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
              LKR {loading ? "..." : stats.totalFunds.toLocaleString()}
            </div>
            <div className="mt-6 flex items-center gap-2 text-green-600 font-bold text-sm">
              <span className="material-symbols-outlined text-lg">trending_up</span>
              <span>+12.5% this month</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">rebase_edit</span>
            </div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 font-['Inter']">Active Allocations</div>
            <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
              {loading ? "..." : stats.activeRequests} <span className="text-xl text-slate-300 font-bold tracking-normal uppercase ml-2">Needs</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span>Waiting for review</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
              <span className="material-symbols-outlined text-3xl">priority_high</span>
            </div>
            <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 font-['Inter']">Urgent Transfers</div>
            <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
              {loading ? "..." : stats.pendingTransfers}
            </div>
            <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-lg animate-pulse">emergency</span>
              <span>Action Required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400">history</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Inflow</h3>
          </div>
          <button className="text-sm font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all">
            View Ledger History
            <span className="material-symbols-outlined text-lg italic">arrow_forward</span>
          </button>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="py-10 text-center text-slate-400">Synchronizing with blockchain...</div>
          ) : stats.recentDonations.length === 0 ? (
            <div className="py-10 text-center text-slate-400 italic">No recent inflows found.</div>
          ) : stats.recentDonations.map(donation => (
            <div key={donation.id} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 group hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase transition-transform group-hover:scale-110">
                  {donation.donor.charAt(0)}
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 tracking-tight">{donation.donor}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(donation.date).toLocaleDateString()} • Community Support</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 tracking-tight">+LKR {donation.amount.toLocaleString()}</div>
                <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">Settled</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundOverview;

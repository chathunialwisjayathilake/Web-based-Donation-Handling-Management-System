import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const DonorDashboard = () => {
    const [stats, setStats] = useState({
        totalDonors: 0,
        bloodUnits: 0,
        totalFunds: 0,
        activeCampaigns: 0,
        recentActivity: [],
        topCampaigns: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/donors/stats');
                setStats({
                    totalDonors: res.data.totalDonors,
                    bloodUnits: res.data.totalBloodUnits,
                    totalFunds: res.data.totalFunds,
                    activeCampaigns: res.data.activeCampaigns,
                    recentActivity: res.data.recentActivity || [],
                    topCampaigns: res.data.topCampaigns || []
                });
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: 'Registered Donors', value: stats.totalDonors, icon: 'group', color: 'text-primary', bg: 'bg-primary/10', trend: '+12% from last month' },
        { title: 'Blood Impact', value: `${stats.bloodUnits} Pints`, icon: 'water_drop', color: 'text-rose-500', bg: 'bg-rose-50', trend: 'Life saving contributions' },
        { title: 'Financial Aid', value: `LKR ${stats.totalFunds.toLocaleString()}`, icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'Community funded' },
        { title: 'Active Campaigns', value: stats.activeCampaigns, icon: 'campaign', color: 'text-amber-500', bg: 'bg-amber-50', trend: 'Active outreach drives' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header Area */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Ecosystem Overview</h1>
                <p className="text-slate-500 font-medium tracking-tight">Monitoring community engagement and donation throughput.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-[10px] font-black uppercase tracking-[0.2em] transform rotate-90 origin-top-right">Live Sync</div>
                        <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                            <span className="material-symbols-outlined text-3xl font-bold">{card.icon}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{card.title}</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                            <span className="material-symbols-outlined text-sm">show_chart</span>
                            {card.trend}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 opacity-50 -mr-20 -mt-20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity Log</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Unified feed of community contributions.</p>
                        
                        <div className="mt-10 space-y-8">
                            {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex gap-6 items-start group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-1.5 h-10 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-slate-100'} group-hover:scale-y-125 transition-transform duration-500`}></div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">{activity.type}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-['Inter']">
                                                {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium tracking-tight">
                                            {activity.donor} {activity.details}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                    <span className="material-symbols-outlined text-6xl">history</span>
                                    <p className="mt-4 font-black uppercase tracking-widest text-xs">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decorative Chart Placeholder */}
                    <div className="absolute bottom-10 right-10 w-48 h-48 opacity-5 grayscale pointer-events-none">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 80L30 50L50 60L70 20L90 40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                {/* Targeted Campaigns */}
                <div className="bg-[#0f172a] rounded-[40px] p-10 text-white relative flex flex-col shadow-2xl shadow-slate-900/40">
                    <div className="relative z-10 flex-1">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-2">Campaign Focus</div>
                        <h3 className="text-2xl font-black tracking-tight italic uppercase text-primary">Targeted Outreach</h3>
                        
                        <div className="mt-12 space-y-10">
                            {stats.topCampaigns.length > 0 ? stats.topCampaigns.map((camp, idx) => {
                                const donated = parseInt(camp.donatedQuantity) || 0;
                                const target = parseInt(camp.quantity) || 1;
                                const progress = Math.min(100, Math.round((donated / target) * 100));
                                return (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{camp.itemName || camp.title}</div>
                                            <div className="text-lg font-black tracking-tighter text-primary italic">{progress}%</div>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-primary' : 'bg-emerald-500'} shadow-[0_0_15px_rgba(219,50,47,0.3)]`}
                                            />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-10 text-center opacity-30 italic text-xs uppercase tracking-widest font-black">No active campaigns</div>
                            )}
                        </div>
                    </div>

                    <button className="w-full mt-12 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all duration-500">
                        Configure Campaigns
                    </button>
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full"></div>
                </div>
            </div>
        </motion.div>
    );
};

export default DonorDashboard;

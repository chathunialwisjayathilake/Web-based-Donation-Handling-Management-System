import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const DonorDetailModal = ({ isOpen, onClose, donorId, initialData, onSuccess }) => {
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('history');
    const [editData, setEditData] = useState({});

    useEffect(() => {
        if (isOpen && donorId) {
            // Pre-fill from initialData if available for immediate UI
            if (initialData) {
                setEditData({
                    name: initialData.name,
                    phone: initialData.phone,
                    address: initialData.address || '',
                    bloodType: initialData.bloodType || 'N/A'
                });
            }
            fetchDetails();
        }
    }, [isOpen, donorId, initialData]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/donors/${donorId}/details`);
            setDonor(res.data);
            setEditData({
                name: res.data.name,
                phone: res.data.phone,
                address: res.data.address,
                bloodType: res.data.bloodType
            });
        } catch (err) {
            console.error("Error fetching donor details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/donors/${donorId}`, editData);
            fetchDetails();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update donor profile.");
        }
    };

    if (!isOpen) return null;

    // Merge history for unified view
    const unifiedHistory = donor ? [
        ...(donor.history || []).map(h => ({ ...h, category: 'GENERAL' })),
        ...(donor.bloodDonations || []).map(b => ({
            ...b,
            type: 'Blood',
            details: `Donated ${b.bloodType} unit of blood.`,
            category: 'BLOOD'
        })),
        ...(donor.itemDonations || []).map(i => ({
            ...i,
            type: i.category === 'FINANCE' ? 'Fund' : 'Item',
            details: i.category === 'FINANCE' ? `Contributed LKR ${i.quantity} for a campaign.` : `Donated ${i.quantity} units of ${i.itemName}.`,
            category: i.category === 'FINANCE' ? 'FUND' : 'ITEM',
            date: i.createdAt
        })),
        ...(donor.fundDonations || []).map(f => ({
            ...f,
            type: 'Fund',
            details: `Uploaded a payment slip for LKR ${f.amount}.`,
            category: 'FUND',
            date: f.createdAt
        }))
    ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) : [];

    const totalFunds = donor ? (
        (donor.fundDonations?.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0) || 0) +
        (donor.itemDonations?.filter(i => i.category === 'FINANCE').reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || 0) +
        (donor.history?.filter(h => h.type === 'FINANCE' || h.type === 'FUND').reduce((acc, h) => acc + (parseFloat(h.amount) || 0), 0) || 0)
    ) : 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-['Work_Sans']">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                >
                    {/* Brand Header */}
                    <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-white z-10 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <span className="material-symbols-outlined text-3xl font-bold">person</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight capitalize italic">
                                    {donor?.name || initialData?.name || 'Loading Profile...'}
                                </h2>
                                <div className="flex items-center gap-3 mt-1.5 font-['Inter']">
                                    <span className="px-3 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100">
                                        Group {donor?.bloodType || initialData?.bloodType || 'N/A'}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-bold text-slate-400 italic">Donor Account ID: {donorId}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-900 group">
                            <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {/* Sidebar / Stats */}
                        <div className="w-80 border-r border-slate-50 bg-slate-50/30 p-10 flex flex-col gap-8 shrink-0">
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aggregate Impact</div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1 group hover:border-emerald-100 transition-colors">
                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Funds</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">LKR {totalFunds.toLocaleString()}</div>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1 group hover:border-rose-100 transition-colors">
                                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Blood Units</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{donor?.bloodDonations?.length || 0} <span className="text-sm text-slate-300 ml-1 italic font-bold">Pints</span></div>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1 group hover:border-amber-100 transition-colors">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Physical Items</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{(donor?.itemDonations?.filter(i => i.category !== 'FINANCE').length || 0)} <span className="text-sm text-slate-300 ml-1 italic font-bold">Items</span></div>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-1.5">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">View Controls</div>
                                {[
                                    { id: 'history', label: 'Universal History', icon: 'timeline' },
                                    { id: 'profile', label: 'Account Settings', icon: 'manage_accounts' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-lg ${activeTab === tab.id ? 'text-blue-500' : ''}`}>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-12 bg-white scroll-smooth">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 gap-4">
                                        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                                        <span className="text-xs font-black text-slate-300 italic uppercase tracking-widest">Hydrating Profile...</span>
                                    </motion.div>
                                ) : activeTab === 'history' ? (
                                    <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Ecosystem Activity Log</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unifiedHistory.length} Recorded Interventions</span>
                                        </div>

                                        <div className="space-y-1 relative">
                                            <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-slate-50"></div>
                                            {unifiedHistory.length > 0 ? unifiedHistory.map((item, idx) => (
                                                <div key={idx} className="flex gap-10 items-start relative z-10 py-5 group">
                                                    <div className={`w-16 h-16 rounded-2xl shadow-sm border flex items-center justify-center transition-all group-hover:scale-110 ${item.category === 'BLOOD' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-blue-50 border-blue-100 text-blue-500'
                                                        }`}>
                                                        <span className="material-symbols-outlined font-black">{item.category === 'BLOOD' ? 'water_drop' : 'payments'}</span>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm font-black text-slate-900 tracking-tight uppercase">
                                                                {item.type} Contribution
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                                {new Date(item.date || item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-500 italic max-w-xl line-clamp-2">
                                                            {item.details || 'A community intervention recorded through the Healio Stewardship Panel.'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference ID: {String(item._id).slice(-8)}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest border border-slate-100">finalized</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-20 text-center space-y-4 opacity-30">
                                                    <span className="material-symbols-outlined text-6xl">history_toggle_off</span>
                                                    <p className="text-sm font-bold italic text-slate-500">No community activity recorded for this donor account.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                        <form onSubmit={handleUpdate} className="max-w-xl space-y-8">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Account Settings</h3>
                                                <p className="text-slate-500 text-sm font-medium italic mt-1 font-['Inter']">Managing account parameters and identity vectors.</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
                                                    <input
                                                        value={editData.name}
                                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-black text-slate-900 tracking-tight"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Match Type (Blood)</label>
                                                    <select
                                                        value={editData.bloodType}
                                                        onChange={(e) => setEditData({ ...editData, bloodType: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-black text-slate-900 tracking-tight italic"
                                                    >
                                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                                            <option key={type} value={type}>{type} Group</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3 col-span-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Nexus (Phone)</label>
                                                    <input
                                                        value={editData.phone}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            const hasPlus = val.startsWith('+');
                                                            const digits = val.replace(/\D/g, '').slice(0, 11);
                                                            val = (hasPlus ? '+' : '') + digits;
                                                            setEditData({ ...editData, phone: val });
                                                        }}
                                                        maxLength="12"
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-black text-slate-900 tracking-tight tabular-nums"
                                                    />
                                                </div>
                                                <div className="space-y-3 col-span-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Address / Logistics Hub</label>
                                                    <textarea
                                                        rows="3"
                                                        value={editData.address}
                                                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium text-slate-600 italic"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-3"
                                            >
                                                <span className="material-symbols-outlined text-lg">save</span>
                                                Commit Account Changes
                                            </button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DonorDetailModal;

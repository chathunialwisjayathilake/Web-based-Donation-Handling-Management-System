import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import CreateCampaignModal from './CreateCampaignModal';
import NeedDonationsModal from '../itemManager/NeedDonationsModal';

const FundCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDonationsModalOpen, setIsDonationsModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital-requests/needs?status=all');
            // Filter for FINANCE only
            const financeCampaigns = res.data.filter(c => c.category === 'FINANCE');
            setCampaigns(financeCampaigns);
        } catch (err) {
            console.error("Error fetching campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to terminate this funding campaign?")) return;
        try {
            await api.delete(`/hospital-requests/needs/${id}`);
            fetchCampaigns();
        } catch (err) {
            console.error("Error deleting campaign:", err);
        }
    };

    const handleEdit = (campaign) => {
        setSelectedCampaign(campaign);
        setIsCreateModalOpen(true);
    };

    const handleTransfer = async (id) => {
        if (!window.confirm("Authorize immediate funds settlement to the primary hospital ledger? This move is irreversible and will mark funds as 'In Transit' to the hospital.")) return;
        try {
            await api.post(`/hospital-requests/needs/${id}/transfer`);
            fetchCampaigns();
        } catch (err) {
            console.error("Transfer failed:", err);
            alert(err.response?.data?.message || "Failed to transfer funds.");
        }
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-700 font-['Work_Sans'] text-slate-900">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight ">Fund Campaigns</h1>
                    <p className="text-slate-500 mt-2 font-medium italic tracking-tight text-lg">Managing active public-facing financial donation drives.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedCampaign(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="h-12 px-8 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-primary transition-all flex items-center gap-3 hover:scale-105 active:scale-95 group"
                >
                    <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform">add_circle</span>
                    <span>Launch Campaign</span>
                </button>
            </header>



            <NeedDonationsModal
                isOpen={isDonationsModalOpen}
                onClose={() => {
                    setIsDonationsModalOpen(false);
                    setSelectedCampaign(null);
                }}
                onStatusChange={fetchCampaigns}
                need={selectedCampaign}
            />

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-['Inter']">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Broadcast Detail</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Funding Pulse</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Curation</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                                            <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Outreach...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : campaigns.length > 0 ? campaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((campaign, index) => {
                                const target = parseFloat(campaign.quantity) || 0;
                                const currentWallet = parseFloat(campaign.donatedQuantity || 0);
                                const inTransit = parseFloat(campaign.pendingTransferQuantity || 0);
                                const settled = parseFloat(campaign.transferredQuantity || 0);
                                const totalReceived = currentWallet + inTransit + settled;
                                const progress = target > 0 ? (totalReceived / target) * 100 : 0;

                                return (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={campaign._id}
                                        className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        <td
                                            className="px-8 py-7 cursor-pointer group/cell"
                                            onClick={() => {
                                                setSelectedCampaign(campaign);
                                                setIsDonationsModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[24px] bg-slate-100 border border-slate-100/50 overflow-hidden shrink-0 shadow-inner group-hover/cell:scale-110 transition-transform duration-500 relative">
                                                    {campaign.imageUrl ? (
                                                        <>
                                                            <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                                                                <span className="material-symbols-outlined text-3xl">payments</span>
                                                            </div>
                                                            <img
                                                                src={campaign.imageUrl}
                                                                alt={campaign.title}
                                                                className="w-full h-full object-cover relative z-10"
                                                                onError={(e) => e.target.style.opacity = '0'}
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                            <span className="material-symbols-outlined text-3xl">payments</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-slate-900 tracking-tight text-lg line-clamp-1 group-hover/cell:text-primary transition-colors">{campaign.title}</div>
                                                    <p className="text-[11px] font-medium text-slate-400 italic line-clamp-1 max-w-[280px] mt-0.5 group-hover/cell:text-slate-500 transition-colors">"{campaign.description}"</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="w-64 space-y-3">
                                                <div className="flex justify-between items-end mb-1">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</div>
                                                    <div className="text-sm font-black text-slate-900 tracking-tighter tabular-nums">
                                                        LKR {totalReceived.toLocaleString()} <span className="text-slate-300 font-bold ml-1">/ {target.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-slate-50 rounded-full border border-slate-100/50 overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, progress)}%` }}
                                                        className="h-full bg-slate-900 rounded-full relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                                                    </motion.div>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                                    {Math.floor(progress)}% of Target Reached
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${campaign.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        campaign.priority === 'URGENT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {campaign.priority}
                                                </span>
                                                {campaign.status === 'COMPLETED' ? (
                                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[8px] font-black rounded-full w-fit uppercase tracking-widest border border-green-100">Completed</span>
                                                ) : campaign.status === 'FULFILLED' ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full w-fit uppercase tracking-widest border border-blue-100">Fulfilled</span>
                                                ) : campaign.imageUrl ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-full w-fit uppercase tracking-widest">Ready</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black rounded-full w-fit uppercase tracking-widest">Draft</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 text-right">
                                            <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                                {/* Transfer Button */}
                                                <button
                                                    disabled={currentWallet <= 0}
                                                    onClick={() => handleTransfer(campaign._id)}
                                                    title={currentWallet > 0 ? "Transfer collected funds to hospital" : "No funds available to transfer"}
                                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${currentWallet > 0
                                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                                            : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(campaign)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(campaign._id)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-rose-100 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete_sweep</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                                <span className="material-symbols-outlined text-5xl text-slate-200">campaign</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">Outreach silence detected</div>
                                                <p className="text-slate-400 max-w-sm mx-auto font-medium italic">Broadcast funding deficits from the ledger to engage community donors.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
                
                {Math.ceil(campaigns.length / rowsPerPage) > 1 && (
                  <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing <span className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * rowsPerPage, campaigns.length)}</span> of <span className="text-slate-900">{campaigns.length}</span> campaigns
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      {[...Array(Math.ceil(campaigns.length / rowsPerPage))].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={currentPage === Math.ceil(campaigns.length / rowsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>

            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedCampaign(null);
                }}
                onSuccess={fetchCampaigns}
                initialData={selectedCampaign}
            />

            <NeedDonationsModal
                isOpen={isDonationsModalOpen}
                onClose={() => {
                    setIsDonationsModalOpen(false);
                    setSelectedCampaign(null);
                }}
                need={selectedCampaign}
                onStatusChange={fetchCampaigns}
            />
        </div>
    );
};

export default FundCampaigns;

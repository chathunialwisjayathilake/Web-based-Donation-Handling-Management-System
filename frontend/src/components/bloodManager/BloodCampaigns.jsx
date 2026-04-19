import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import CurateNeedModal from '../itemManager/CurateNeedModal';
import BloodDonorsModal from './BloodDonorsModal';

const BloodCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDonorsModalOpen, setIsDonorsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/hospital-requests/needs?category=BLOOD&status=all');
            setCampaigns(response.data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleTransfer = async (id, amount) => {
        if (!window.confirm(`Are you sure you want to transfer ${amount} pints to the assigned hospital coordination? This will initiate a formal handover.`)) return;

        try {
            await api.post(`/hospital-requests/needs/${id}/transfer`);
            fetchCampaigns();
            alert("Pints successfully dispatched to hospital stewardship. Awaiting physical confirmation.");
        } catch (error) {
            console.error("Error transferring pints:", error);
            const errorMessage = error.response?.data?.message || "Failed to dispatch pints. Please ensure a hospital is assigned.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;

        try {
            await api.delete(`/hospital-requests/needs/${id}`);
            fetchCampaigns();
        } catch (error) {
            console.error("Error deleting campaign:", error);
            alert("Failed to delete campaign.");
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-100';
            case 'URGENT': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="p-8 space-y-8 font-['Work_Sans']">
            {/* Header section with stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Campaigns</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Manage public donation drives and emergency appeals.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setSelectedCampaign(null);
                            setIsEditModalOpen(true);
                        }}
                        className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>

                    </button>
                    <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{campaigns.length} Active Drives</span>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign Info</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target & Progress</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Schedule</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                                                <span className="text-slate-400 font-bold italic">Synchronizing campaign data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <span className="material-symbols-outlined text-4xl">campaign</span>
                                                <p className="font-bold italic text-slate-500">No active blood campaigns found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((campaign) => {
                                        const target = parseInt(campaign.quantity) || 1;
                                        const currentWallet = parseInt(campaign.donatedQuantity || 0);
                                        const inTransit = parseInt(campaign.pendingTransferQuantity || 0);
                                        const settled = parseInt(campaign.transferredQuantity || 0);
                                        const totalReceived = currentWallet + inTransit + settled;
                                        const totalTransferred = inTransit + settled;
                                        const progress = Math.min(100, (totalReceived / target) * 100);

                                        return (
                                            <motion.tr
                                                key={campaign._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                                            {campaign.imageUrl ? (
                                                                <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                    <span className="material-symbols-outlined">image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className="cursor-pointer group/title"
                                                            onClick={() => {
                                                                setSelectedCampaign(campaign);
                                                                setIsDonorsModalOpen(true);
                                                            }}
                                                        >
                                                            <div className="text-sm font-black text-slate-900 leading-tight group-hover/title:text-red-600 transition-colors">{campaign.title}</div>
                                                            <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">{campaign.itemName} Group</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-2 max-w-[180px]">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}%</span>
                                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{totalReceived} / {target} Pints</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-red-600 rounded-full transition-all duration-1000"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-1 text-slate-400 mt-2">
                                                            <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                                            <span className="text-[8px] font-bold uppercase tracking-[0.1em]">{totalTransferred} Pints Transferred</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1.5">
                                                            <span className="material-symbols-outlined text-[12px] text-slate-400">group</span>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{campaign.registeredDonorsCount || 0} Donors Registered</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-700">
                                                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                            <span className="text-[11px] font-bold">{campaign.date || 'Multiple Days'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                                            <span className="text-[10px] font-medium">{campaign.startTime && campaign.endTime ? `${campaign.startTime} - ${campaign.endTime}` : 'All Day'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(campaign.priority)}`}>
                                                        {campaign.priority}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <span className="material-symbols-outlined text-lg">location_on</span>
                                                        <span className="text-xs font-bold truncate max-w-[120px]">{campaign.location || 'Hospital Main'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        {parseInt(campaign.donatedQuantity || 0) > 0 && (
                                                            <button
                                                                onClick={() => handleTransfer(campaign._id, campaign.donatedQuantity)}
                                                                className="h-10 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                                                                title="Dispatch Pints to Hospital"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Transfer</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCampaign(campaign);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center group/btn"
                                                            title="Edit Campaign"
                                                        >
                                                            <span className="material-symbols-outlined text-lg group-hover/btn:rotate-12 transition-transform">edit_note</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(campaign._id)}
                                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center group/btn"
                                                            title="Remove Campaign"
                                                        >
                                                            <span className="material-symbols-outlined text-lg group-hover/btn:scale-110 transition-transform">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {campaigns.length > rowsPerPage && (
                <div className="px-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mt-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, campaigns.length)} of {campaigns.length} Campaigns
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-50 hover:text-slate-900 hover:bg-slate-100 transition-all font-black"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                        <span className="text-xs font-black text-slate-900 px-2 tracking-widest">
                            {currentPage} / {Math.ceil(campaigns.length / rowsPerPage)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(campaigns.length / rowsPerPage)))}
                            disabled={currentPage === Math.ceil(campaigns.length / rowsPerPage)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-50 hover:text-slate-900 hover:bg-slate-100 transition-all font-black"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CurateNeedModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCampaign(null);
                }}
                onSuccess={() => {
                    fetchCampaigns();
                }}
                need={selectedCampaign}
                defaultCategory="BLOOD"
                isFixedCategory={true}
            />
            <BloodDonorsModal
                isOpen={isDonorsModalOpen}
                onClose={() => {
                    setIsDonorsModalOpen(false);
                    setSelectedCampaign(null);
                }}
                campaign={selectedCampaign}
                onStatusChange={fetchCampaigns}
            />
        </div>
    );
};

export default BloodCampaigns;

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import CurateNeedModal from './CurateNeedModal';
import NeedDonationsModal from './NeedDonationsModal';

const ManageNeeds = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [isCurateModalOpen, setIsCurateModalOpen] = useState(false);
  const [isDonationsModalOpen, setIsDonationsModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 6;

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hospital-requests/needs?status=all');
      const filtered = (response.data || []).filter(n => n.category === 'ITEM' || n.category === 'BLOOD');
      setNeeds(filtered);
      setCurrentPage(1); // Reset to first page on fetch
    } catch (error) {
      console.error("Error fetching donation needs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, []);

  const handleTransfer = async (id, amount) => {
    if (!window.confirm(`Transfer ${amount} units of donated stock to hospital inventory management?`)) return;
    try {
      await api.post(`/hospital-requests/needs/${id}/transfer`);
      fetchNeeds();
      alert("Stock successfully transferred to hospital stewardship.");
    } catch (error) {
      console.error("Error transferring stock:", error);
      const errorMessage = error.response?.data?.message || "Failed to transfer stock. Please ensure a hospital is assigned to the campaign.";
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this broadcast request?")) return;
    try {
      await api.delete(`/hospital-requests/needs/${id}`);
      fetchNeeds();
    } catch (error) {
      console.error("Error deleting need:", error);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(needs.length / ROWS_PER_PAGE);
  const currentNeeds = needs.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-['Work_Sans']">Public Campaigns</h1>
          <p className="text-slate-500 mt-2 font-medium">Curate and manage hospital requests broadcasted to the donor community.</p>
        </div>
        <button
          onClick={() => {
            setSelectedNeed(null);
            setIsCurateModalOpen(true);
          }}
          className="h-12 px-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 font-bold text-sm tracking-tight"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          New Campaign
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Broadcast Detail</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Inventory Pulse</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Curation</th>
                <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-slate-400 font-medium">Synchronizing coordination ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentNeeds.length > 0 ? currentNeeds.map((need, index) => {
                  const target = parseInt(need.quantity) || 0;
                  const donated = parseInt(need.donatedQuantity) || 0;
                  const transferred = parseInt(need.transferredQuantity) || 0;
                  const totalReached = donated + transferred;
                  const progressPercent = target > 0 ? (totalReached / target) * 100 : 0;
                  const transferredPercent = target > 0 ? (transferred / target) * 100 : 0;

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      key={need._id}
                      className="group hover:bg-slate-50/20 transition-all border-b border-slate-50 last:border-0"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-[20px] bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100/50 overflow-hidden shadow-inner">
                            {need.imageUrl ? (
                              <img src={need.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300">campaign</span>
                            )}
                          </div>
                          <div
                            className="cursor-pointer group/title"
                            onClick={() => {
                              setSelectedNeed(need);
                              setIsDonationsModalOpen(true);
                            }}
                          >
                            <div className="font-bold text-slate-900 group-hover/title:text-primary transition-colors flex items-center gap-2 text-base">
                              {need.itemName}
                              {need.hasPendingDonations && (
                                <span className="flex h-2.5 w-2.5 relative" title={`${need.pendingDonationsCount} Pending Donations`}>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 max-w-[240px] truncate mt-0.5">
                              {need.title || 'Untitled Campaign'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-3 min-w-[200px]">
                          <div className="flex justify-between items-end">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-slate-900 tracking-tight">{totalReached}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ {target} {need.category === 'BLOOD' ? 'pints' : 'units'}</span>
                            </div>
                            {donated > 0 && (
                              <div className="flex items-center gap-1 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">{donated} {need.category === 'BLOOD' ? 'NEW' : 'NEW UNITS'}</span>
                              </div>
                            )}
                          </div>

                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            {/* Transferred Segment (Blue) */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${transferredPercent}%` }}
                              className="absolute left-0 top-0 h-full bg-blue-500 z-10"
                            />
                            {/* Pending/Donated Segment (Green) */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="absolute left-0 top-0 h-full bg-green-500 opacity-60"
                            />
                          </div>

                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{transferred} {need.category === 'BLOOD' ? 'Dispatched' : 'Transferred'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-60" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{donated} Available</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {need.status === 'COMPLETED' ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100 tracking-widest uppercase">Completed</span>
                        ) : need.status === 'FULFILLED' ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full border border-blue-100 tracking-widest uppercase">Fulfilled</span>
                        ) : need.imageUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 tracking-widest uppercase">Ready</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black rounded-full border border-orange-100 tracking-widest uppercase">Draft</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 transition-all duration-300">
                          {donated > 0 && (
                            <button
                              onClick={() => handleTransfer(need._id || need.id, donated)}
                              className="h-10 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                              title="Safe Transfer to Hospital"
                            >
                              <span className="material-symbols-outlined text-lg">move_to_inbox</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Transfer</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedNeed(need);
                              setIsCurateModalOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                            title="Edit Broadcast"
                          >
                            <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                          </button>
                          <button
                            onClick={() => handleDelete(need._id || need.id)}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                            title="Remove Broadcast"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-700">
                          <span className="material-symbols-outlined text-4xl text-slate-200">broadcast_on_off</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xl font-bold text-slate-900 tracking-tight">No active broadcasts</div>
                          <p className="text-slate-400 max-w-sm mx-auto text-sm">Publicize fulfillment deficits from the hospital request ledger to engage donors.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Stewardship Navigation Bar */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{Math.min(needs.length, (currentPage - 1) * ROWS_PER_PAGE + 1)}</span> to <span className="text-slate-900">{Math.min(needs.length, currentPage * ROWS_PER_PAGE)}</span> of <span className="text-slate-900">{needs.length}</span> campaigns
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <CurateNeedModal
        isOpen={isCurateModalOpen}
        onClose={() => {
          setIsCurateModalOpen(false);
          setSelectedNeed(null);
        }}
        onSuccess={fetchNeeds}
        need={selectedNeed}
      />

      <NeedDonationsModal
        isOpen={isDonationsModalOpen}
        onClose={() => {
          setIsDonationsModalOpen(false);
          setSelectedNeed(null);
        }}
        need={selectedNeed}
        onStatusChange={fetchNeeds}
      />
    </div>
  );
};

export default ManageNeeds;

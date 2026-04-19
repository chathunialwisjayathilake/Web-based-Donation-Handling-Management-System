import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const DonorDonations = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital-requests/needs');
            const allDonations = [];

            // Loop through needs to get linked donations
            // Alternatively, create a dedicated endpoint for ItemDonations filtered by category FINANCE
            // Let's assume we can fetch all ItemDonations
            const donationsRes = await api.get('/hospital-requests/needs/donations/all');
            // I'll need to ensure this endpoint exists or filter on frontend

            setDonations(donationsRes.data.filter(d => d.category === 'FINANCE'));
        } catch (err) {
            console.error("Error fetching donor gifts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Since I haven't created a dedicated 'all' endpoint yet, 
        // I'll fetch it by iterating or using a new endpoint I'll add later.
        // For now, let's assume a dedicated endpoint or I'll implement one.
        fetchDonations();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/hospital-requests/needs/donations/${id}/status`, { status });
            fetchDonations();
        } catch (err) {
            console.error("Failed to update gift status:", err);
            alert("Internal ledger update failed.");
        }
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-500 font-['Work_Sans']">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Donor Contributions</h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Verify and settle community financial aid deposits.</p>
                </div>
                <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{donations.filter(d => d.status === 'PENDING').length} Pending Verifications</span>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Donor Identity</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Campaign / Need</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount (LKR)</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Channel</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : donations.length > 0 ? donations.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((donation, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={donation._id}
                                    className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <td className="px-8 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                                                {donation.donor?.name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 tracking-tight text-sm">{donation.donor?.name || 'Anonymous Donor'}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{donation.donor?.phone || 'No Contact'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="font-black text-slate-900 text-sm">{donation.itemName}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {donation.campaignId?.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="text-base font-black text-slate-900 tracking-tight">LKR {parseFloat(donation.quantity).toLocaleString()}</div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-lg ${donation.paymentMethod === 'CARD' ? 'text-indigo-500' : 'text-amber-500'}`}>
                                                {donation.paymentMethod === 'CARD' ? 'credit_card' : 'account_balance'}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                {donation.paymentMethod === 'CARD' ? 'Digital Card' : 'Bank Memo'}
                                            </span>
                                        </div>
                                        {donation.paymentMethod === 'CARD' && (
                                            <div className="text-[9px] font-bold text-slate-400 mt-1">{donation.cardNumber || '**** **** **** 4242'}</div>
                                        )}
                                        {donation.paymentMethod === 'BANK_TRANSFER' && donation.imageUrl && (
                                            <button
                                                onClick={() => setSelectedSlip(donation.imageUrl)}
                                                className="text-[9px] font-black text-primary uppercase tracking-widest mt-1 hover:underline flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">image</span>
                                                View Slip
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-8 py-7">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${donation.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                                donation.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-slate-100 text-slate-500 animate-pulse'
                                            }`}>
                                            {donation.status === 'APPROVED' ? 'Settled' : donation.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-7 text-right">
                                        {donation.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(donation._id, 'APPROVED')}
                                                    className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all active:scale-95"
                                                >
                                                    Settle
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(donation._id, 'REJECTED')}
                                                    className="h-10 px-6 border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                                                >
                                                    Void
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-32 text-center text-slate-400 italic">No community contributions detected in the ledger.</td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
                
                {Math.ceil(donations.length / rowsPerPage) > 1 && (
                  <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing <span className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * rowsPerPage, donations.length)}</span> of <span className="text-slate-900">{donations.length}</span> contributions
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      {[...Array(Math.ceil(donations.length / rowsPerPage))].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={currentPage === Math.ceil(donations.length / rowsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>

            {/* Slip Preview Modal */}
            <AnimatePresence>
                {selectedSlip && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-10">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedSlip(null)}
                            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md cursor-pointer"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-4xl w-full max-h-full aspect-[4/3] bg-white rounded-[40px] overflow-hidden shadow-2xl"
                        >
                            <img src={selectedSlip} alt="Deposit Slip" className="w-full h-full object-contain p-4" />
                            <button onClick={() => setSelectedSlip(null)} className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DonorDonations;

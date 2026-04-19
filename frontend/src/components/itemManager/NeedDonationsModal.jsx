import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const NeedDonationsModal = ({ isOpen, onClose, need, onStatusChange }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && need) {
      fetchDonations();
    }
  }, [isOpen, need]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hospital-requests/needs/${need.id || need._id}/donations`);
      setDonations(res.data);
    } catch (err) {
      console.error('Failed to fetch donations for need', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    try {
      await api.put(`/hospital-requests/needs/donations/${donationId}/status`, { status: newStatus });
      fetchDonations();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to update donation status', err);
    }
  };

  if (!isOpen || !need) return null;

  const isFinance = need.category === 'FINANCE';
  const targetQty = parseFloat(need.quantity) || 0;
  const donatedQty = parseFloat(need.donatedQuantity) || 0;
  const remainingQty = Math.max(0, targetQty - donatedQty);

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
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">{isFinance ? 'payments' : 'handshake'}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{isFinance ? 'Contribution Ledger' : 'Donor Item Logistics'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {isFinance ? `Audit and settle community financial gifts for "${need.itemName}"` : `Review and authorize incoming public contributions for "${need.itemName}"`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 space-y-8 flex flex-col gap-6 relative">
            
            {/* Metric Summary */}
            {/* Compact Metric Summary */}
            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between px-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">target</span>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Goal</div>
                  <div className="text-xl font-black text-slate-900 leading-none mt-1">
                    {isFinance ? `LKR ${targetQty.toLocaleString()}` : targetQty}
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-100" />

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Received</div>
                  <div className="text-xl font-black text-emerald-600 leading-none mt-1">
                    {isFinance ? `LKR ${donatedQty.toLocaleString()}` : donatedQty}
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-100" />

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">pending_actions</span>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-rose-500/80">Outstanding</div>
                  <div className="text-xl font-black text-rose-500 leading-none mt-1">
                    {isFinance ? `LKR ${remainingQty.toLocaleString()}` : remainingQty}
                  </div>
                </div>
              </div>
            </div>

            {/* Donation Tracking Ledger */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">inventory</span> Community Contributions
                </h3>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Donor</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isFinance ? 'Amount' : 'Contribution'}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isFinance ? 'Method' : 'Logistics'}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Date Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isFinance ? 'Settlement Status' : 'Authorization Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="flex justify-center items-center gap-2 text-slate-400">
                          <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-widest">Scanning Ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : donations.length > 0 ? (
                    donations.map((d, index) => (
                      <motion.tr 
                        key={d._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs shadow-inner">
                              {d.donor?.name?.charAt(0)?.toUpperCase() || 'D'}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{d.donor?.name || 'Community Donor'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                            <span className="text-sm font-black text-slate-900">
                              {isFinance ? `LKR ${parseFloat(d.quantity).toLocaleString()}` : d.quantity}
                            </span>
                            {!isFinance && <span className="text-[10px] font-bold text-slate-500 uppercase text-xs">units</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                d.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {d.paymentMethod || (isFinance ? 'BANK' : 'N/A')}
                              </span>
                            </div>
                            {d.imageUrl && (
                              <button 
                                onClick={() => window.open(d.imageUrl, '_blank')}
                                className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
                              >
                                <span className="material-symbols-outlined text-xs">receipt_long</span>
                                View Slip
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          {isFinance && d.paymentMethod === 'CARD' ? (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 w-max shadow-sm">
                              <span className="material-symbols-outlined text-base font-bold">verified</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 relative group w-max">
                              <select
                                value={d.status}
                                onChange={(e) => handleStatusUpdate(d._id || d.id, e.target.value)}
                                className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer shadow-sm ${
                                  d.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300' :
                                  d.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300' :
                                  'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-300'
                                }`}
                              >
                                <option value="PENDING">{isFinance ? 'Awaiting Verification' : 'Pending Approval'}</option>
                                <option value="APPROVED">{isFinance ? 'Confirm Settlement' : 'Authorize Stock'}</option>
                                <option value="REJECTED">{isFinance ? 'Void Transaction' : 'Reject Contribution'}</option>
                              </select>
                              <span className={`material-symbols-outlined absolute right-3 pointer-events-none text-base ${
                                  d.status === 'APPROVED' ? 'text-emerald-500' :
                                  d.status === 'REJECTED' ? 'text-rose-500' :
                                  'text-amber-500'
                              }`}>
                                expand_more
                              </span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">inbox</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">No Contributions Yet</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">Donors haven't responded to this broadcast.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NeedDonationsModal;

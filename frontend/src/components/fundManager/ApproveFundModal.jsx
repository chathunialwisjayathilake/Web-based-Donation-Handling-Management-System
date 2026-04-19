import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const ApproveFundModal = ({ isOpen, onClose, request, onSuccess }) => {
    const [approvedAmount, setApprovedAmount] = useState('');
    const [availableCapital, setAvailableCapital] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingCapital, setFetchingCapital] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const fetchCapital = async () => {
            try {
                setFetchingCapital(true);
                const [donationsRes, requestsRes] = await Promise.all([
                    api.get('/fund-donations'),
                    api.get('/hospital-requests/fund/all')
                ]);

                const donations = donationsRes.data || [];
                const requests = requestsRes.data || [];

                const settledInflow = donations
                    .filter(d => d.status === 'COMPLETED')
                    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

                // Use approvedAmount || amount to match the dashboard calculation exactly
                const settledOutflow = requests
                    .filter(r => r.status === 'COMPLETED')
                    .reduce((sum, r) => sum + (parseFloat(r.approvedAmount || r.amount) || 0), 0);

                const BASE_CAPITAL = 20000;
                const capital = Math.max(0, BASE_CAPITAL + settledInflow - settledOutflow);
                setAvailableCapital(capital);

                // Default to requesting amount if within capital
                const initialVal = Math.min(request.amount, capital);
                setApprovedAmount(initialVal);

            } catch (err) {
                console.error("Failed to fetch capital details", err);
                setError("Network error: Could not synchronize financial ledger.");
            } finally {
                setFetchingCapital(false);
            }
        };

        fetchCapital();
    }, [isOpen, request]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const amount = parseFloat(approvedAmount);
        if (isNaN(amount) || amount < 0) {
            setError('Please specify a valid disbursement amount (minimum 0).');
            return;
        }

        if (amount > availableCapital) {
            setError(`Insufficient capital. Maximum available is LKR ${availableCapital.toLocaleString()}.`);
            return;
        }

        try {
            setLoading(true);
            await api.put(`/hospital-requests/fund/${request._id}/status`, {
                status: 'COMPLETED',
                approvedAmount: amount
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error authorizing request:", err);
            setError(err.response?.data?.message || "Internal transaction failure.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const remainingDeficit = Math.max(0, request.amount - (parseFloat(approvedAmount) || 0));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Work_Sans']">
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
                    className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
                >
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">Financial Grant Authorization</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Controlled Capital Disbursement</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-pulse"
                            >
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tight">LKR {request.amount?.toLocaleString()}</div>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Available Capital</div>
                                    <div className="text-xl font-black tracking-tight tabular-nums">
                                        {fetchingCapital ? '...' : `LKR ${availableCapital.toLocaleString()}`}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Allocation (LKR)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max={availableCapital}
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-slate-900 text-3xl tabular-nums placeholder:text-slate-200"
                                    value={approvedAmount}
                                    onChange={e => setApprovedAmount(e.target.value)}
                                />
                            </div>

                            {remainingDeficit > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-blue-50/50 border border-blue-100/50 rounded-3xl flex items-start gap-4 transition-all"
                                >
                                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                        <span className="material-symbols-outlined text-white text-xl">campaign</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-blue-900">Automatic Fundraising Triggered</div>
                                        <p className="text-[11px] font-medium text-blue-600 mt-1 leading-relaxed">
                                            A deficit of <span className="font-black">LKR {remainingDeficit.toLocaleString()}</span> was found. A public donation drive will be automatically launched to bridge this gap.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-5 border border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[24px] hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || fetchingCapital}
                                type="submit"
                                className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[24px] shadow-2xl hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Authorize Disbursement
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ApproveFundModal;

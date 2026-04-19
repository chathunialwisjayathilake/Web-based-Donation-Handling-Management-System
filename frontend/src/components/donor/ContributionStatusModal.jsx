import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ContributionStatusModal = ({ isOpen, onClose, need }) => {
    const { user } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && need && user) {
            fetchDonations();
        }
    }, [isOpen, need, user]);

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const needId = need.id || need._id;
            const res = await api.get(`/hospital-requests/needs/donations/all`);
            // Filter locally for this specific donor and campaign
            // In a production app, this should be done via a dedicated backend query
            const filtered = res.data.filter(d => 
                (d.donorId === user._id || d.donorId?._id === user._id) && 
                (d.campaignId === needId || d.campaignId?._id === needId)
            );
            setDonations(filtered);
        } catch (err) {
            console.error("Error fetching donation status:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden relative z-10 font-['Work_Sans']"
                >
                    <div className="p-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Contribution History</h2>
                                <p className="text-slate-500 text-sm font-medium italic mt-1">Project: <span className="text-primary font-bold">{need?.itemName || need?.title}</span></p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking Ledger...</span>
                                </div>
                            ) : donations.length > 0 ? donations.map((donation, idx) => (
                                <div key={donation._id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-4 border-l-slate-900">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-slate-900 tracking-tight italic">LKR {parseFloat(donation.quantity).toLocaleString()}</span>
                                            <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">
                                                {donation.paymentMethod === 'CARD' ? 'Card' : 'Bank'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {donation._id.slice(-8).toUpperCase()} • {new Date(donation.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                            donation.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                            donation.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                            'bg-amber-100 text-amber-600 animate-pulse'
                                        }`}>
                                            <span className="material-symbols-outlined text-[14px]">
                                                {donation.status === 'APPROVED' ? 'verified_user' : donation.status === 'REJECTED' ? 'cancel' : 'pending'}
                                            </span>
                                            {donation.status === 'APPROVED' ? 'Settled' : donation.status === 'REJECTED' ? 'Voided' : 'Processing'}
                                        </div>
                                        {donation.status === 'PENDING' && (
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">Awaiting Slip Verification</p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                    <span className="material-symbols-outlined text-slate-200 text-4xl">receipt_long</span>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">No contributions found for this account.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 p-6 bg-slate-900 rounded-[30px] border border-slate-800 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">security</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white tracking-tight">Ledger Integrity</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                                        All transactions are final once settled by the Fund Manager. For discrepancies, please contact the coordinator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContributionStatusModal;

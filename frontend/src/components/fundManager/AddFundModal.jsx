import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const AddFundModal = ({ isOpen, onClose, onSuccess, donationToEdit }) => {
    const [formData, setFormData] = useState({
        donorId: '',
        donorName: '',
        amount: '',
        paymentSlipUrl: '',
        status: 'PENDING'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (donationToEdit) {
            setFormData({
                donorId: donationToEdit.donorId?._id || donationToEdit.donorId,
                donorName: donationToEdit.donor?.name || '',
                amount: donationToEdit.amount || '',
                paymentSlipUrl: donationToEdit.paymentSlipUrl || '',
                status: donationToEdit.status || 'PENDING'
            });
        } else {
            setFormData({
                donorId: '',
                donorName: '',
                amount: '',
                paymentSlipUrl: '',
                status: 'PENDING'
            });
        }
    }, [donationToEdit, isOpen]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/donors/search?q=${searchQuery}`);
                    setSearchResults(res.data);
                } catch (err) {
                    console.error("Search error:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectDonor = (donor) => {
        setFormData({ ...formData, donorId: donor._id, donorName: donor.name });
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.donorId) {
            setError("Please select a valid donor from the list.");
            return;
        }

        if (parseFloat(formData.amount) < 0) {
            setError("Asset injection cannot be negative. Minimum is 0.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (donationToEdit) {
                // UPDATE
                const donationId = donationToEdit._id || donationToEdit.id;
                console.log(`[Diagnostic] Sending PUT to /fund-donations/${donationId}`);
                await api.put(`/fund-donations/${donationId}`, {
                    amount: parseFloat(formData.amount),
                    paymentSlipUrl: formData.paymentSlipUrl,
                    status: formData.status
                });
            } else {
                // CREATE
                await api.post('/fund-donations', {
                    donorId: formData.donorId,
                    amount: parseFloat(formData.amount),
                    paymentSlipUrl: formData.paymentSlipUrl,
                    status: formData.status
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Submission error:", err);
            setError(err.response?.data?.message || "Failed to process request.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden z-10"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-bl-[100px] -mr-16 -mt-16 z-0"></div>
                    
                    <div className="p-12 relative z-10">
                        <header className="flex justify-between items-start mb-10">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {donationToEdit ? 'Edit Contribution' : 'Record Contribution'}
                                </h1>
                                <p className="text-slate-500 mt-2 font-medium italic">
                                    {donationToEdit ? 'Update existing financial record details.' : 'Inject manual capital into the centralized ledger.'}
                                </p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Donor Search */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Donor Identification</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">person_search</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        disabled={!!donationToEdit}
                                        value={formData.donorName || searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (formData.donorId) setFormData({...formData, donorId: '', donorName: ''});
                                        }}
                                        className={`w-full pl-14 pr-5 py-5 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-3xl transition-all duration-300 font-bold text-slate-900 placeholder:text-slate-300 shadow-inner ${!!donationToEdit ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'bg-slate-50'}`}
                                    />
                                    
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                                            {searchResults.map(donor => (
                                                <button
                                                    key={donor._id}
                                                    type="button"
                                                    onClick={() => handleSelectDonor(donor)}
                                                    className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{donor.name}</div>
                                                        <div className="text-[10px] font-medium text-slate-400">{donor.phone}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {isSearching && (
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (LKR)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-3xl transition-all duration-300 font-black text-xl text-slate-900 shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-3xl transition-all duration-300 font-bold text-slate-900 shadow-inner appearance-none cursor-pointer"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="COMPLETED">Settled</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-primary transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div> : (donationToEdit ? "Update Record" : "Confirm Record")}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddFundModal;

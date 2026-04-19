import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import DonorDetailModal from './DonorDetailModal';

const DonorList = ({ activeTab }) => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const res = await api.get('/donors');
            setDonors(res.data);
        } catch (err) {
            console.error("Error fetching donors:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const filteredDonors = donors.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        (d.bloodType && d.bloodType.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this donor? This action cannot be undone.")) return;
        try {
            await api.delete(`/donors/${id}`);
            fetchDonors();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to remove donor.");
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                        {activeTab === 'donors' ? 'Active Registry' : activeTab === 'leaderboard' ? 'Impact Leaderboard' : 'Activity Log'}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium italic mt-1 font-['Inter']">Managing {donors.length} registered contributors.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative group w-80">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                        <input 
                            type="text" 
                            placeholder="Search by name, phone or blood group..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-['Inter']">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Donor Profile</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match Type</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Engagement Score</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                                            <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] italic">Synchronizing Registry...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDonors.length > 0 ? filteredDonors.map((donor, index) => (
                                <motion.tr 
                                    key={donor._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group"
                                >
                                    <td className="px-8 py-6">
                                        <div 
                                            className="flex items-center gap-4 cursor-pointer group/title"
                                            onClick={() => {
                                                setSelectedDonor(donor);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-sm shadow-inner group-hover/title:scale-110 group-hover/title:bg-primary/10 group-hover/title:text-primary transition-all duration-500">
                                                {donor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 group-hover/title:text-primary transition-colors tracking-tight">{donor.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Contributor since {new Date(donor.createdAt).getFullYear()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                            {donor.bloodType || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                                 <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${donor.engagementScore || 0}%` }}
                                                    className={`h-full rounded-full ${
                                                        (donor.engagementScore || 0) > 75 ? 'bg-emerald-500' : 
                                                        (donor.engagementScore || 0) > 25 ? 'bg-primary' : 'bg-slate-300'
                                                    }`} 
                                                 />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{donor.engagementScore || 0}% Engagement</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-slate-700 tracking-tight tabular-nums">{donor.phone}</div>
                                        <div className="text-[10px] font-bold text-slate-400 lowercase">{donor.user?.email || 'Registered via SMS'}</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setSelectedDonor(donor);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(donor._id)}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <span className="material-symbols-outlined text-6xl">person_search</span>
                                            <p className="font-bold italic text-slate-500">No donors found matching your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            <DonorDetailModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedDonor(null);
                }}
                donorId={selectedDonor?._id}
                initialData={selectedDonor}
                onSuccess={fetchDonors}
            />
        </div>
    );
};

export default DonorList;

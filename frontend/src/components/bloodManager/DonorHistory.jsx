import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../utils/api';

const DonorHistory = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings/all');
            setDonations(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching donation history:", err);
            setError("Synchronization failed: Verify command network.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, []);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [formStatus, setFormStatus] = useState('');

    const handleUpdate = async (id, updateData) => {
        try {
            setModalError(null);
            await api.patch(`/bookings/${id}`, updateData);
            setDonations(donations.map(d => d._id === id ? { ...d, ...updateData } : d));
            setIsEditModalOpen(false);
            setSelectedBooking(null);
        } catch (err) {
            console.error("Update error:", err);
            const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
            setModalError(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this booking?")) return;
        try {
            await api.delete(`/bookings/${id}`);
            setDonations(donations.filter(d => d._id !== id));
        } catch (err) {
            setError("Failed to delete booking.");
        }
    };

    const filteredDonations = donations.filter(d => {
        const donorName = d.donorId?.name || 'Unknown';
        const bloodType = d.bloodType || '';
        const campaignTitle = d.campaignId?.title || '';
        const centerName = d.hospitalId?.name || '';
        const query = searchQuery.toLowerCase();

        return donorName.toLowerCase().includes(query) || 
               bloodType.toLowerCase().includes(query) ||
               campaignTitle.toLowerCase().includes(query) ||
               centerName.toLowerCase().includes(query);
    });

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Branded Header
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38); // Healio Red
        doc.text("HEALIO", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("BLOOD STEWARDSHIP — COMMAND BOOKINGS REPORT", 14, 28);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
        doc.text(`Total Records: ${filteredDonations.length}`, 14, 46);

        const tableData = filteredDonations.map(reg => [
            `${reg.donorId?.name || 'N/A'}\nID: ${reg._id.slice(-8)}`,
            reg.bloodType,
            reg.campaignId?.title || reg.hospitalId?.name || 'Direct Allocation',
            `${reg.date ? new Date(reg.date).toLocaleDateString() : 'N/A'}\nSlot: ${reg.timeSlot}`,
            reg.status,
            reg.donorId?.phone || 'N/A'
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Donor Info', 'Grp', 'Source', 'Schedule', 'Status', 'Contact']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
                4: { halign: 'center' }
            }
        });

        doc.save(`Healio_Bookings_Report_${new Date().getTime()}.pdf`);
    };

    // Stats
    const totalDonors = new Set(donations.map(d => d.donorId?._id)).size;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 font-['Work_Sans'] relative">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Command <span className="text-red-600">Bookings</span></h1>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Master Stewardship Ledger — Direct & Campaign Allocations</p>
                    
                    <div className="flex gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-slate-900">{donations.length}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l pl-3 border-slate-200">Total Bookings</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-red-600">{totalDonors}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l pl-3 border-slate-200">Unique Donors</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
                        <input 
                            type="text" 
                            placeholder="Search donor, blood type, or event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl w-full md:w-80 font-bold text-sm outline-none focus:ring-4 ring-red-500/5 focus:border-red-600 transition-all"
                        />
                    </div>
                    <button 
                        onClick={fetchDonations}
                        className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg"
                        title="Refresh Data"
                    >
                        <span className="material-symbols-outlined">sync</span>
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        disabled={filteredDonations.length === 0}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-xl">download</span>
                        Export PDF
                    </button>
                </div>
            </section>

            {/* Error Handling */}
            {error && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-4 text-red-700 font-bold animate-in slide-in-from-top-4">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    {error}
                </div>
            )}

            {/* Premium Table Content */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative min-h-[500px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-black mt-4 uppercase tracking-[0.2em] text-xs">Accessing Records...</p>
                    </div>
                ) : null}

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Donor Identity</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Group</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event / Source</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredDonations.map((reg) => (
                            <tr key={reg._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                                            <span className="material-symbols-outlined text-2xl">person</span>
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-red-600 transition-colors uppercase tracking-widest">{reg.donorId?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{reg.donorId?.phone || 'No Contact'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8">
                                    <div className="flex justify-center">
                                        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center font-black text-red-600 text-sm shadow-sm group-hover:scale-110 transition-transform">
                                            {reg.bloodType}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8">
                                    <div className="flex flex-col">
                                        <div className="text-sm font-extrabold text-slate-900 tracking-tight">
                                            {reg.campaignId?.title || reg.hospitalId?.name || 'Direct Allocation'}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
                                            {reg.date ? new Date(reg.date).toLocaleDateString() : 'N/A'} — {reg.timeSlot}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 ${
                                        reg.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                        reg.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                        {reg.status === 'PENDING' ? 'Pending' : 
                                         reg.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                        <button 
                                            onClick={() => {
                                                setSelectedBooking(reg);
                                                setFormStatus(reg.status);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center justify-center shadow-sm"
                                            title="Edit Booking"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(reg._id)}
                                            className="w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-600 transition-all flex items-center justify-center shadow-sm"
                                            title="Delete Registry"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete_forever</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredDonations.length === 0 && !loading && (
                    <div className="py-40 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                            <span className="material-symbols-outlined text-slate-200 text-5xl">folder_off</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Donor Matches</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium leading-relaxed">The donor registry is clean. Try adjusting your search or filters to find specific bookings.</p>
                    </div>
                )}
            </div>

            {/* Edit Booking Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedBooking && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                        >
                            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Edit <span className="text-red-600">Booking</span></h2>
                                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Update donor session logistics</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setModalError(null);
                                    }}
                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form className="p-8 space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleUpdate(selectedBooking._id, {
                                    status: formData.get('status'),
                                    date: formData.get('date'),
                                    timeSlot: formData.get('timeSlot'),
                                    pintsDonated: formData.get('pintsDonated')
                                });
                            }}>
                                {modalError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        {modalError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Lifecycle</label>
                                    <select 
                                        name="status"
                                        defaultValue={selectedBooking.status}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-red-500/5 focus:border-red-600 transition-all cursor-pointer"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                {formStatus === 'COMPLETED' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pints Donated</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            min="0"
                                            name="pintsDonated"
                                            defaultValue={selectedBooking.pintsDonated || 1}
                                            className="w-full px-5 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl font-black text-red-600 text-lg outline-none focus:ring-4 ring-red-500/10 focus:border-red-600 transition-all"
                                            placeholder="e.g. 1.0"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium italic ml-1">* This volume will be automatically added to the {selectedBooking.bloodType} stock.</p>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Date</label>
                                        <input 
                                            type="date" 
                                            name="date"
                                            defaultValue={selectedBooking.date ? new Date(selectedBooking.date).toISOString().split('T')[0] : ''}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-red-500/5 focus:border-red-600 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Slot</label>
                                        <input 
                                            type="text" 
                                            name="timeSlot"
                                            defaultValue={selectedBooking.timeSlot}
                                            placeholder="e.g. 10:00 AM"
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-red-500/5 focus:border-red-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-2 px-8 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        Save Changes
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Insights */}
            <div className="flex justify-between items-center px-10">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Live Registry Feed
                    </div>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    Displaying Top {filteredDonations.length} results
                </div>
            </div>
        </div>
    );
};

export default DonorHistory;

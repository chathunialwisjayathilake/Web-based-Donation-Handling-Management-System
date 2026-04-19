import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import AddFundModal from './AddFundModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageFunds = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const rowsPerPage = 7;

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/fund-donations');
            setDonations(res.data);
        } catch (err) {
            console.error("Error fetching donations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, []);

    const handleEdit = (donation) => {
        setSelectedDonation(donation);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedDonation(null);
        setIsModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleExportPDF = () => {
        try {
            setIsExporting(true);
            const doc = new jsPDF();

            // Header Section Formatting
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("FINANCIAL STEWARDSHIP LEDGER", 14, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            doc.text(`Exported On: ${new Date().toLocaleString()}`, 14, 28);
            doc.text(`Total Records: ${donations.length}`, 14, 34);

            // Prepare Table Data
            const tableColumn = ["Donor Source", "Contact", "Capital Injected", "Status", "Registered Date"];
            const tableRows = donations.map(donation => [
                donation.donor?.name || "Unknown Donor",
                donation.donor?.phone || "No contact info",
                `LKR ${donation.amount ? donation.amount.toLocaleString() : 0}`,
                donation.status || "Pending",
                new Date(donation.createdAt).toLocaleDateString()
            ]);

            // AutoTable 
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 8,
                    cellPadding: 4,
                    textColor: [51, 65, 85], // slate-700
                    lineColor: [226, 232, 240], // slate-200
                },
                headStyles: {
                    fillColor: [241, 245, 249], // slate-100
                    textColor: [15, 23, 42], // slate-900
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252] // slate-50
                },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'center' },
                    4: { halign: 'center' }
                }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // slate-400
                doc.text(`Page ${i} of ${pageCount} | Healio Core System`, 14, doc.internal.pageSize.height - 10);
            }

            doc.save("financial_stewardship_ledger.pdf");
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to export ledger to PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-10 space-y-12 font-['Work_Sans'] animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Stewardship</h1>
                    <p className="text-slate-500 mt-2 font-medium italic tracking-tight text-lg">Detailed ledger of humanitarian capital inflow and settled contributions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting || donations.length === 0}
                        className="px-8 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-[32px] shadow-sm hover:border-slate-300 hover:text-slate-900 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <div className="w-6 h-6 border-4 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                        )}
                        <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="px-10 py-5 bg-slate-900 text-white font-black rounded-[32px] shadow-2xl hover:bg-primary transition-all flex items-center gap-3 active:scale-95 group overflow-hidden relative"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add_circle</span>
                        <span>Record Inflow</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </header>

            <AddFundModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedDonation(null);
                }}
                onSuccess={fetchDonations}
                donationToEdit={selectedDonation}
            />

            <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Inter']">Donor Source</th>
                                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Inter']">Capital Injected</th>
                                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Inter']">Recorded On</th>
                                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Inter']">Verification</th>
                                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Inter'] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400 italic font-medium">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin"></div>
                                            Synchronizing with financial records...
                                        </div>
                                    </td>
                                </tr>
                            ) : donations.length > 0 ? donations.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((donation, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={donation._id}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-20">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold font-['Inter'] uppercase shadow-inner">
                                                {donation.donor?.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 tracking-tight">{donation.donor?.name || "Unknown Donor"}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{donation.donor?.phone || "No contact info"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="text-xl font-black text-slate-900 tracking-tighter tabular-nums">
                                            LKR {donation.amount?.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="text-sm font-bold text-slate-500 italic">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(donation.status)}`}>
                                            {donation.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(donation)}
                                                className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm active:scale-90"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-90">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center text-slate-400 italic font-medium">
                                        No financial inflows recorded in the current stewardship period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {Math.ceil(donations.length / rowsPerPage) > 1 && (
                    <div className="px-10 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * rowsPerPage, donations.length)}</span> of <span className="text-slate-900">{donations.length}</span> records
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
        </div>
    );
};

export default ManageFunds;

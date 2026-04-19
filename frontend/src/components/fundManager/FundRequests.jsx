import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import ApproveFundModal from './ApproveFundModal';

const FundRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital-requests/fund/all');

            // Add type indicator
            const funds = res.data.map(r => ({ ...r, type: 'FUND' }));

            setRequests(funds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status, type) => {
        if (type === 'FUND' && status === 'COMPLETED') {
            const req = requests.find(r => r._id === id);
            setSelectedRequest(req);
            setIsApproveModalOpen(true);
            return;
        }

        try {
            const categoryPath = type.toLowerCase();
            await api.put(`/hospital-requests/${categoryPath}/${id}/status`, { status });
            fetchRequests();
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update coordination status");
        }
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-500 font-['Work_Sans'] text-slate-900">
            <ApproveFundModal
                isOpen={isApproveModalOpen}
                request={selectedRequest}
                onClose={() => setIsApproveModalOpen(false)}
                onSuccess={fetchRequests}
            />

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight ">Hospital Logistics</h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Unified coordination of critical item, blood, and financial requests.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-sm font-bold text-slate-900 tracking-tight">{requests.filter(r => r.status === 'PENDING').length} Active Requests</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-['Inter']">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Type</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hospital Facility</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Requirement Details</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coordination</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Authorizing...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length > 0 ? requests.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((request, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={request.id || request._id}
                                    className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <td className="px-8 py-7">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${request.type === 'ITEM' ? 'bg-indigo-50 text-indigo-600' :
                                                request.type === 'BLOOD' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {request.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110">
                                                {(request.hospitalId?.name || request.hospital?.name)?.charAt(0) || 'H'}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 tracking-tight text-sm">{(request.hospitalId?.name || request.hospital?.name) || 'Unknown Hospital'}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{(request.hospitalId?._id || request.hospital?._id)?.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="text-base font-black text-slate-900 tracking-tight">
                                            {request.type === 'ITEM' ? `${request.itemName} (${request.quantity})` :
                                                request.type === 'BLOOD' ? `${request.units} units of ${request.bloodType}` :
                                                    `LKR ${request.amount?.toLocaleString()}`}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {request.type === 'ITEM' ? 'Asset Allocation' :
                                                request.type === 'BLOOD' ? 'Life Support' : 'Capital Grant'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${request.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' :
                                                request.priority === 'CRITICAL' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {request.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-7">
                                        <span className={`flex items-center gap-2 text-sm font-black italic ${request.status === 'COMPLETED' ? 'text-green-600' :
                                                request.status === 'CANCELLED' || request.status === 'REJECTED' ? 'text-slate-400' :
                                                    'text-orange-500 animate-pulse'
                                            }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {request.status}
                                        </span>
                                        {request.approvedAmount > 0 && request.approvedAmount < request.amount && (
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                Partial: LKR {request.approvedAmount.toLocaleString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-7 text-right">
                                        <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                            {request.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request._id, 'COMPLETED', request.type)}
                                                        className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95"
                                                    >
                                                        {request.type === 'FUND' ? 'Authorize' : 'Confirm'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request._id, request.type === 'FUND' ? 'CANCELLED' : 'REJECTED', request.type)}
                                                        className="h-10 px-6 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-200">receipt_long</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xl font-bold text-slate-900">No aid requests</div>
                                                <p className="text-slate-400 max-w-sm mx-auto italic semi-bold">All hospital financial aid requests are currently synchronized.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>

                {Math.ceil(requests.length / rowsPerPage) > 1 && (
                    <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * rowsPerPage, requests.length)}</span> of <span className="text-slate-900">{requests.length}</span> requests
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            {[...Array(Math.ceil(requests.length / rowsPerPage))].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === Math.ceil(requests.length / rowsPerPage)}
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

export default FundRequests;


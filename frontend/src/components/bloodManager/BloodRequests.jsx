import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import BloodCampaignModal from './BloodCampaignModal';
import DispatchBloodModal from './DispatchBloodModal';

const BloodRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital-requests/blood/all');
            setRequests(res.data);
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = (request) => {
        setSelectedRequest(request);
        setIsCampaignModalOpen(true);
    };

    const handleOpenDispatch = (request) => {
        setSelectedRequest(request);
        setIsDispatchModalOpen(true);
    };

    const handleDispatchSuccess = (updatedRequest, remaining) => {
        fetchRequests();
        if (remaining > 0) {
            if (window.confirm(`Successfully dispatched. There are still ${remaining} units remaining. Would you like to launch a public campaign for the deficit?`)) {
                handleCreateCampaign(updatedRequest);
            }
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/hospital-requests/blood/${id}/status`, { status });
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to update status";
            alert(errorMsg);
        }
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-500 font-['Work_Sans']">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">All Blood requests</h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Strategic allocation of life-blood units to hospital medical units.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-900 tracking-tight">{requests.filter(r => r.status === 'PENDING').length} Critical Requests</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-['Inter']">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hospital Facility</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Group & Volume</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Authorization</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing core data...</span>
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
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110">
                                                {request.hospitalId?.name?.charAt(0) || 'H'}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 tracking-tight text-base">{request.hospitalId?.name || 'Medical Unit'}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Facility {request.hospitalId?._id?.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-sm border border-red-100">
                                                {request.bloodType}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{request.units} Units</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Approved Grade</div>
                                            </div>
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
                                                request.status === 'PARTIAL' ? 'text-blue-500' :
                                                    request.status === 'CANCELLED' ? 'text-slate-400' :
                                                        'text-red-500 animate-pulse'
                                            }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {request.status}
                                            {request.status === 'PARTIAL' && (
                                                <span className="text-[10px] not-italic ml-1 opacity-70">
                                                    ({request.dispatchedUnits}/{request.units})
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-8 py-7 text-right">
                                        <div className="flex justify-end gap-2">
                                            {(request.status === 'PENDING' || request.status === 'PARTIAL') && (
                                                <>
                                                    <button
                                                        onClick={() => handleCreateCampaign(request)}
                                                        className="h-10 px-6 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/10"
                                                    >
                                                        Create Campaign
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDispatch(request)}
                                                        className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-black/5"
                                                    >
                                                        Dispatch
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request._id, 'CANCELLED')}
                                                        className="h-10 px-6 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                                                    >
                                                        Deny
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-200">bloodtype</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xl font-bold text-slate-900">Queue Cleared</div>
                                                <p className="text-slate-400 max-w-sm mx-auto italic semi-bold">All hospital blood unit allocations have been processed and dispatched.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {requests.length > rowsPerPage && (
                <div className="px-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mt-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, requests.length)} of {requests.length} Requests
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-50 hover:text-slate-900 hover:bg-slate-100 transition-all font-black"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                        <span className="text-xs font-black text-slate-900 px-2 tracking-widest">
                            {currentPage} / {Math.ceil(requests.length / rowsPerPage)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(requests.length / rowsPerPage)))}
                            disabled={currentPage === Math.ceil(requests.length / rowsPerPage)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-50 hover:text-slate-900 hover:bg-slate-100 transition-all font-black"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}

            <BloodCampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                onSuccess={fetchRequests}
                request={selectedRequest}
            />

            <DispatchBloodModal
                isOpen={isDispatchModalOpen}
                onClose={() => setIsDispatchModalOpen(false)}
                onSuccess={handleDispatchSuccess}
                request={selectedRequest}
            />
        </div>
    );
};

export default BloodRequests;

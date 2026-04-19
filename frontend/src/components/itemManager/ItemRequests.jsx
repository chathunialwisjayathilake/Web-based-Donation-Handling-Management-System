import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import FulfillRequestModal from './FulfillRequestModal';

const ItemRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 6;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hospital-requests/item');
      setRequests(response.data);
      setCurrentPage(1); // Reset on fetch
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/hospital-requests/${id}/status`, { status: newStatus });
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'APPROVED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'COMPLETED': return 'bg-green-50 text-green-600 border-green-100';
      case 'REJECTED': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'text-primary bg-primary/5';
      case 'URGENT': return 'text-orange-600 bg-orange-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const filteredRequests = requests.filter(req => filter === 'ALL' || req.status === filter);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRequests.length / ROWS_PER_PAGE);
  const currentRequests = filteredRequests.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleFilterChange = (f) => {
    setFilter(f);
    setCurrentPage(1);
  };

  return (
    <div className="p-10 space-y-10 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 font-['Work_Sans']">Hospital Requests</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">Manage and fulfill critical asset requests from affiliated healthcare facilities.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 gap-1">
          {['ALL', 'PENDING', 'APPROVED', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(15,23,42,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Request Details</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Hospital</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Quantity</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Priority</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      Synchronizing request ledger...
                    </td>
                  </tr>
                ) : currentRequests.length > 0 ? currentRequests.map((req) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={req.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">assignment_late</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-none mb-1.5">{req.itemName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">REQ-{req.id.slice(-6).toUpperCase()} • {new Date(req.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">local_hospital</span>
                        <span className="text-xs font-bold text-slate-700">{req.hospital?.name || "General Facility"}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 ml-6">{req.hospital?.location || "Regional Hub"}</div>
                    </td>
                    <td className="px-8 py-6 text-center font-['Work_Sans'] font-bold text-slate-900 text-sm">
                      {req.quantity}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-current/10 ${getPriorityStyle(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsFulfillModalOpen(true);
                              }}
                              className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                              title="Approve & Fulfill"
                            >
                              <span className="material-symbols-outlined text-lg">check</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                              title="Reject Request"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Mark Dispatched"
                          >
                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      Excellent. No unsettled requests in this category.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Stewardship Navigation Bar */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{Math.min(filteredRequests.length, (currentPage - 1) * ROWS_PER_PAGE + 1)}</span> to <span className="text-slate-900">{Math.min(filteredRequests.length, currentPage * ROWS_PER_PAGE)}</span> of <span className="text-slate-900">{filteredRequests.length}</span> requests
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <FulfillRequestModal
        isOpen={isFulfillModalOpen}
        onClose={() => {
          setIsFulfillModalOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={fetchRequests}
        request={selectedRequest}
      />
    </div>
  );
};

export default ItemRequests;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HospitalRequestTable = ({ requests, loading, title, icon, onDelete, onEdit }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  
  const displayedItems = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when data or category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [requests.length, title]);

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

  return (
    <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(15,23,42,0.03)] border border-slate-100 overflow-hidden font-['Work_Sans']">
      <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400">{icon}</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{title} Ledger</h3>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {requests.length} Total Records
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Resource Details</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reference ID</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Amount/Qty</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Priority</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Requested At</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    Synchronizing coordination ledger...
                  </td>
                </tr>
              ) : displayedItems.length > 0 ? displayedItems.map((req) => (
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
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-lg">
                          {req.amount ? 'payments' : req.units ? 'bloodtype' : 'inventory_2'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-none mb-1.5 capitalize">
                          {req.itemName || req.bloodType || `Financial Aid`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Coordination Request
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-mono font-bold text-slate-400">
                    REQ-{req.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-slate-900 text-sm">
                    {req.amount ? `LKR ${req.amount.toLocaleString()}` : (req.bloodType ? `${req.units} Pints` : (req.quantity || req.units))}
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
                  <td className="px-8 py-6 text-right font-medium text-slate-500 text-xs">
                    {new Date(req.createdAt).toLocaleDateString()}
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <AnimatePresence>
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onEdit && onEdit(req)}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center border border-slate-200 shadow-sm"
                            title="Edit Request"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </motion.button>
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDelete && onDelete(req._id)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 shadow-sm"
                            title="Withdraw Request"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </motion.button>
                        </div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    No settling requests found in the coordination ledger.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default HospitalRequestTable;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const DispatchBloodModal = ({ isOpen, onClose, onSuccess, request }) => {
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);
  const [dispatchQty, setDispatchQty] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        if (!isOpen || !request) return;
        const response = await api.get('/hospital-requests/blood/stock');
        const stocks = response.data;
        const requestedTypeStock = stocks.find(s => s.bloodType === request.bloodType);
        setAvailableStock(requestedTypeStock?.units || 0);
        
        // Auto-fill with the smaller of: remaining needed or available stock
        const remaining = request.units - (request.dispatchedUnits || 0);
        setDispatchQty(Math.min(remaining, requestedTypeStock?.units || 0).toString());
      } catch (err) {
        console.error("Error fetching stock:", err);
      }
    };
    fetchStock();
  }, [isOpen, request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(dispatchQty);
    
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (qty > availableStock) {
      setError(`Cannot dispatch more than available stock (${availableStock} units)`);
      return;
    }

    const requestId = request._id || request.id;
    if (!requestId) {
        setError("Invalid Request Identifier");
        console.error("Critical: Request object missing ID field", request);
        return;
    }

    const remaining = request.units - (request.dispatchedUnits || 0);
    if (qty > remaining) {
      setError(`Cannot dispatch more than requested (${remaining} units remaining)`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log(`Dispatching ${qty} units for request ${requestId}`);
      const response = await api.post(`/hospital-requests/blood/${requestId}/dispatch`, {
        quantity: qty
      });

      const updatedRequest = response.data;
      const totalDispatched = updatedRequest.dispatchedUnits || 0;
      const finalRemaining = request.units - totalDispatched;

      onSuccess(updatedRequest, finalRemaining);
      onClose();
    } catch (err) {
      console.error("Error dispatching blood:", err);
      setError(err.response?.data?.message || "Failed to dispatch blood");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const remainingNeeded = request.units - (request.dispatchedUnits || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden font-['Work_Sans']"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
            <div>
              <h2 className="text-xl font-bold">Dispatch Blood Units</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review Inventory & Allocate</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Blood Group</p>
                <p className="text-2xl font-black text-red-600 italic leading-none">{request.bloodType}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Available Stock</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{availableStock} <span className="text-[10px] font-bold text-slate-400">Units</span></p>
              </div>
            </div>

            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Requirement Progress</span>
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{request.dispatchedUnits || 0} / {request.units} Units</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((request.dispatchedUnits || 0) / request.units) * 100}%` }}
                  className="h-full bg-blue-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Quantity to Dispatch</label>
              <div className="relative group">
                <input
                  required
                  type="number"
                  placeholder={`Max ${Math.min(remainingNeeded, availableStock)} units...`}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-black text-xl text-slate-800"
                  value={dispatchQty}
                  onChange={e => setDispatchQty(e.target.value)}
                  min="1"
                  max={Math.min(remainingNeeded, availableStock)}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest group-focus-within:text-slate-900 transition-colors">
                  Pints / Units
                </div>
              </div>
              {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1 animate-pulse">{error}</p>}
            </div>

            <div className="pt-2">
              <button
                disabled={loading || availableStock === 0}
                type="submit"
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">send</span>
                    Confirm Dispatch
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed italic">
              "System will deduct from central stock and update the coordination ledger across all hospitals instantly."
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DispatchBloodModal;

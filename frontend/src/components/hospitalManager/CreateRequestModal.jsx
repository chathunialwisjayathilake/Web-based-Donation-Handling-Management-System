import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const CreateRequestModal = ({ isOpen, onClose, onSuccess, type, hospitalId, editRequest }) => {
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    amount: '',
    bloodType: '',
    units: '',
    priority: 'ROUTINE',
    description: ''
  });

  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const res = await api.get('/item-donations/available-items');
        setAvailableItems(res.data);
      } catch (error) {
        console.error("Error fetching available items:", error);
      }
    };

    if (isOpen && type === 'ITEM') {
      fetchAvailableItems();
    }

    if (isOpen) {
      if (editRequest) {
        setFormData({
          itemName: editRequest.itemName || '',
          quantity: editRequest.quantity || editRequest.units || '', // Item/Blood mix support
          amount: editRequest.amount || '',
          bloodType: editRequest.bloodType || '',
          units: editRequest.units || '',
          priority: editRequest.priority || 'ROUTINE',
          description: editRequest.description || ''
        });
      } else {
        setFormData({
          itemName: '', quantity: '', amount: '', bloodType: '', units: '', priority: 'ROUTINE', description: ''
        });
      }
    }
  }, [isOpen, type, editRequest]);

  const getTitle = () => {
    const action = editRequest ? 'Revise' : 'Create';
    switch (type) {
      case 'ITEM': return `${action} Asset Request`;
      case 'FUND': return `${action} Financial Aid`;
      case 'BLOOD': return `${action} Blood Supply Request`;
      default: return `${action} Coordination Request`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[CreateRequestModal] Submission triggered");
    
    // Validation
    if (type === 'FUND' && (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) < 0)) {
      alert("Please provide a valid financial amount (Minimum 0).");
      return;
    }
    
    try {
      setLoading(true);
      
      // Robust ID detection
      const rawId = editRequest?._id || editRequest?.id;
      if (editRequest && !rawId) {
          console.error("Critical: editRequest provided but ID is missing!", editRequest);
          throw new Error("Target record identification failed. Please refresh and try again.");
      }
      
      const reqId = rawId;
      let endpoint = '';
      let payload = { 
          hospitalId, 
          priority: formData.priority || 'ROUTINE',
          description: formData.description || '' 
      };

      if (type === 'ITEM') {
        endpoint = editRequest ? `/hospital-requests/item/${reqId}` : '/hospital-requests/item';
        payload = { ...payload, itemName: formData.itemName, quantity: String(formData.quantity) };
      } else if (type === 'FUND') {
        endpoint = editRequest ? `/hospital-requests/fund/${reqId}` : '/hospital-requests/fund';
        payload = { ...payload, amount: Number(formData.amount) };
      } else if (type === 'BLOOD') {
        endpoint = editRequest ? `/hospital-requests/blood/${reqId}` : '/hospital-requests/blood';
        payload = { ...payload, bloodType: formData.bloodType, units: Number(formData.units) };
      }

      console.log(`[Frontend Debug] Mode: ${editRequest ? 'UPDATE' : 'CREATE'}`);
      console.log(`[Frontend Debug] URL: ${endpoint}`);
      console.log(`[Frontend Debug] Payload:`, payload);

      if (editRequest) {
          await api.put(endpoint, payload);
          alert("Success: Coordination request has been updated.");
      } else {
          await api.post(endpoint, payload);
          alert("Success: New coordination request dispatched.");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Coordination Logic Error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to sync with coordination server.";
      alert(`System Error: ${errorMessage}`);
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden font-['Work_Sans']"
        >
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{getTitle()}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Medical Coordination System</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-10 py-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {type === 'ITEM' && (
                <>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Asset Selection</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none text-slate-900"
                        value={formData.itemName}
                        onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                      >
                        <option value="">Choose available stock...</option>
                        {availableItems.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity Required</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-lg text-slate-900"
                      placeholder="e.g. 500"
                      value={formData.quantity}
                      onKeyDown={(e) => {
                        if (e.key === '.' || e.key === 'e') e.preventDefault();
                      }}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </>
              )}

              {type === 'FUND' && (
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Required Amount (LKR)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-lg text-slate-900"
                    placeholder="1000.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              )}

              {type === 'BLOOD' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Blood Type</label>
                    <select
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none"
                      value={formData.bloodType}
                      onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Pints Required</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                      placeholder="e.g. 5"
                      value={formData.units}
                      onChange={e => setFormData({ ...formData, units: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['ROUTINE', 'URGENT', 'CRITICAL'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${formData.priority === p
                        ? (p === 'CRITICAL' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20')
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 h-16 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl font-bold">{editRequest ? 'update' : 'send'}</span>
                  {editRequest ? 'Save Revisions' : 'Send Request'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateRequestModal;

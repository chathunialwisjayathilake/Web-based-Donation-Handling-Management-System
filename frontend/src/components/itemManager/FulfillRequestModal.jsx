import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const FulfillRequestModal = ({ isOpen, onClose, onSuccess, request }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stockInfo, setStockInfo] = useState({ available: 0, loading: true });
  const [transferQty, setTransferQty] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDescription, setBroadcastDescription] = useState('');
  const [broadcastImage, setBroadcastImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setStockInfo(prev => ({ ...prev, loading: true }));
        const res = await api.get(`/item-donations?search=${request.itemName}&activeTab=all_items`);
        // Find the specific item in the results
        const item = res.data.items.find(i => i.itemName === request.itemName);
        setStockInfo({
          available: item ? (parseInt(item.quantity) || 0) : 0,
          loading: false
        });
        // Default transfer qty to min(stock, requested)
        const reqQty = parseInt(request.quantity.replace(/[^0-9]/g, '')) || 0;
        const available = item ? (parseInt(item.quantity) || 0) : 0;
        const defaultTransfer = Math.min(available, reqQty);
        setTransferQty(defaultTransfer.toString());

        // Initialize broadcast defaults if there's a deficit
        if (reqQty > defaultTransfer) {
          setBroadcastTitle(`Urgent: ${request.itemName} for ${request.hospital?.name}`);
          setBroadcastDescription(`The ${request.hospital?.name} has a critical shortage of ${request.itemName}. We need ${reqQty - defaultTransfer} more units to fulfill this request.`);
        }
      } catch (error) {
        console.error("Error fetching stock info:", error);
        setStockInfo({ available: 0, loading: false });
      }
    };

    if (isOpen && request) {
      fetchStock();
    }
  }, [isOpen, request]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `broadcasts/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('item-donations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-donations')
        .getPublicUrl(filePath);

      setBroadcastImage(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const targetId = request.id || request._id;
      if (!targetId) {
        throw new Error("Request ID is missing");
      }

      await api.post(`/hospital-requests/item/${targetId}/fulfill`, {
        transferQuantity: parseInt(transferQty),
        broadcastTitle,
        broadcastDescription,
        broadcastImage
      });

      setSuccess(true);
      // Wait for the "Success" animation/state to be visible
      setTimeout(() => {
        onSuccess();
        onClose();
        // Removed navigate('/') to satisfy user's request to stay on the dashboard
      }, 1500);

    } catch (error) {
      console.error("Error fulfilling request:", error);
    } finally {
      if (!success) setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const requestedQty = parseInt(request.quantity.replace(/[^0-9]/g, '')) || 0;
  const deficit = requestedQty - (parseInt(transferQty) || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className={`relative w-full ${deficit > 0 ? 'max-w-4xl' : 'max-w-xl'} bg-white rounded-[32px] shadow-2xl overflow-hidden font-['Work_Sans'] transition-all duration-500`}
        >
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">Authorize Transfer</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                Inventory fulfillment logic
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-0">
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-12"
                >
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/40"
                  >
                    <span className="material-symbols-outlined text-5xl font-black">check</span>
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Request Sent!</h3>
                  <p className="text-slate-500 font-medium">Redirecting to donor homepage for visibility...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`grid grid-cols-1 ${deficit > 0 ? 'lg:grid-cols-2' : ''} divide-x divide-slate-100`}>
              {/* Left Column: Fulfillment Details */}
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[24px] border border-slate-100 relative overflow-hidden group">
                  <div className="w-14 h-14 bg-white rounded-[18px] flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl text-primary font-bold">inventory_2</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{request.itemName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-xs">local_hospital</span>
                      {request.hospital?.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-5 bg-primary/[0.03] rounded-[24px] border border-primary/5">
                    <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 opacity-60">Requested</div>
                    <div className="text-2xl font-black text-primary font-mono tabular-nums">{requestedQty}</div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">In Stock</div>
                    <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                      {stockInfo.loading ? '...' : stockInfo.available}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transfer Quantity</label>
                    <span className="text-[10px] font-bold text-slate-500">Available: {stockInfo.available}</span>
                  </div>
                  <div className="relative group">
                    <input
                      required
                      type="number"
                      min="0"
                      max={Math.max(0, stockInfo.available)}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-0 focus:border-primary transition-all font-black text-2xl text-slate-900 text-center shadow-inner"
                      value={transferQty}
                      onChange={e => setTransferQty(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Donor Curation (Only if deficit) */}
              {deficit > 0 && (
                <div className="p-8 bg-orange-50/20 flex flex-col justify-between">
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white border border-orange-100 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <span className="material-symbols-outlined text-sm font-black">campaign</span>
                        <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Broadcast Triggered</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        Shortage: <span className="font-bold text-orange-600 underline decoration-orange-200 decoration-2 underline-offset-2">{deficit} units</span>.
                      </p>
                    </motion.div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Cover Imagery</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <div
                          onClick={() => fileInputRef.current.click()}
                          className="relative aspect-video w-full rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:border-orange-200 transition-all flex items-center justify-center p-4"
                        >
                          {broadcastImage ? (
                            <>
                              <img src={broadcastImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Update Image</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-orange-500 transition-colors">
                              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                              <span className="text-[9px] font-black uppercase tracking-widest">Select Cover</span>
                            </div>
                          )}
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                              <div className="w-5 h-5 border-2 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Broadcast Title</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-xs text-slate-800 shadow-sm"
                          value={broadcastTitle}
                          onChange={e => setBroadcastTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Appeal Message</label>
                        <textarea
                          rows="4"
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-[11px] text-slate-700 leading-relaxed shadow-sm resize-none"
                          value={broadcastDescription}
                          onChange={e => setBroadcastDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="px-10 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px] text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FulfillRequestModal;

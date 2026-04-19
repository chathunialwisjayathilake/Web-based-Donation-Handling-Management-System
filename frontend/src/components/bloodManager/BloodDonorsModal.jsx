import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const BloodDonorsModal = ({ isOpen, onClose, campaign, onStatusChange }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePintsInput, setActivePintsInput] = useState(null);
  const [tempPints, setTempPints] = useState("1");
  const [inputError, setInputError] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hospital-requests/needs/${campaign._id || campaign.id}/registrations`);
      setRegistrations(res.data);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaign) {
      fetchRegistrations();
    }
  }, [isOpen, campaign]);

  const handleStatusUpdate = async (regId, newStatus) => {
    if (newStatus === 'COMPLETED') {
      setActivePintsInput(regId);
      setTempPints("1");
      return;
    }

    try {
      await api.put(`/hospital-requests/needs/registrations/${regId}/status`, { 
        status: newStatus 
      });
      fetchRegistrations();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to update status', err);
      alert("Failed to update registration status.");
    }
  };

  const confirmPintsUpdate = async (regId) => {
    try {
      setInputError(null);
      const volume = parseFloat(tempPints);
      if (isNaN(volume) || volume <= 0) {
        setInputError("Enter valid volume");
        return;
      }

      await api.put(`/hospital-requests/needs/registrations/${regId}/status`, { 
        status: 'COMPLETED',
        pintsDonated: volume 
      });
      
      setActivePintsInput(null);
      fetchRegistrations();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Error updating status:", err);
      // Extract specific backend validation message (e.g. Collection Overflow)
      const errorMsg = err.response?.data?.message || "Sync failed";
      setInputError(errorMsg);
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-['Work_Sans']">
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
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                <span className="material-symbols-outlined text-2xl font-bold">group</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Campaign Registrants</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Reviewing all donors booked for "{campaign.title}"
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Booked</div>
                  <div className="text-2xl font-black text-slate-900">{registrations.length} <span className="text-sm font-bold text-slate-300 ml-1">Donors</span></div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Mix</div>
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {registrations.filter(r => r.status === 'COMPLETED').length} Completed
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {registrations.filter(r => r.status === 'PENDING').length} Pending
                    </span>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Group</div>
                  <div className="text-xl font-black text-red-600 uppercase tracking-tight">{campaign.itemName}</div>
               </div>
            </div>

            {/* Registration Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Donor Account</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Appointment Slot</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Syncing Registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : registrations.length > 0 ? (
                    registrations.map((r, index) => (
                      <motion.tr 
                        key={r._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner uppercase tracking-tighter">
                              {r.donor?.name?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-900 leading-tight">{r.donor?.name || 'Anonymous Donor'}</div>
                                <div className="text-[10px] font-medium text-slate-400 mt-0.5">{r.donor?.phone || 'No Contact'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-red-100">
                            {r.bloodType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[11px] font-black text-slate-900">
                                {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Slot: <span className="text-primary">{r.timeSlot}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {activePintsInput === r._id ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="any"
                                  min="0.1"
                                  value={tempPints}
                                  onChange={(e) => {
                                    setTempPints(e.target.value);
                                    setInputError(null);
                                  }}
                                  className={`w-24 px-3 py-2 bg-slate-50 border-2 rounded-xl text-xs font-black outline-none focus:ring-4 transition-all ${
                                    inputError ? 'border-rose-500 ring-rose-500/10' : 'border-emerald-500 ring-emerald-500/10'
                                  }`}
                                  autoFocus
                                  placeholder="Vol"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase pointer-events-none">Pints</span>
                                {inputError && (
                                  <div className="absolute -bottom-4 left-0 text-[7px] font-black text-rose-500 uppercase tracking-tighter w-full text-center">
                                    {inputError}
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => confirmPintsUpdate(r._id)}
                                className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-90"
                                title="Confirm Donation"
                              >
                                <span className="material-symbols-outlined text-lg">check</span>
                              </button>
                              <button 
                                onClick={() => setActivePintsInput(null)}
                                className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-90"
                                title="Cancel"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="relative group w-fit">
                              <select
                                value={r.status}
                                onChange={(e) => handleStatusUpdate(r._id, e.target.value)}
                                className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer shadow-sm ${
                                  r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  r.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                  'bg-amber-50 text-amber-600 border-amber-200'
                                }`}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                              <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base ${
                                  r.status === 'COMPLETED' ? 'text-emerald-500' :
                                  r.status === 'CANCELLED' ? 'text-rose-500' :
                                  'text-amber-500'
                              }`}>
                                expand_more
                              </span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                             <span className="material-symbols-outlined text-5xl">person_off</span>
                             <div className="space-y-1">
                                <div className="text-sm font-black text-slate-900 uppercase tracking-widest">No Registered Donors</div>
                                <p className="text-[11px] font-medium text-slate-500 italic max-w-xs mx-auto">No public donors have booked a slot for this campaign yet.</p>
                             </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BloodDonorsModal;

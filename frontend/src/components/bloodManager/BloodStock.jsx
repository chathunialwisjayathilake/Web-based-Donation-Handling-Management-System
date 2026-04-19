import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const BloodStock = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityData, setActivityData] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [newUnits, setNewUnits] = useState('');

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital-requests/blood/stock');
            setStocks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async (bloodType) => {
        try {
            setActivityLoading(true);
            const res = await api.get(`/bookings/activity/${encodeURIComponent(bloodType)}`);
            setActivityData(res.data);
            setIsActivityModalOpen(true);
        } catch (err) {
            console.error("Error fetching stock activity:", err);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const handleUpdate = async (type) => {
        try {
            await api.post('/hospital-requests/blood/stock', {
                bloodType: type,
                units: newUnits
            });
            setIsEditModalOpen(false);
            setNewUnits('');
            fetchStocks();
        } catch (err) {
            alert("Failed to update stock");
        }
    };

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    return (
        <div className="p-10 space-y-10 animate-in fade-in duration-500 font-['Work_Sans']">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Stock Stewardship</h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Granular control over life-saving unit inventory across all hematology groups.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {bloodTypes.map(type => {
                    const stock = stocks.find(s => s.bloodType === type) || { bloodType: type, units: 0 };
                    
                    return (
                        <motion.div 
                            key={stock.bloodType}
                            layoutId={stock.bloodType}
                            onClick={() => fetchActivity(stock.bloodType)}
                            className="group relative bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all">
                                <span className="material-symbols-outlined text-slate-300">open_in_new</span>
                            </div>

                            <div className="flex flex-col h-full justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-lg group-hover:scale-105 transition-transform">
                                        {stock.bloodType}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-semibold text-sm tracking-tight uppercase tracking-widest">Inventory Group</h3>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Live Coordination</p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none block mb-1">Available Supply</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-5xl font-semibold text-slate-900 tracking-tighter">{stock.units}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${stock.units < 30 ? 'text-red-500' : 'text-slate-400'}`}>Pints</span>
                                    </div>
                                </div>

                                <div className="w-full mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${stock.units < 30 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {stock.units < 30 ? 'Critical' : 'Stable'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStock(stock);
                                            setNewUnits(stock.units);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-sm text-[16px]">edit</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {isActivityModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]"
                        >
                            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg">
                                        {activityData[0]?.bloodType || '...'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase tracking-widest">Stewardship <span className="text-red-600">Audit</span></h2>
                                        <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-[0.2em] mt-0.5">Stewardship Analytics Feed</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsActivityModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                {activityData.length === 0 ? (
                                    <div className="py-20 text-center animate-in zoom-in-95">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                                            <span className="material-symbols-outlined text-4xl">history</span>
                                        </div>
                                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">No recorded movements for this hematology group.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-100/30">
                                        {activityData.map((event, idx) => (
                                            <div key={event._id} className="relative flex gap-12 items-start pl-5 animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-xl flex items-center justify-center z-10 border-2 border-white shadow-sm ring-1 ring-slate-100/30 ${
                                                    event.subtype === 'DONATION' ? 'bg-green-50 text-green-600' : 
                                                    event.subtype === 'TRANSFER' ? 'bg-blue-50 text-blue-600' : 
                                                    'bg-orange-50 text-orange-600'
                                                }`}>
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {event.subtype === 'DONATION' ? 'add' : 
                                                         event.subtype === 'TRANSFER' ? 'local_hospital' : 
                                                         'edit'}
                                                    </span>
                                                </div>

                                                <div className="flex-1 pt-0 ml-8">
                                                    <div className="flex justify-between items-start gap-8">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                                                                    {new Date(event.createdAt).toLocaleDateString()} — {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                                                    event.subtype === 'DONATION' ? 'bg-green-50 text-green-600' : 
                                                                    event.subtype === 'TRANSFER' ? 'bg-blue-50 text-blue-600' : 
                                                                    'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                    {event.subtype}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-slate-900 font-semibold tracking-tight mt-1 text-[14px] leading-tight">
                                                                {event.subtype === 'DONATION' ? event.donorId?.name : 
                                                                 event.subtype === 'TRANSFER' ? event.hospitalId?.name : 
                                                                 'Manual Revision'}
                                                            </h4>
                                                            <p className="text-slate-400 font-medium text-[11px] leading-relaxed mt-2.5 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/30 italic">
                                                                {event.details}
                                                            </p>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <span className={`text-lg font-semibold tracking-tighter ${
                                                                event.subtype === 'DONATION' ? 'text-green-600' : 
                                                                event.subtype === 'TRANSFER' ? 'text-blue-600' : 
                                                                'text-orange-600'
                                                            }`}>
                                                                {event.subtype === 'DONATION' ? '+' : event.subtype === 'TRANSFER' ? '-' : ''}{event.quantity}
                                                            </span>
                                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Pints</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Displaying last {activityData.length} records
                                </div>
                                <button 
                                    onClick={() => setIsActivityModalOpen(false)}
                                    className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all"
                                >
                                    Dismiss Audit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && selectedStock && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Update {selectedStock.bloodType}</h2>
                            <input 
                                type="number" 
                                step="any"
                                min="0"
                                className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl text-xl font-black focus:ring-2 focus:ring-red-500/20 mb-4"
                                value={newUnits}
                                onChange={(e) => setNewUnits(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleUpdate(selectedStock.bloodType)}
                                    className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center max-w-2xl mx-auto">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -ml-10 -mt-10"></div>
                <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-black text-white tracking-tight">Stock Integrity Verified</h3>
                    <p className="text-slate-400 text-sm font-medium italic">Latest synchronization: {new Date().toLocaleTimeString()} • All units scanned and validated.</p>
                </div>
            </div>
        </div>
    );
};

export default BloodStock;

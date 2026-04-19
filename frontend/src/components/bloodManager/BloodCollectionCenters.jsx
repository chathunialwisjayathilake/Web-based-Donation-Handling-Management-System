import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const BloodCollectionCenters = () => {
    const [locations, setLocations] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 7;

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        contactNumber: '',
        isAvailable: true
    });

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/centers');
            setLocations(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching locations:", err);
            setError("Connectivity issue: Failed to load centers.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await api.get('/hospitals');
            setHospitals(res.data);
        } catch (err) {
            console.error("Error fetching hospitals:", err);
        }
    };

    useEffect(() => {
        fetchLocations();
        fetchHospitals();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: Sri Lankan 10-digit number check
        if (!/^0\d{9}$/.test(formData.contactNumber)) {
            setError("Invalid contact: Must be 10 digits starting with '0'.");
            return;
        }

        try {
            setError(null);
            if (editingLocation) {
                await api.put(`/centers/${editingLocation._id}`, formData);
                setSuccess("Center updated!");
            } else {
                await api.post('/centers', formData);
                setSuccess("Location added!");
            }
            setShowModal(false);
            setEditingLocation(null);
            setFormData({ name: '', address: '', city: '', contactNumber: '', isAvailable: true });
            fetchLocations();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to save location details.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this collection center?")) return;
        try {
            await api.delete(`/centers/${id}`);
            setSuccess("Center removed.");
            fetchLocations();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Deletion failed.");
        }
    };

    const handleHospitalSelect = (h) => {
        setFormData({
            name: h.name,
            address: h.location,
            city: h.location.split(',')[0].trim(),
            contactNumber: h.contactNumber,
            isAvailable: true
        });
    };

    const openEdit = (loc) => {
        setEditingLocation(loc);
        setFormData({
            name: loc.name,
            address: loc.address,
            city: loc.city,
            contactNumber: loc.contactNumber,
            isAvailable: loc.isAvailable
        });
        setShowModal(true);
    };

    const filteredLocations = locations.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentLocations = filteredLocations.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 font-['Work_Sans']">
            {/* Clean Header Section */}
            <section className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Collection <span className="text-red-600">Points</span></h1>
                    <p className="text-slate-400 font-bold text-sm mt-1">Management of authorized blood donation locations.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
                        <input 
                            type="text" 
                            placeholder="Filter list..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl w-64 focus:ring-4 ring-red-500/5 focus:border-red-600 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setEditingLocation(null);
                            setFormData({ name: '', address: '', city: '', contactNumber: '', isAvailable: true });
                            setShowModal(true);
                        }}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                        Add Center
                    </button>
                </div>
            </section>

            {/* Premium Table Content */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                ) : null}

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Center Name</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">City</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {currentLocations.map((loc) => (
                            <tr key={loc._id} className="group hover:bg-slate-50/40 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loc.isAvailable ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <span className="material-symbols-outlined text-xl">{loc.isAvailable ? 'medical_services' : 'room_service'}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{loc.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {loc._id.slice(-6)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-sm font-bold text-slate-600">{loc.city}</td>
                                <td className="px-6 py-6 text-sm font-medium text-slate-500 max-w-[200px] truncate" title={loc.address}>{loc.address}</td>
                                <td className="px-6 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${loc.isAvailable ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                        {loc.isAvailable ? 'Active' : 'Closed'}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => openEdit(loc)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(loc._id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLocations.length > rowsPerPage && (
                    <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredLocations.length)} of {filteredLocations.length} Centers
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
                                {currentPage} / {Math.ceil(filteredLocations.length / rowsPerPage)}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLocations.length / rowsPerPage)))}
                                disabled={currentPage === Math.ceil(filteredLocations.length / rowsPerPage)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-50 hover:text-slate-900 hover:bg-slate-100 transition-all font-black"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}

                {filteredLocations.length === 0 && !loading && (
                    <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">location_off</span>
                        <p className="text-slate-400 font-bold text-sm tracking-tight">No collection centers found in the registry.</p>
                    </div>
                )}
            </div>

            {/* Compact & Friendly Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div 
                            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        ></motion.div>
                        <motion.div 
                            initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}}
                            className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingLocation ? 'Edit' : 'Add'} Center</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Management Point</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>

                            {/* Inline Notifications for Modal */}
                            <div className="px-8 pt-6">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="p-4 bg-red-50 text-red-700 rounded-2xl font-bold border border-red-100 flex items-center gap-3 text-sm">
                                            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                                            {error}
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="p-4 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-100 flex items-center gap-3 text-sm">
                                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                            {success}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Compact Import Picker */}
                                {!editingLocation && (
                                    <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                        <label className="text-[9px] font-black uppercase text-red-600 mb-2 block tracking-widest">Quick Import Hospital</label>
                                        <select 
                                            onChange={(e) => {
                                                const h = hospitals.find(x => x._id === e.target.value);
                                                if (h) handleHospitalSelect(h);
                                            }}
                                            className="w-full bg-white border border-red-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-red-500/10"
                                        >
                                            <option value="">Search hospitals...</option>
                                            {hospitals.map(h => (
                                                <option key={h._id} value={h._id}>{h.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">Designation</label>
                                        <input 
                                            type="text" required placeholder="e.g. City Blood Center"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-red-600 transition-all"
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">City</label>
                                            <input 
                                                type="text" required placeholder="Colombo"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-red-600 transition-all"
                                                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">Contact (10 Digits)</label>
                                            <input 
                                                type="text" required placeholder="0771234567"
                                                maxLength={10}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-red-600 transition-all font-mono"
                                                value={formData.contactNumber} 
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 10) setFormData({...formData, contactNumber: val});
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">Address</label>
                                        <textarea 
                                            required rows="3" placeholder="Enter physical location..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:border-red-600 transition-all resize-none shadow-inner"
                                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 transition-all border ${formData.isAvailable ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-400 font-bold border-slate-200'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{formData.isAvailable ? 'Center Operational' : 'Center Closed'}</span>
                                    </button>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-red-600/10 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-xl">save</span>
                                    {editingLocation ? 'Save Changes' : 'Add Location'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BloodCollectionCenters;

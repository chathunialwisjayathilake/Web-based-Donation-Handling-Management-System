import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './BookBlood.css';

const BookBlood = () => {
    const { user, isAuthenticated, openLogin } = useAuth();
    const navigate = useNavigate();
    
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [activeCity, setActiveCity] = useState('All');
    const [donorBookings, setDonorBookings] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        bloodType: user?.bloodType || '',
        date: '',
        timeSlot: ''
    });

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const fetchDonorBookings = async () => {
        if (!user?._id && !user?.id) return;
        try {
            setLoadingHistory(true);
            const res = await api.get(`/bookings/donor/${user._id || user.id}`);
            setDonorBookings(res.data);
        } catch (err) {
            console.error("Error fetching donor history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoadingLocations(true);
                const res = await api.get('/centers');
                setLocations(res.data.filter(l => l.isAvailable));
            } catch (err) {
                console.error("Error fetching locations:", err);
            } finally {
                setLoadingLocations(false);
            }
        };
        
        fetchLocations();
        if (isAuthenticated) {
            fetchDonorBookings();
        }
    }, [isAuthenticated, user]);

    const cities = ['All', ...new Set(locations.map(l => l.city))];

    const filteredLocations = locations.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = activeCity === 'All' || l.city === activeCity;
        return matchesSearch && matchesCity;
    });

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            openLogin();
            return;
        }

        if (!selectedLocation) {
            setError("Please select a donation center first.");
            return;
        }

        try {
            setBookingLoading(true);
            setError(null);
            
            await api.post('/hospital-requests/blood/book', {
                donorId: user?._id || user?.id,
                hospitalId: selectedLocation._id,
                bloodType: formData.bloodType,
                date: formData.date,
                timeSlot: formData.timeSlot
            });

            // Refresh history after successful booking
            fetchDonorBookings();
            setBookingSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error("Booking error:", err);
            setError(err.response?.data?.message || "Failed to book appointment. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    if (bookingSuccess) {
        return (
            <div className="book-blood-wrapper">
                <div className="book-blood-container">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="booking-form-card"
                    >
                        <div className="booking-success-content">
                            <div className="success-icon-wrapper">
                                <i className="fa-solid fa-circle-check"></i>
                            </div>
                            <h2 className="success-title">Slot Booked!</h2>
                            <p className="success-desc">
                                Your blood donation slot at <strong>{selectedLocation?.name}</strong> in <strong>{selectedLocation?.city}</strong> has been successfully booked. 
                                Thank you for your contribution to saving lives.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={() => setBookingSuccess(false)}
                                    className="back-home-btn"
                                >
                                    <i className="fa-solid fa-calendar-plus"></i>
                                    <span>Book Another Slot</span>
                                </button>
                                <Link to="/" className="btn-primary flex items-center gap-2 px-8">
                                    <i className="fa-solid fa-house"></i>
                                    <span>Back to Home</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="book-blood-wrapper">
            <div className="book-blood-container">
                <header className="booking-header">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="booking-badge"
                    >
                        Donor Center Selection
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="booking-title"
                    >
                        Find Your Nearest <span className="text-primary">Collection</span> <br /> Point
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="booking-subtitle"
                    >
                        Choose from our authorized collection centers. We've systemized our locations to help you find the most convenient spot.
                    </motion.p>
                </header>

                <div className="booking-grid mb-12">
                    {/* Left side: Hospital Selection */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hospital-selector-card"
                    >
                        <h3 className="selector-title">1. Select Collection Point</h3>
                        <div className="search-input-wrapper">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input 
                                type="text" 
                                placeholder="Search center or city..."
                                className="hospital-search-field"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* City Tabs */}
                        {!loadingLocations && cities.length > 1 && (
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                {cities.map(city => (
                                    <button 
                                        key={city}
                                        onClick={() => setActiveCity(city)}
                                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCity === city ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loadingLocations ? (
                            <div className="spinner-container">
                                <div className="spinner-dual"></div>
                            </div>
                        ) : (
                            <div className="hospitals-list">
                                {filteredLocations.length > 0 ? (
                                    filteredLocations.map(l => (
                                        <div 
                                            key={l._id} 
                                            className={`hospital-item ${selectedLocation?._id === l._id ? 'selected' : ''}`}
                                            onClick={() => setSelectedLocation(l)}
                                        >
                                            <div className="h-icon-box">
                                                <i className="fa-solid fa-location-dot"></i>
                                            </div>
                                            <div className="hospital-info-mini">
                                                <h4>{l.name}</h4>
                                                <p><i className="fa-solid fa-city"></i> {l.city}</p>
                                                <p className="text-[10px] mt-1 opacity-70">{l.address}</p>
                                            </div>
                                            {selectedLocation?._id === l._id && (
                                                <motion.div 
                                                    layoutId="selected-check"
                                                    className="ml-auto text-primary"
                                                >
                                                    <i className="fa-solid fa-check-circle text-xl"></i>
                                                </motion.div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="hospitals-empty">
                                        <i className="fa-solid fa-location-off h-empty-icon"></i>
                                        <p className="h-empty-text">No collection centers found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Right side: Booking Form */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="booking-form-card"
                    >
                        <h3 className="selector-title">2. Details & Time</h3>
                        
                        {!isAuthenticated ? (
                            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[32px] text-center">
                                <i className="fa-solid fa-user-lock text-3xl text-slate-300 mb-4"></i>
                                <h4 className="font-black text-slate-900 mb-2">Auth Required</h4>
                                <p className="text-sm text-slate-500 font-medium mb-6">Please sign in to register as a donor and book an appointment.</p>
                                <button onClick={openLogin} className="btn-primary w-full">Sign In Now</button>
                            </div>
                        ) : (
                            <form onSubmit={handleBooking} className="booking-form">
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                                        <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                        {error}
                                    </div>
                                )}

                                <div className="form-section">
                                    <p className="form-section-title">Blood Information</p>
                                    <div className="form-group">
                                        <label>Your Blood Type</label>
                                        <select 
                                            className="booking-input booking-select"
                                            required
                                            value={formData.bloodType}
                                            onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                                        >
                                            <option value="">Select blood type</option>
                                            {validBloodTypes.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <p className="form-section-title">Schedule</p>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Preferred Date</label>
                                            <input 
                                                type="date" 
                                                className="booking-input"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Appointment Time</label>
                                            <input 
                                                type="time" 
                                                className="booking-input"
                                                required
                                                value={formData.timeSlot}
                                                onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="book-submit-btn"
                                    disabled={bookingLoading || !selectedLocation}
                                >
                                    {bookingLoading ? (
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-calendar-check text-lg"></i>
                                            <span>Confirz Booking</span>
                                        </>
                                    )}
                                </button>
                                
                                {!selectedLocation && (
                                    <p className="text-[10px] text-center font-bold text-slate-400 mt-2">
                                        * Select a donation center from the left to enable booking
                                    </p>
                                )}
                            </form>
                        )}
                    </motion.div>
                </div>

                {/* New Section: Your Booking History */}
                {isAuthenticated && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="booking-history-section mt-12 mb-20"
                    >
                        <div className="flex justify-between items-end mb-8 px-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your <span className="text-red-600">Booking</span> History</h2>
                                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Track your steward contributions</p>
                            </div>
                            <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100 flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Bookings</span>
                                <span className="text-lg font-black text-slate-900">{donorBookings.length}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden min-h-[300px] relative">
                            {loadingHistory && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Syncing your records...</p>
                                </div>
                            )}

                            {donorBookings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue / Campaign</th>
                                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Group</th>
                                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {donorBookings.map((reg) => (
                                                <tr key={reg._id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                                                <span className="material-symbols-outlined text-xl">{reg.campaignId ? 'event' : 'local_hospital'}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-slate-900 tracking-tight text-lg group-hover:text-red-600 transition-colors uppercase tracking-widest">
                                                                    {reg.campaignId?.title || reg.hospitalId?.name || 'Authorized Center'}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                                    {reg.hospitalId?.city || reg.campaignId?.location || 'Stewardship Point'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8">
                                                        <div className="text-slate-900 font-black text-sm">
                                                            {reg.date ? new Date(reg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending Sync'}
                                                        </div>
                                                        <div className="text-[10px] font-black text-red-600/60 uppercase mt-0.5 tracking-widest flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                                            {reg.timeSlot}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <div className="inline-flex w-10 h-10 rounded-full bg-red-50 border border-red-100 items-center justify-center text-sm font-black text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                                                            {reg.bloodType}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm ${
                                                            reg.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                                            reg.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                            'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                            {reg.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-end gap-2 group-hover:text-slate-400 transition-colors">
                                                            ID: {reg._id.slice(-8)}
                                                            <span className="material-symbols-outlined text-[12px]">fingerprint</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                        <span className="material-symbols-outlined text-slate-200 text-4xl">inventory_2</span>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">No Appointments Found</h4>
                                    <p className="text-slate-400 mt-2 max-w-xs mx-auto font-bold text-sm tracking-tight leading-relaxed uppercase">You haven't booked any slots yet. Join our stewardship program today!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BookBlood;

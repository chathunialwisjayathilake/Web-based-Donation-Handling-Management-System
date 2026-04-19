import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DonateModal from '../components/home/DonateModal';
import CampaignRegistrationModal from '../components/donor/CampaignRegistrationModal';
import ContributionStatusModal from '../components/donor/ContributionStatusModal';
import './Donate.css';

const DonatePage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedNeed, setSelectedNeed] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const donationOptions = [
        {
            id: 'funds',
            title: 'Donate Funds',
            description: 'Provide critical funding for medical bills, hospital infrastructure, and urgent healthcare projects.',
            icon: 'fa-hand-holding-dollar',
            category: 'FINANCE',
            color: 'var(--primary-color)',
            delay: 0.1
        },
        {
            id: 'items',
            title: 'Donate Supplies',
            description: 'Donate essential medical equipment, medicine, and hygiene kits directly to hospitals in need.',
            icon: 'fa-kit-medical',
            category: 'ITEM',
            color: '#2563eb', 
            delay: 0.2
        },
        {
            id: 'blood',
            title: 'Donate Bloods',
            description: 'Register as a donor and schedule a life-saving blood donation at your nearest medical center.',
            icon: 'fa-droplet',
            category: 'BLOOD',
            color: '#dc2626', 
            delay: 0.3
        }
    ];

    useEffect(() => {
        if (location.state && location.state.category) {
            handleCategoryClick(location.state.category);
            // Clear state so it doesn't trigger on reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state, user]); // Added user dependency to ensure correct donor ID is passed if they log in

    const fetchRequests = async (category) => {
        setLoadingRequests(true);
        try {
            const donorId = user?._id || user?.id;
            const endpoint = `/hospital-requests/needs?status=PENDING&category=${category}${donorId ? `&donorId=${donorId}` : ''}`;
            const res = await api.get(endpoint);
            console.log("Requests received:", res.data);
            setRequests(res.data);
            
            // Auto-scroll to requests section
            setTimeout(() => {
                document.getElementById('impact-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        fetchRequests(category);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="donate-page-wrapper">
            <div className="donate-bg-elements">
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
            </div>

            <section className="donate-hero container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="donate-header text-center"
                >
                    <span className="badge-pill mb-6">Make a Difference</span>
                    <h1 className="donate-title">Choose Your <span className="text-gradient">Impact.</span></h1>
                    <p className="donate-subtitle">
                        Every contribution, no matter the size, brings us one step closer to <br />
                        a healthier, more resilient community.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="donation-grid mt-16"
                >
                    {donationOptions.map((option) => (
                        <motion.div
                            key={option.id}
                            variants={cardVariants}
                            whileHover={{ y: -15, transition: { duration: 0.4 } }}
                            className={`donation-card glass-panel ${selectedCategory === option.category ? 'active-card' : ''}`}
                            onClick={() => handleCategoryClick(option.category)}
                        >
                            <div className="card-icon-wrapper" style={{ '--accent-color': option.color }}>
                                <i className={`fa-solid ${option.icon}`}></i>
                                <div className="icon-glow"></div>
                            </div>

                            <h3 className="card-title">{option.title}</h3>
                            <p className="card-description">{option.description}</p>

                            <button className="card-action-btn">
                                <span>Donate</span>
                            </button>

                            <div className="card-bg-glow"></div>
                        </motion.div>
                    ))}
                </motion.div>

                <AnimatePresence>
                    {selectedCategory && (
                        <motion.div 
                            id="impact-section"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-32 space-y-16 pb-20"
                        >
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Available Urgent <span className="text-primary">Requests</span></h2>
                                <p className="text-slate-500 mt-2 font-medium italic">Targeted impact areas requiring immediate intervention.</p>
                            </div>

                            {loadingRequests ? (
                                <div className="flex flex-col items-center py-20 text-slate-400 gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                                    <span className="font-bold italic">Synchronizing live hospital data...</span>
                                </div>
                            ) : requests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {requests.map((request, index) => {
                                        const donated = (parseInt(request.donatedQuantity) || 0) + (parseInt(request.transferredQuantity) || 0) + (parseInt(request.pendingTransferQuantity) || 0);
                                        const total = parseInt(request.quantity || 1);
                                        const percent = Math.min(100, Math.max(0, Math.round((donated / (total || 1)) * 100)));
                                        return (
                                            <motion.div 
                                                key={request._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 space-y-6 group hover:shadow-2xl transition-all duration-500 flex flex-col"
                                            >
                                                <div className="-mx-8 -mt-8 mb-2 h-48 overflow-hidden rounded-t-[40px] relative bg-slate-100 shrink-0">
                                                    <img 
                                                        src={request.imageUrl || "/assets/medical-equipment.jpg"} 
                                                        alt={request.title || request.itemName} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                    />
                                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-widest shadow-sm">
                                                        {request.category === 'BLOOD' ? "Blood Drive" : request.category === 'FINANCE' ? "Financial Aid" : "Medical Supplies"}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 flex-1">
                                                    <div 
                                                        onClick={() => {
                                                            setSelectedNeed(request);
                                                            setIsStatusModalOpen(true);
                                                        }}
                                                        className="cursor-pointer group/title"
                                                    >
                                                        <h4 className="text-xl font-black text-slate-900 leading-tight group-hover/title:text-primary transition-colors">{request.itemName || request.title}</h4>
                                                        <p className="text-slate-500 text-sm font-medium italic mt-2 leading-relaxed line-clamp-2">"{request.description}"</p>
                                                    </div>

                                                    {(request.location || request.contact) && (
                                                        <div className="flex flex-wrap gap-3 py-2 border-y border-slate-50">
                                                            {request.location && (
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
                                                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                                                    {request.location}
                                                                </div>
                                                            )}
                                                            {request.contact && (
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
                                                                    <span className="material-symbols-outlined text-sm">call</span>
                                                                    {request.contact}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {request.category === 'BLOOD' && (request.date || request.startTime) && (
                                                    <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-red-700">
                                                            <span className="material-symbols-outlined text-sm font-bold">event</span>
                                                            <span className="text-[11px] font-bold uppercase tracking-widest">{request.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-red-600/70">
                                                            <span className="material-symbols-outlined text-sm font-bold">schedule</span>
                                                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                                                {request.startTime} — {request.endTime || 'Open'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{percent}% Complete</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Goal: {request.quantity} {request.category === 'BLOOD' ? 'Pints' : request.category === 'FINANCE' ? '' : 'Units'}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[1px]">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${request.category === 'BLOOD' ? 'bg-red-600' : 'bg-primary'}`} 
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => {
                                                        if (percent >= 100) return;
                                                        if (request.category === 'BLOOD' && request.donorHasRegistered) return;
                                                        setSelectedNeed(request);
                                                        if (request.category === 'BLOOD') {
                                                            setIsRegModalOpen(true);
                                                        } else {
                                                            setIsModalOpen(true);
                                                        }
                                                    }}
                                                    disabled={(request.category === 'BLOOD' && request.donorHasRegistered) || percent >= 100}
                                                    className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group/btn ${
                                                        percent >= 100
                                                        ? 'bg-green-50/80 text-green-600 cursor-not-allowed border-2 border-green-100 shadow-inner'
                                                        : request.category === 'BLOOD' 
                                                            ? request.donorHasRegistered
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-inner'
                                                                : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                                                            : 'bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white'
                                                    }`}
                                                >
                                                    <span className={`material-symbols-outlined text-lg ${percent < 100 && !request.donorHasRegistered ? 'group-hover/btn:rotate-12 transition-transform' : ''}`}>
                                                        {percent >= 100
                                                            ? 'task_alt'
                                                            : request.category === 'BLOOD' 
                                                                ? request.donorHasRegistered ? 'how_to_reg' : 'emergency' 
                                                                : 'volunteer_activism'}
                                                    </span>
                                                    {percent >= 100
                                                        ? 'Goal Reached — Thank You!'
                                                        : request.category === 'BLOOD' 
                                                            ? request.donorHasRegistered ? `Registered — ${request.donorTimeSlot || 'Flexible'}` : 'Participate in Drive' 
                                                            : 'Make your donation'}
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic">No active requests found for this category at the moment.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="donate-footer mt-24"
                >
                    <div className="trust-banner glass-panel">
                        <div className="trust-item">
                            <i className="fa-solid fa-shield-check"></i>
                            <span>Secure Transactions</span>
                        </div>
                        <div className="divider"></div>
                        <div className="trust-item">
                            <i className="fa-solid fa-eye"></i>
                            <span>100% Transparency</span>
                        </div>
                        <div className="divider"></div>
                        <div className="trust-item">
                            <i className="fa-solid fa-handshake-angle"></i>
                            <span>Direct Impact</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            <DonateModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchRequests(selectedCategory)}
                need={selectedNeed}
            />

            <CampaignRegistrationModal 
                isOpen={isRegModalOpen}
                onClose={() => {
                    setIsRegModalOpen(false);
                    setSelectedNeed(null);
                }}
                campaign={selectedNeed}
                onSuccess={() => {
                    fetchRequests(selectedCategory);
                }}
            />
            <ContributionStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                need={selectedNeed}
            />
        </div>
    );
};

export default DonatePage;

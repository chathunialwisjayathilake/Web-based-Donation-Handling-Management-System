import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CampaignRegistrationModal = ({ isOpen, onClose, campaign, onSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        bloodType: '',
        timeSlot: '',
        date: '',
        confirmHealth: false
    });

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const isSpecificBloodDrive = campaign?.itemName && validBloodTypes.includes(campaign?.itemName);

    useEffect(() => {
        if (isOpen && campaign) {
            setFormData({
                bloodType: isSpecificBloodDrive ? campaign.itemName : (user?.bloodType || ''),
                timeSlot: '',
                date: campaign.date || '',
                confirmHealth: false
            });
            setStep(1);
        }
    }, [isOpen, campaign, user, isSpecificBloodDrive]);

    if (!isOpen || !campaign) return null;

    const handleRegister = async () => {
        if (!formData.confirmHealth) {
            alert('Please confirm your health eligibility to register.');
            return;
        }
        try {
            setLoading(true);
            await api.post(`/hospital-requests/needs/${campaign._id}/register`, {
                donorId: user?._id || user?.id,
                bloodType: formData.bloodType,
                date: formData.date,
                timeSlot: formData.timeSlot
            });
            onSuccess();
            setStep(3);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to register. Please ensure you are logged in.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-300 transition-all appearance-none";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Work_Sans']">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
                />

                {/* Modal — horizontal two-column */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 28 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 28 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    className="relative w-full max-w-2xl bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden flex"
                    style={{ minHeight: '420px', maxHeight: 'calc(100vh - 100px)' }}
                >
                    {/* ── LEFT HERO PANEL ── */}
                    <div
                        className="w-[210px] shrink-0 flex flex-col justify-between p-6 relative overflow-hidden"
                        style={{ background: 'linear-gradient(145deg, #7f1d1d 0%, #dc2626 100%)' }}
                    >
                        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
                        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-white/5" />

                        <div className="relative z-10 space-y-5">
                            {/* Badge */}
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
                                <span className="material-symbols-outlined text-white text-sm">bloodtype</span>
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.25em]">Blood Drive</span>
                            </span>

                            {/* Campaign Info */}
                            <div>
                                <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                                    {campaign.title || campaign.itemName || 'Blood Donation Drive'}
                                </h2>
                                {isSpecificBloodDrive && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20">
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Required Type:</span>
                                        <span className="text-sm font-black text-white">{campaign.itemName}</span>
                                    </div>
                                )}
                            </div>

                            {/* Drive details */}
                            <div className="space-y-2">
                                {campaign.date && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 border border-white/15">
                                        <span className="material-symbols-outlined text-white/70 text-lg">event</span>
                                        <div>
                                            <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Drive Date</div>
                                            <div className="text-xs font-black text-white">{campaign.date}</div>
                                        </div>
                                    </div>
                                )}
                                {(campaign.startTime || campaign.endTime) && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 border border-white/15">
                                        <span className="material-symbols-outlined text-white/70 text-lg">schedule</span>
                                        <div>
                                            <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Hours</div>
                                            <div className="text-xs font-black text-white">
                                                {campaign.startTime && campaign.endTime ? `${campaign.startTime} – ${campaign.endTime}` : 'Variable'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step indicator */}
                            {step < 3 && (
                                <div className="flex items-center gap-2 pt-2">
                                    {[1, 2].map(s => (
                                        <div key={s} className={`flex items-center gap-2`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? 'bg-white text-red-700' : 'bg-white/20 text-white/50'}`}>{s}</div>
                                            {s < 2 && <div className={`w-6 h-0.5 rounded-full ${step > s ? 'bg-white' : 'bg-white/20'}`} />}
                                        </div>
                                    ))}
                                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1">
                                        {step === 1 ? 'Details' : 'Eligibility'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bottom note */}
                        <div className="relative z-10 p-4 rounded-2xl bg-white/10 border border-white/15">
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-white/70 text-lg mt-0.5">emergency</span>
                                <div>
                                    <div className="text-white text-[10px] font-black uppercase tracking-wider mb-1">Every drop counts</div>
                                    <p className="text-white/55 text-[10px] font-medium leading-relaxed">
                                        One donation can save up to three lives. Your appointment is recorded in our secure ledger.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT FORM PANEL ── */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="px-7 pt-5 pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Drive Registration</h3>
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">
                                    {step === 1 ? 'Step 1 of 2 · Appointment Details' : step === 2 ? 'Step 2 of 2 · Health Eligibility' : 'Registration Complete'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                            >
                                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto px-7 py-5">
                            <AnimatePresence mode="wait">

                                {/* STEP 1 */}
                                {step === 1 && (
                                    <motion.div key="step1"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5 h-full"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                {isSpecificBloodDrive ? 'Required Blood Type' : 'Your Blood Type'}
                                            </label>
                                            <select
                                                className={inputCls + (isSpecificBloodDrive ? ' opacity-70 cursor-not-allowed' : '')}
                                                value={formData.bloodType}
                                                onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                                                disabled={isSpecificBloodDrive}
                                            >
                                                <option value="">Select blood type</option>
                                                {validBloodTypes.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preferred Time Slot</label>
                                            <input
                                                type="time"
                                                className={inputCls}
                                                value={formData.timeSlot}
                                                onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                                            />
                                        </div>

                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-red-500 text-lg">info</span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                                Your appointment will be confirmed by the hospital team. Bring a valid ID on arrival.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2 */}
                                {step === 2 && (
                                    <motion.div key="step2"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-2.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Eligibility Notice</span>
                                            </div>
                                            {[
                                                'I confirm I am in good health and at least 18 years of age.',
                                                'I have not had major surgery or heavy medication in the last 6 months.',
                                                'I understand final screening will occur at the drive location.'
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-amber-800 font-medium">
                                                    <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">check_circle</span>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>

                                        <label className="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-all group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500"
                                                checked={formData.confirmHealth}
                                                onChange={e => setFormData({ ...formData, confirmHealth: e.target.checked })}
                                            />
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                I accept and confirm all eligibility requirements.
                                            </span>
                                        </label>
                                    </motion.div>
                                )}

                                {/* STEP 3 — SUCCESS */}
                                {step === 3 && (
                                    <motion.div key="step3"
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center h-full text-center space-y-5 py-8"
                                    >
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                            <span className="material-symbols-outlined text-5xl">verified</span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registration Confirmed!</h3>
                                            <p className="text-sm font-medium text-slate-500 mt-3 leading-relaxed max-w-xs mx-auto">
                                                Thank you for your commitment. You're registered for the drive on{' '}
                                                <span className="font-black text-slate-900">{campaign.date || 'the scheduled date'}</span>.
                                            </p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-sm">bloodtype</span>
                                                <span className="text-xs font-black text-green-700 uppercase tracking-widest">{formData.bloodType}</span>
                                            </div>
                                            {formData.timeSlot && (
                                                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">schedule</span>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{formData.timeSlot}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer CTA */}
                        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
                            {step === 1 && (
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.bloodType}
                                    className="w-full h-11 bg-[#b7131a] text-white font-black rounded-xl shadow-lg hover:bg-[#9e0f16] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2.5 text-sm tracking-wide"
                                >
                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                    Continue to Health Form
                                </button>
                            )}
                            {step === 2 && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-10 h-11 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                                    >
                                        <span className="material-symbols-outlined" style={{fontSize:'18px'}}>arrow_back</span>
                                    </button>
                                    <button
                                        onClick={handleRegister}
                                        disabled={loading || !formData.confirmHealth}
                                        className="flex-1 h-11 bg-[#b7131a] text-white font-black rounded-xl shadow-lg shadow-red-900/25 hover:bg-[#9e0f16] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2.5 text-sm tracking-wide"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">how_to_reg</span>
                                                Finalize Registration
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            {step === 3 && (
                                <button
                                    onClick={onClose}
                                    className="w-full h-11 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 text-sm tracking-wide"
                                >
                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                    Return to Platform
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CampaignRegistrationModal;

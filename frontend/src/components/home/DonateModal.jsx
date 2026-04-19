import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

const DonateModal = ({ isOpen, onClose, onSuccess, need }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('Flexible');

  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSlipFile(file); setSlipPreview(URL.createObjectURL(file)); }
  };

  const uploadSlip = async () => {
    try {
      if (!slipFile) return null;
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `slips/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('item-donations').upload(fileName, slipFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('item-donations').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Slip upload failed:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError('Please enter a valid amount.');

    if (need?.quantity) {
      const goal = parseFloat(need.quantity) || 0;
      const current = parseFloat(need.donatedQuantity) || 0;
      const remaining = Math.max(0, goal - current);
      if (amt > remaining) return setError(`Exceeds target. Max ${isFinance ? 'LKR ' : ''}${remaining.toLocaleString()} remaining.`);
    }

    if (isFinance) {
      if (paymentMethod === 'CARD') {
        if (!cardNumber || cardNumber.length < 16) return setError('Enter a full 16-digit card number.');
        if (!expiry || !expiry.includes('/') || expiry.length < 5) return setError('Invalid expiry format (MM/YY).');
        const [m] = expiry.split('/').map(n => parseInt(n));
        if (m < 1 || m > 12) return setError('Invalid expiry month.');
        if (cvv.length < 3) return setError('Valid 3-digit CVC required.');
      } else if (paymentMethod === 'BANK_TRANSFER') {
        if (!bankName) return setError('Please specify your bank name.');
        if (!slipFile) return setError('Please upload your deposit slip.');
      }
    } else if (isItem && !deliveryMethod) {
      return setError('Please select a delivery option.');
    }

    try {
      setLoading(true);
      const needId = need.id || need._id;
      if (isBlood) {
        if (!bloodType) return setError('Please select your blood type.');
        await api.post(`/hospital-requests/needs/${needId}/register`, {
          donorId: user?._id || user?.id, bloodType, date: donationDate, timeSlot
        });
      } else {
        let slipUrl = null;
        if (paymentMethod === 'BANK_TRANSFER') slipUrl = await uploadSlip();
        await api.post(`/hospital-requests/needs/${needId}/donate`, {
          amount: amt,
          donorId: user?._id || user?.id,
          deliveryMethod: isItem ? deliveryMethod : undefined,
          paymentMethod: isFinance ? paymentMethod : 'NONE',
          cardNumber: paymentMethod === 'CARD' ? `**** **** **** ${cardNumber.slice(-4)}` : undefined,
          bankName: paymentMethod === 'BANK_TRANSFER' ? bankName : undefined,
          imageUrl: slipUrl
        });
      }
      onSuccess(); onClose(); resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(''); setDeliveryMethod(''); setPaymentMethod('CARD');
    setCardNumber(''); setExpiry(''); setCvv(''); setBankName('');
    setSlipFile(null); setSlipPreview(null); setBloodType('');
    setDonationDate(new Date().toISOString().split('T')[0]); setTimeSlot('Flexible');
    setError('');
  };

  if (!isOpen) return null;

  const isBlood = need?.category === 'BLOOD';
  const isFinance = need?.category === 'FINANCE';
  const isItem = need?.category === 'ITEM' || !need?.category;

  const remaining = Math.max(0, (parseFloat(need?.quantity) || 0) - (parseFloat(need?.donatedQuantity) || 0));
  const progress = need?.quantity > 0 ? Math.min(100, ((parseFloat(need?.donatedQuantity) || 0) / parseFloat(need?.quantity)) * 100) : 0;

  const panelGradient = isBlood
    ? 'linear-gradient(145deg, #7f1d1d 0%, #dc2626 100%)'
    : 'linear-gradient(145deg, #6b0a0a 0%, #b7131a 100%)';

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
          className="relative w-full max-w-3xl bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden flex"
          style={{ minHeight: '460px', maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* ── LEFT HERO PANEL ── */}
          <div
            className="w-[230px] shrink-0 flex flex-col justify-between p-7 relative overflow-hidden"
            style={{ background: panelGradient }}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/3 blur-3xl" />

            <div className="relative z-10 space-y-5">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>
                  {isBlood ? 'bloodtype' : isFinance ? 'payments' : 'volunteer_activism'}
                </span>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.25em]">
                  {isBlood ? 'Blood Drive' : isFinance ? 'Fund Donation' : 'Item Pledge'}
                </span>
              </span>

              {/* Title */}
              <div>
                <h2 className="text-[16px] font-black text-white leading-tight tracking-tight">
                  {need?.itemName || need?.title || 'Campaign Contribution'}
                </h2>
                {need?.description && (
                  <p className="text-white/50 text-[11px] font-medium mt-2 leading-relaxed line-clamp-3">
                    {need.description}
                  </p>
                )}
              </div>

              {/* Progress */}
              {!isBlood && need?.quantity > 0 && (
                <div className="space-y-2.5">
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{Math.round(progress)}% funded</span>
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                      {isFinance ? `LKR ${remaining.toLocaleString()}` : remaining} left
                    </span>
                  </div>
                </div>
              )}

              {/* Stats grid */}
              {need?.quantity > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <div className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Goal</div>
                    <div className="text-sm font-black text-white">
                      {isFinance ? `LKR ${parseFloat(need.quantity).toLocaleString()}` : need.quantity}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <div className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Raised</div>
                    <div className="text-sm font-black text-white">
                      {isFinance ? `LKR ${(parseFloat(need.donatedQuantity) || 0).toLocaleString()}` : (parseFloat(need.donatedQuantity) || 0)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stewardship promise */}
            <div className="relative z-10 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-white/70 text-lg mt-0.5">shield</span>
                <div>
                  <div className="text-white text-[10px] font-black uppercase tracking-wider mb-1">Stewardship Promise</div>
                  <p className="text-white/55 text-[10px] font-medium leading-relaxed">
                    {isBlood
                      ? 'Your appointment is confirmed and securely recorded in the coordination ledger.'
                      : 'Funds are held in escrow and released only after hospital manager authorization.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT FORM PANEL ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="px-8 pt-5 pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight">
                  {isBlood ? 'Register for Drive' : 'Make a Contribution'}
                </h3>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Secure · Verified · Instant</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl"
                  >
                    <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
                    <p className="text-rose-600 text-xs font-bold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isBlood && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Blood Type</label>
                    <select
                      value={bloodType} onChange={e => setBloodType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-300 transition-all appearance-none text-sm"
                    >
                      <option value="">Select blood type</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Appointment Date</label>
                    <input
                      type="date" value={donationDate} onChange={e => setDonationDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-300 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Preference</label>
                    <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-300 transition-all appearance-none text-sm"
                    >
                      <option value="Flexible">Flexible</option>
                      <option value="Morning (08:00 - 12:00)">Morning (08:00–12:00)</option>
                      <option value="Afternoon (12:00 - 16:00)">Afternoon (12:00–16:00)</option>
                      <option value="Evening (16:00 - 20:00)">Evening (16:00–20:00)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* AMOUNT (Finance / Item) */}
              {!isBlood && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {isFinance ? 'Commitment Amount' : 'Quantity to Fulfill'}
                    </label>
                    <div className="relative">
                      <input
                        type="number" value={amount} required
                        min="0"
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          if (val !== '' && val < 0) setAmount('0');
                          else if (val !== '' && val > remaining) setAmount(String(remaining));
                          else setAmount(e.target.value);
                        }}
                        placeholder={isFinance ? '0.00' : '0'}
                        className="w-full pl-6 pr-20 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-slate-300 font-black text-3xl text-slate-900 transition-all placeholder:text-slate-200 placeholder:font-normal"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs uppercase tracking-widest pointer-events-none">
                        {isFinance ? 'LKR' : 'Units'}
                      </span>
                    </div>
                    {need?.quantity > 0 && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Remaining: <span className="font-black text-slate-700">{isFinance ? `LKR ${remaining.toLocaleString()}` : remaining}</span>
                      </p>
                    )}
                  </div>

                  {/* FINANCE: payment method */}
                  {isFinance && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { val: 'CARD', icon: 'credit_card', label: 'Card Pay' },
                            { val: 'BANK_TRANSFER', icon: 'account_balance', label: 'Bank Transfer' }
                          ].map(({ val, icon, label }) => (
                            <button key={val} type="button" onClick={() => setPaymentMethod(val)}
                              className={`py-4 px-4 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all text-sm font-black ${paymentMethod === val ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:border-slate-200'}`}
                            >
                              <span className="material-symbols-outlined text-xl">{icon}</span>
                              <span className="text-[10px] uppercase tracking-widest">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {paymentMethod === 'CARD' ? (
                          <motion.div key="card"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
                          >
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Card Number</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">credit_card</span>
                                <input type="text" maxLength="16" placeholder="4242 4242 4242 4242"
                                  value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 tracking-[0.15em] outline-none focus:ring-4 focus:ring-slate-900/8 focus:border-slate-400 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry</label>
                                <input type="text" placeholder="MM / YY" maxLength="5" value={expiry}
                                  onChange={e => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                                    setExpiry(v);
                                  }}
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/8 focus:border-slate-400 transition-all tracking-widest placeholder:font-normal placeholder:text-slate-300"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CVC</label>
                                <input type="text" placeholder="•••" maxLength="3" value={cvv}
                                  onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/8 focus:border-slate-400 transition-all tracking-[0.4em] placeholder:text-slate-200 placeholder:tracking-widest"
                                />
                              </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-emerald-500">lock</span>
                              SSL Encrypted · Mock Authorization
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div key="bank"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
                          >
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sending Bank</label>
                              <input type="text" placeholder="e.g. Bank of Ceylon / HNB" value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/8 focus:border-slate-400 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deposit Slip</label>
                              <div className="relative group h-28 rounded-xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-slate-400 transition-all cursor-pointer">
                                {slipPreview ? (
                                  <>
                                    <img src={slipPreview} alt="Slip" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Slip</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center">
                                    <span className="material-symbols-outlined text-slate-300 text-2xl">upload_file</span>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Upload JPG / PNG</p>
                                  </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleSlipChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ITEM: delivery method */}
                  {isItem && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Delivery Preference</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: 'DROP_OFF', icon: 'directions_walk', label: 'Hospital Hand-over' },
                          { val: 'DELIVERY', icon: 'local_shipping', label: 'Courier Mail' }
                        ].map(({ val, icon, label }) => (
                          <label key={val}
                            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${deliveryMethod === val ? 'border-slate-900 bg-slate-900 shadow-xl shadow-slate-900/15' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'}`}
                          >
                            <input type="radio" value={val} checked={deliveryMethod === val} onChange={e => setDeliveryMethod(e.target.value)} className="hidden" />
                            <span className={`material-symbols-outlined mb-2 text-2xl ${deliveryMethod === val ? 'text-white' : 'text-slate-400'}`}>{icon}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${deliveryMethod === val ? 'text-white' : 'text-slate-600'}`}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-11 text-white font-black rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 text-sm tracking-wide bg-[#b7131a] hover:bg-[#9e0f16] shadow-red-900/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      {isBlood ? 'bloodtype' : isFinance ? 'payments' : 'volunteer_activism'}
                    </span>
                    {isBlood ? 'Confirm Appointment' : isFinance ? 'Authorize Contribution' : 'Launch Donation'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DonateModal;

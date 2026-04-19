import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const BloodCampaignModal = ({ isOpen, onClose, onSuccess, request }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    quantity: '',
    priority: 'URGENT',
    description: '',
    imageUrl: '',
    category: 'BLOOD',
    location: '',
    contact: '',
    hospitalRequestId: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      const remaining = request.units - (request.dispatchedUnits || 0);
      const hospitalName = request.hospitalId?.name || request.hospitalId || "our hospital";
      setFormData({
        title: `Urgent ${request.bloodType} Blood Donation Drive`,
        itemName: request.bloodType,
        quantity: Math.max(0, remaining).toString(),
        priority: request.priority || 'URGENT',
        description: `We are facing a critical shortage of ${request.bloodType} blood. Your donation can save lives at ${hospitalName}.`,
        imageUrl: '',
        category: 'BLOOD',
        location: request.hospitalId?.address || '',
        contact: request.hospitalId?.phone || '',
        hospitalRequestId: request._id,
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '16:00'
      });
      setImagePreview(null);
      setContactError('');
    }
  }, [isOpen, request]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    try {
      if (!imageFile) return formData.imageUrl || '';

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `blood-campaigns/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('item-donations')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-donations')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    if (!phone) return "Contact number is required";
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) return "Please enter a valid Sri Lankan phone number (e.g., 0712345678)";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate contact
    const error = validatePhone(formData.contact);
    if (error) {
      setContactError(error);
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await uploadImage();

      await api.post('/hospital-requests/needs', {
        ...formData,
        imageUrl: imageUrl || formData.imageUrl
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert(error.message || "Failed to create blood campaign. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

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
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden font-['Work_Sans']"
        >
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">Launch Blood Campaign</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mt-1">Mobilize donors for critical unit shortages</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left: Branding & Media */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Campaign Poster</label>
                  <div className="relative group aspect-video rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center hover:border-red-500/30 transition-all cursor-pointer">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold uppercase tracking-widest">Change Poster</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Upload Landscape Visual</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Campaign Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. LifeSource Emergency O+ Drive"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Donation Appeal</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Describe why this blood type is urgently needed..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium text-sm leading-relaxed"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Logistics & Targets */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Blood Group</label>
                    <input
                      readOnly
                      type="text"
                      className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl font-black text-red-600 cursor-not-allowed"
                      value={formData.itemName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Pints</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Collection Location</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Central Wing, Level 2, Room 405"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Direct Contact</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 0712345678"
                      className={`w-full px-6 py-4 bg-slate-50 border ${contactError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold`}
                      value={formData.contact}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, contact: val });
                        if (contactError) setContactError(validatePhone(val));
                      }}
                    />
                    {contactError && <p className="text-[10px] text-red-500 font-bold mt-1 pl-2">{contactError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Drive Date</label>
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Start Time</label>
                      <input
                        required
                        type="time"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">End Time</label>
                      <input
                        required
                        type="time"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-semibold"
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="material-symbols-outlined text-sm font-black">emergency</span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Urgency Notice</h4>
                  </div>
                  <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                    Publishing this campaign will make it live on the public donor portal. Ensure location and contact details are accurate for physical donation arrival.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="flex-1 py-5 bg-slate-100 text-slate-600 font-bold rounded-[20px] hover:bg-slate-200 transition-all"
              >
                Discard
              </button>
              <button
                disabled={loading}
                type="submit"
                className="flex-[2] py-5 bg-red-600 text-white font-bold rounded-[20px] shadow-2xl shadow-red-600/20 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">ios_share</span>
                    Launch Campaign
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

export default BloodCampaignModal;

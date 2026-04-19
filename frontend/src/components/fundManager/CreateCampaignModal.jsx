import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const CreateCampaignModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    quantity: '',
    priority: 'ROUTINE',
    description: '',
    category: 'FINANCE'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        itemName: initialData.itemName || '',
        quantity: initialData.quantity || '',
        priority: initialData.priority || 'ROUTINE',
        description: initialData.description || '',
        category: 'FINANCE'
      });
      setImagePreview(initialData.imageUrl || null);
    } else {
      setFormData({
        title: '',
        itemName: '',
        quantity: '',
        priority: 'ROUTINE',
        description: '',
        category: 'FINANCE'
      });
      setImagePreview(null);
    }
  }, [initialData, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    try {
      if (!imageFile) return imagePreview; // Return existing preview if no new file

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `donation-needs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-donations')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-donations')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return imagePreview;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.quantity) < 0) {
      alert("Campaign target cannot be negative. Minimum is 0.");
      return;
    }
    
    try {
      setLoading(true);
      const imageUrl = await uploadImage();
      
      if (initialData?._id) {
        await api.put(`/hospital-requests/needs/${initialData._id}`, {
          ...formData,
          imageUrl,
          category: 'FINANCE'
        });
      } else {
        await api.post('/hospital-requests/needs', {
          ...formData,
          imageUrl,
          category: 'FINANCE'
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Work_Sans']">
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
          className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {initialData ? "Refine Financial Campaign" : "Initiate Financial Campaign"}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Direct donor outreach</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
            <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Impact Visual</label>
                    <div className="relative group aspect-square rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center hover:border-primary/30 transition-all cursor-pointer">
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change Visual</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <span className="material-symbols-outlined text-4xl text-slate-300 font-light">add_a_photo</span>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Upload Campaign Image</p>
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

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Funding Purpose</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. ICU Expansion Fund"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-900"
                            value={formData.itemName}
                            onChange={e => setFormData({...formData, itemName: e.target.value, title: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Amount ($)</label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="10000.00"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-slate-900 text-lg"
                            value={formData.quantity}
                            onChange={e => setFormData({...formData, quantity: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Campaign Priority</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['ROUTINE', 'URGENT', 'CRITICAL'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({...formData, priority: p})}
                                    className={`py-3 rounded-xl text-[9px] font-black tracking-widest transition-all border ${
                                        formData.priority === p 
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Impact Narrative</label>
                <textarea
                    required
                    rows="4"
                    placeholder="Describe the clinical impact of these funds..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-sm leading-relaxed text-slate-700"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <button
                disabled={loading}
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-[24px] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-xl">{initialData ? 'save_as' : 'monetization_on'}</span>
                        {initialData ? 'Update Campaign Details' : 'Launch Public Campaign'}
                    </>
                )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCampaignModal;

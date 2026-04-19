import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const EditItemModal = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    category: '',
    priority: 'ROUTINE',
    description: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const fileInputRef = useRef(null);

  const priorities = [
    { id: 'ROUTINE', label: 'Routine', color: 'bg-slate-900' },
    { id: 'URGENT', label: 'Urgent', color: 'bg-slate-900' },
    { id: 'CRITICAL', label: 'Critical', color: 'bg-slate-900' }
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setFetchedCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.name || '',
        quantity: item.quantity || '',
        category: item.category || '',
        priority: item.priority?.toUpperCase() || 'ROUTINE',
        description: item.description || '',
        imageUrl: item.imageUrl || ''
      });
      setPreview(item.imageUrl);
    }
  }, [item]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setPreview(URL.createObjectURL(file));

      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('item-donations')
        .upload(`items/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('item-donations')
        .getPublicUrl(`items/${fileName}`);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/item-donations/${item.id}`, formData);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Left Side: Visual Record */}
          <div className="md:w-2/5 p-8 bg-slate-50 border-r border-slate-100 flex flex-col">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">Item Image</h2>

            <div
              onClick={() => fileInputRef.current.click()}
              className="flex-1 w-full rounded-[2.5rem] flex flex-col items-center justify-center p-8 group transition-all duration-500 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#8d0f14] via-[#b7131a] to-[#db322f] group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-[2rem] pointer-events-none group-hover:border-white/40 transition-colors" />

              {preview ? (
                <div className="absolute inset-0 z-0">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#8d0f14]/80 to-transparent" />
                </div>
              ) : null}

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-16 h-16 bg-white/10 backdrop-blur-2xl ring-1 ring-white/30 rounded-3xl shadow-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:-translate-y-1 ${uploading ? 'animate-pulse' : ''}`}>
                  <span className="material-symbols-outlined text-3xl text-white drop-shadow-md">
                    {uploading ? 'cloud_upload' : (formData.imageUrl ? 'check_circle' : 'add_a_photo')}
                  </span>
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-white">
                  {uploading ? 'Archiving...' : (formData.imageUrl ? 'Asset Verified' : 'Update Imagery')}
                </h3>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="mt-8 space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined text-sm">info</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Update item specifications ensure real-time inventory precision.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Specifications */}
          <div className="md:w-3/5 p-12 overflow-y-auto">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-['Work_Sans']">Edit Specifications</h1>
                <p className="text-slate-400 font-medium mt-1">Update item specifications ensure real-time inventory precision.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Item Name</label>
                  <input
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g. Premium Medical Ventilator"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Inventory Quantity</label>
                  <div className="inline-flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, (parseInt(prev.quantity) || 1) - 1) }))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-xl">remove</span>
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-16 bg-transparent border-none text-center text-xl font-bold text-slate-900 focus:ring-0 p-0"
                      value={formData.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^[0-9\b]+$/.test(val)) {
                          setFormData({ ...formData, quantity: val === '' ? '' : parseInt(val) });
                        }
                      }}
                      onBlur={() => {
                        if (formData.quantity === '' || formData.quantity < 1) {
                          setFormData(prev => ({ ...prev, quantity: 1 }));
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: (parseInt(prev.quantity) || 0) + 1 }))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg hover:bg-primary transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-xl">add</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Item Category </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {fetchedCategories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-sm">reorder</span>
                  </div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Status Priority</label>
                </div>

                <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  {priorities.map((p) => {
                    const isSelected = formData.priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`flex items-center justify-center gap-3 py-3 rounded-full transition-all duration-500 relative ${isSelected
                          ? 'bg-white shadow-lg text-slate-900'
                          : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-slate-200'}`} />
                        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-8 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Update Specifications'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditItemModal;

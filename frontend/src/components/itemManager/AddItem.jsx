import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const AddItem = ({ onCancel, onSuccess }) => {
  const fileInputRef = useRef(null);
  const [realCategories, setRealCategories] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '1',
    priority: 'ROUTINE',
    description: '',
    imageUrl: '',
    dynamicAttributes: {}
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setRealCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const priorities = [
    { id: 'ROUTINE', label: 'ROUTINE' },
    { id: 'URGENT', label: 'URGENT' },
    { id: 'CRITICAL', label: 'CRITICAL' }
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('item-donations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-donations')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        donorId: '69adc035afcf9c2f1521b2e2'
      };
      await api.post('/item-donations', payload);
      onSuccess();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to secure item record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-[1200px] mx-auto font-['Work_Sans'] text-slate-900"
    >
      <div className="flex items-end justify-between mb-10 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">
            <span>Inventory</span>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <span className="text-slate-900">New Item Registration</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Item</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-item-form"
            disabled={loading || uploading}
            className="px-8 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register Item'}
          </button>
        </div>
      </div>

      <form id="add-item-form" onSubmit={handleSubmit} className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />

            <div className="relative z-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="Product name or model number..."
                  className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl text-base font-semibold focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Item category</label>
                  <div className="relative">
                    <select
                      className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold appearance-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer uppercase tracking-widest"
                      value={formData.category}
                      onChange={(e) => {
                        const categoryName = e.target.value;
                        const selectedCat = realCategories.find(c => c.name === categoryName);
                        setFormData({
                          ...formData,
                          category: categoryName,
                          dynamicAttributes: (selectedCat?.attributes || []).reduce((acc, attr) => ({ ...acc, [attr]: '' }), {})
                        });
                      }}
                    >
                      <option value="">Choose Category</option>
                      {realCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Quantity</label>
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100/50">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: String(Math.max(1, (parseInt(prev.quantity) || 1) - 1)) }))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">remove</span>
                    </button>
                    <input
                      type="text"
                      className="w-full bg-transparent border-none text-center text-xl font-bold text-slate-900 focus:ring-0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value.replace(/\D/g, '') })}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: String((parseInt(prev.quantity) || 0) + 1) }))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">add</span>
                    </button>
                  </div>
                </div>
              </div>

              {Object.keys(formData.dynamicAttributes || {}).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner"
                >
                  {Object.keys(formData.dynamicAttributes).map((attr) => (
                    <div key={attr} className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">{attr}</label>
                      <input
                        type="text"
                        placeholder={`Value for ${attr}...`}
                        className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                        value={formData.dynamicAttributes[attr]}
                        onChange={(e) => setFormData({
                          ...formData,
                          dynamicAttributes: { ...formData.dynamicAttributes, [attr]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Special Notes</label>
                <textarea
                  placeholder="Additional specifications or handling instructions..."
                  rows="4"
                  className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-slate-300"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                <span className="material-symbols-outlined">priority_high</span>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">Status Priority</label>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Select Criticality Level</span>
              </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              {priorities.map((p) => {
                const isSelected = formData.priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.id })}
                    className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isSelected
                      ? 'bg-white shadow-xl text-slate-900 scale-105'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6 relative">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Item Image</label>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <div
              onClick={() => fileInputRef.current.click()}
              className="aspect-[4/5] w-full rounded-[2.5rem] flex flex-col items-center justify-center p-8 group transition-all duration-700 cursor-pointer overflow-hidden relative shadow-inner bg-slate-50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-4 border border-dashed border-slate-200 group-hover:border-white/20 rounded-[2rem] transition-colors" />

              {preview ? (
                <div className="absolute inset-0 z-0">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="w-20 h-20 bg-white shadow-2xl rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 rotate-3 group-hover:rotate-0">
                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-white/60">Upload Imagery</div>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Archiving...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Registry Guidelines</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Ensure the visual record is clear and captures all relevant asset identifiers.
              </p>
            </div>
          </div>

          {formData.category && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="relative z-10 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Schema Registry</h4>
                <div className="text-2xl font-bold tracking-tight">{formData.category}</div>
                <div className="w-12 h-1 bg-white/20 rounded-full" />
                <p className="text-[10px] opacity-70 font-medium leading-relaxed">
                  Assets categorized under {formData.category} are tracked with specialized attributes.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 p-6 bg-red-50 rounded-[2rem] border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-3 shadow-sm"
          >
            <span className="material-symbols-outlined">error</span>
            {error}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default AddItem;

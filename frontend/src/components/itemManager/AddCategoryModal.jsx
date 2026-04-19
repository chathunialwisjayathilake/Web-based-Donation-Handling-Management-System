import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const AddCategoryModal = ({ isOpen, onClose, onSuccess, category = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    attributes: []
  });
  const [newAttribute, setNewAttribute] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        attributes: category.attributes || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        attributes: []
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    if (newAttribute.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, newAttribute.trim()]
      }));
      setNewAttribute('');
    }
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category?.id) {
        await api.put(`/categories/${category.id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      alert(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

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
          className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-10 pb-6 border-b border-slate-50 relative">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-['Work_Sans']">
                  {category?.id ? 'Update Classification' : 'Define New Category'}
                </h2>
                <p className="text-slate-400 font-medium mt-1">
                  {category?.id ? 'Refining an existing stewardship category.' : 'Establishing a new stewardship classification.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Category Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cotton Pillows, Surgical Masks"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Stewardship Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the utilization and requirements..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all h-32 resize-none"
                />
              </div>
            </div>

            {/* Dynamic Attributes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-sm">tune</span>
                </div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Category Attributes</label>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
                    placeholder="e.g. Material, Sterilization Date"
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-6 bg-slate-900 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.attributes.map((attr, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={idx}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 group border border-slate-200"
                    >
                      {attr}
                      <button
                        type="button"
                        onClick={() => removeAttribute(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close_small</span>
                      </button>
                    </motion.div>
                  ))}
                  {formData.attributes.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-medium italic ml-1">No custom attributes defined yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-8 border-t border-slate-50 flex gap-4 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-8 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-[2] py-4 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : (category?.id ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCategoryModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';

const CurateNeedModal = ({ isOpen, onClose, onSuccess, need, defaultCategory = 'ITEM', isFixedCategory = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    quantity: '',
    priority: 'ROUTINE',
    description: '',
    imageUrl: '',
    category: 'ITEM',
    hospitalId: '',
    location: '',
    contact: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Fetch categories for the category selector
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch actual inventory items for the item name search dropdown
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const res = await api.get('/item-donations', { params: { limit: 1000, activeTab: 'all_items' } });
        const items = res.data?.items || res.data || [];
        setInventoryItems(items);
      } catch (err) {
        console.error('Error fetching inventory items:', err);
      }
    };
    fetchInventoryItems();
  }, []);

  // Fetch hospitals for dropdown
  const [hospitals, setHospitals] = useState([]);
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/hospitals');
        setHospitals(res.data);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
      }
    };
    fetchHospitals();
  }, []);

  // Filter actual inventory items based on typed item name
  const filteredItems = formData.itemName.trim() === ''
    ? []
    : inventoryItems
      .filter(item => item.itemName?.toLowerCase().includes(formData.itemName.toLowerCase()))
      .slice(0, 8)
      .map(item => ({
        name: item.itemName,
        available: item.status === 'APPROVED' || item.quantity > 0
      }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowItemDropdown(false);
    if (showItemDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showItemDropdown]);

  useEffect(() => {
    if (isOpen) {
      if (need) {
        setFormData({
          title: need.title || '',
          itemName: need.itemName || '',
          quantity: need.quantity || '',
          priority: need.priority || 'ROUTINE',
          description: need.description || '',
          imageUrl: need.imageUrl || '',
          category: need.category || 'ITEM',
          hospitalId: need.hospitalId || '',
          location: need.location || '',
          contact: need.contact || '',
          date: need.date || '',
          startTime: need.startTime || '',
          endTime: need.endTime || ''
        });
        setImagePreview(need.imageUrl || null);
      } else {
        setFormData({
          title: '',
          itemName: '',
          quantity: '',
          priority: 'ROUTINE',
          description: '',
          imageUrl: '',
          category: defaultCategory,
          hospitalId: '',
          location: '',
          contact: '',
          date: '',
          startTime: '',
          endTime: ''
        });
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [isOpen, need]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    try {
      if (!imageFile) return formData.imageUrl;

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `donation-needs/${fileName}`;

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
      throw error; // Let the caller handle the failure so it doesn't silently wipe the image
    }
  };

  const saveNeed = async (status) => {
    try {
      // 1. Logistics Integrity Check (Only for Blood Campaigns)
      if (formData.category === 'BLOOD') {
        if (!formData.location || !formData.date || !formData.startTime || !formData.endTime) {
          alert("Lacking Logistics: Location, Schedule, and Time Window are mandatory for Blood Campaigns.");
          return;
        }
      }

      setLoading(true);
      const imageUrl = await uploadImage();

      const targetId = need?.id || need?._id;

      const payload = {
        ...formData,
        imageUrl,
        status: status
      };

      if (targetId) {
        await api.put(`/hospital-requests/needs/${targetId}`, payload);
      } else {
        await api.post(`/hospital-requests/needs`, payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving campaign:", error);
      const isApiError = error.response?.status === 500;
      const errorMessage = error.response?.data?.message || error.message;

      if (isApiError) {
        alert(`Coordination Failure (500): ${errorMessage}\n\nThe medical coordination server encountered an internal exception. Please ensure all mandatory logistics (Location, Date, Time) are correctly formatted.`);
      } else if (error.message?.includes('bucket')) {
        alert(`Storage Blocked: ${errorMessage}\n\nPlease verify your Supabase 'item-donations' bucket is active and set to Public.`);
      } else {
        alert(`Haema-Broadcast Failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveNeed('PENDING'); // Publish
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-['Work_Sans']">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header - Sticky */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                <span className="material-symbols-outlined text-2xl">campaign</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{need ? 'Edit Campaign Broadcast' : 'Create Campaign Broadcast'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{need ? 'Refine and manage donor-facing appeal' : 'Launch a new public donation drive'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
            <form id="campaign-form" onSubmit={handleSubmit} className="px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Media & Branding (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Image Upload Area */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">image</span> Primary Campaign Media
                    </label>
                    <div className="relative group aspect-[21/9] rounded-[24px] bg-white border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center hover:border-slate-900/50 transition-all cursor-pointer shadow-sm">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2 text-white">
                              <span className="material-symbols-outlined text-3xl">flip_camera_ios</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Replace Media</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 transition-transform group-hover:scale-110 duration-500">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-100 transition-colors">
                            <span className="material-symbols-outlined text-3xl text-slate-400">add_a_photo</span>
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Landscape Banner</p>
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

                  {/* Content Fields */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Drive Title</label>
                      <input
                        required
                        type="text"
                        placeholder={formData.category === 'BLOOD' ? "e.g., Urgent O- Blood Drive" : "e.g., Emergency Medical Supplies Campaign"}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300 placeholder:font-medium"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appeal Message</label>
                      <textarea
                        required
                        rows="4"
                        placeholder="Explain why this donation is critical right now..."
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium text-slate-700 leading-relaxed resize-none placeholder:text-slate-300"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Additional Info Box */}
                  <div className="bg-slate-900 text-white p-6 rounded-[24px] flex gap-4 shadow-xl shadow-slate-900/10">
                    <span className="material-symbols-outlined text-blue-400 mt-1">auto_awesome</span>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Strategic Alignment</h4>
                      <p className="text-xs font-semibold text-slate-100 mt-1.5 leading-relaxed opacity-90">
                        Ensure the target deficit precisely matches institutional requirements. Any surplus will be automatically directed to reserve storage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Settings & Logistics (5 cols) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* Core Target Details */}
                  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-5">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                      <span className="material-symbols-outlined text-[16px]">track_changes</span> Target
                    </h3>

                    {/* Hospital Selector - Removed dropdown as per user request */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</label>
                      <div className="w-full px-5 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-sm font-bold text-blue-900 tracking-tight">Healio </span>
                      </div>
                      <p className="text-[9px] font-medium text-slate-400 italic">Transfers are automatically routed to the Healio General Hospital ledger.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Need Category</label>
                        <select
                          className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer ${isFixedCategory ? 'opacity-70 pointer-events-none' : ''}`}
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          disabled={isFixedCategory}
                        >
                          <option value="ITEM">Medical Asset</option>
                          <option value="FINANCE">Financial Fund</option>
                          <option value="BLOOD">Blood Units</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                          value={formData.priority}
                          onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                          <option value="ROUTINE">🟢 Routine</option>
                          <option value="URGENT">🟠 Urgent</option>
                          <option value="CRITICAL">🔴 Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {formData.category === 'BLOOD' ? 'Blood Group' : 'Item Name'}
                      </label>
                      {formData.category === 'BLOOD' ? (
                        <select
                          required
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                          value={formData.itemName}
                          onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                        >
                          <option value="" disabled>Select Blood Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            required
                            type="text"
                            placeholder="Search items..."
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm text-slate-700"
                            value={formData.itemName}
                            onChange={e => {
                              setFormData({ ...formData, itemName: e.target.value });
                              setShowItemDropdown(true);
                            }}
                            onFocus={() => setShowItemDropdown(true)}
                          />
                          {showItemDropdown && formData.itemName.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-50 max-h-48 overflow-y-auto">
                              {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, itemName: item.name });
                                    setShowItemDropdown(false);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 border-b border-slate-50 last:border-0"
                                >
                                  <span className="font-bold text-sm text-slate-800">{item.name}</span>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.available ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {item.available ? 'In Stock' : 'Not Available'}
                                  </span>
                                </button>
                              )) : (
                                <div className="px-4 py-3 text-center">
                                  <span className="text-xs text-slate-400 font-medium">No matching items — type to create new</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Deficit tracker */}
                    <div className="pt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Fulfillment Goal</label>
                      <div className="flex gap-4 items-center">
                        <div className="flex-1 bg-slate-50 rounded-xl p-3 flex justify-between items-center border-l-4 border-slate-900">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
                          <input
                            required
                            type="text"
                            className="w-20 bg-transparent border-none p-0 text-right font-black text-xl text-slate-900 focus:ring-0"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Units</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Progress</span>
                          <span className="text-xs font-black text-slate-900">{need?.donatedQuantity || 0} Met</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min(100, (parseInt(need?.donatedQuantity || 0) / parseInt(formData.quantity || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logistics Details - Only for Blood Campaigns */}
                  {formData.category === 'BLOOD' && (
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                        <span className="material-symbols-outlined text-[16px]">map</span> Logistics Details
                      </h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location / Facility</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Ward 5, Building B"
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm"
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</label>
                        <input
                          required
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm"
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                          <input
                            required
                            type="time"
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm"
                            value={formData.startTime}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</label>
                          <input
                            required
                            type="time"
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-sm"
                            value={formData.endTime}
                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </form>
          </div>

          {/* Footer - Sticky Actions */}
          <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 z-10 w-full">
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">public</span>
                  Publish Drive
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CurateNeedModal;

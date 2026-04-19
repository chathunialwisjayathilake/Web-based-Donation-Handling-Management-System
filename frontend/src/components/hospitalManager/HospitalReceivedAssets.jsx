import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const HospitalReceivedAssets = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const hospitalId = user?.hospitalId || user?.id;

  const [selectedAssetCategory, setSelectedAssetCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aggregatedStock, setAggregatedStock] = useState([]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const displayedItems = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCardClick = (category) => {
    let rawHistory = history.filter(h => h.status === 'SUCCESSFUL');
    if (category === 'FINANCE') {
      rawHistory = rawHistory.filter(h => h.type === 'FINANCE' || h.type === 'FUND');
    } else {
      rawHistory = rawHistory.filter(h => h.type === category);
    }

    const aggMap = {};
    rawHistory.forEach(h => {
      let itemName = 'Unknown';
      let qty = 0;
      if (category === 'FINANCE') {
        const amtMatch = h.details?.match(/LKR ([\d,]+)/);
        qty = parseFloat(h.amount) || (amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0);
        itemName = 'Financial Deposit';
      } else {
        qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) (units|pints)/i)?.[1]) || 0;
        const nameMatch = h.details?.match(/(units|pints) of\s+(.+?)(?:\s+(from|via|to|blood)|\.|$)/i);
        if (nameMatch && nameMatch[2]) {
          itemName = nameMatch[2].trim();
        }
      }

      if (qty > 0) {
        if (!aggMap[itemName]) aggMap[itemName] = 0;
        aggMap[itemName] += qty;
      }
    });

    const aggregatedList = Object.keys(aggMap).map(key => ({
      name: key,
      quantity: aggMap[key]
    })).sort((a, b) => b.quantity - a.quantity);

    setAggregatedStock(aggregatedList);
    setSelectedAssetCategory(category);
    setIsModalOpen(true);
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // 1. Resolve Hospital ID
      const hospitalRes = await api.get(`/hospitals/user/${user.id}`);
      // Mongoose uses _id, but virtuals can map it to id. Let's be safe.
      const hId = hospitalRes.data._id || hospitalRes.data.id || hospitalRes.data.hospitalId;

      if (!hId) {
        console.error("❌ Hospital ID could not be resolved for current user session.");
        setLoading(false);
        return;
      }

      console.log(`🏥 Loading ledger for Hospital ID: ${hId}`);

      // 2. Fetch History using the resolved ID
      const res = await api.get(`/hospital-requests/history/hospital/${hId}`);
      console.log(`📋 Received ${res.data.length} ledger entries.`);

      // Map _id to id if missing (Mongoose vs Frontend expectations)
      const sanitizedData = res.data.map(item => ({
        ...item,
        id: item._id || item.id,
        date: item.date || item.createdAt // Fallback to createdAt if date field is empty
      }));

      setHistory(sanitizedData);
    } catch (err) {
      console.error("Error fetching received assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (historyId, newStatus) => {
    const actionLabel = newStatus === 'SUCCESSFUL' ? "confirm receipt of" : "report a problem with";
    if (!window.confirm(`Are you sure you want to ${actionLabel} this asset?`)) return;

    try {
      await api.patch(`/hospital-requests/history/${historyId}/status`, { status: newStatus });
      fetchHistory();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update fulfillment status.");
    }
  };

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      const successHistory = history.filter(h => h.status === 'SUCCESSFUL');
      
      const itemsMap = {};
      successHistory.filter(h => h.type === 'ITEM').forEach(h => {
        const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) (units|pints)/i)?.[1]) || 0;
        const nameMatch = h.details?.match(/(units|pints) of\s+(.+?)(?:\s+(from|via|to|blood)|\.|$)/i);
        const name = nameMatch && nameMatch[2] ? nameMatch[2].trim() : 'General Item';
        if (qty > 0) itemsMap[name] = (itemsMap[name] || 0) + qty;
      });

      const bloodMap = {};
      successHistory.filter(h => h.type === 'BLOOD').forEach(h => {
        const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) (units|pints)/i)?.[1]) || 0;
        const nameMatch = h.details?.match(/(units|pints) of\s+(.+?)(?:\s+(from|via|to|blood)|\.|$)/i);
        const name = nameMatch && nameMatch[2] ? nameMatch[2].trim() : 'Unspecified Blood';
        if (qty > 0) bloodMap[name] = (bloodMap[name] || 0) + qty;
      });

      const fundMap = {};
      successHistory.filter(h => h.type === 'FINANCE' || h.type === 'FUND').forEach(h => {
        const amtMatch = h.details?.match(/LKR ([\d,]+)/);
        const qty = parseFloat(h.amount) || (amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0);
        if (qty > 0) fundMap["Granted Capital"] = (fundMap["Granted Capital"] || 0) + qty;
      });

      const tableRows = [];
      Object.entries(itemsMap).forEach(([k, v]) => tableRows.push(['Asset/Item', k, `${v} Units`]));
      Object.entries(bloodMap).forEach(([k, v]) => tableRows.push(['Blood Supply', k, `${v} Pints`]));
      Object.entries(fundMap).forEach(([k, v]) => tableRows.push(['Financial', k, `LKR ${v.toLocaleString()}`]));

      if (tableRows.length === 0) {
        tableRows.push(['-', 'No available stock recorded', '-']);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Healio Coordination Portal", 14, 25);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Hospital Available Stock Report", 14, 34);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42);

      autoTable(doc, {
        head: [["Category", "Stock Name", "Total Available Quantity"]],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 10, cellPadding: 6, font: 'helvetica' },
        headStyles: { 
          fillColor: [15, 23, 42], 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, 
        margin: { top: 50 },
        columnStyles: {
          2: { halign: 'right' }
        }
      });

      doc.save("Hospital_Available_Stock.pdf");
    } catch(err) {
      console.error(err);
      alert("Error generating PDF: " + err.message);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [history.length]);

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 font-['Work_Sans'] relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Received Inventory</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Comprehensive ledger of all assets, blood units, and funds received by this facility.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={generatePDF}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl border border-slate-900 shadow-sm flex items-center gap-3 hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            <span className="text-sm font-bold tracking-tight">Export PDF</span>
          </button>
          <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Real Time</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => handleCardClick('ITEM')} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-blue-600">inventory_2</span>
            </div>
            <div className="pointer-events-none">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Items Received</div>
              <div className="text-2xl font-black text-slate-900">
                {history.filter(h => h.type === 'ITEM' && h.status === 'SUCCESSFUL').reduce((acc, h) => {
                  const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) (units|pints)/i)?.[1]) || 0;
                  return acc + qty;
                }, 0)} Units
              </div>
            </div>
          </div>
        </div>
        <div onClick={() => handleCardClick('BLOOD')} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-red-600">bloodtype</span>
            </div>
            <div className="pointer-events-none">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Blood Received</div>
              <div className="text-2xl font-black text-slate-900">
                {history.filter(h => h.type === 'BLOOD' && h.status === 'SUCCESSFUL').reduce((acc, h) => {
                  const qty = parseInt(h.quantity) || parseInt(h.details?.match(/(\d+) (units|pints)/i)?.[1]) || 0;
                  return acc + qty;
                }, 0)} Pints
              </div>
            </div>
          </div>
        </div>
        <div onClick={() => handleCardClick('FINANCE')} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center pointer-events-none">
              <span className="material-symbols-outlined text-green-600">payments</span>
            </div>
            <div className="pointer-events-none">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Funds</div>
              <div className="text-2xl font-black text-slate-900">
                LKR {history.filter(h => (h.type === 'FINANCE' || h.type === 'FUND') && h.status === 'SUCCESSFUL').reduce((acc, h) => {
                  const amt = parseFloat(h.amount) || parseFloat(h.details?.match(/LKR ([\d,]+)/)?.[1]?.replace(/,/g, '')) || 0;
                  return acc + amt;
                }, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Activity Type</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Transaction Details</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Fulfillment Date</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-medium">Synchronizing coordination ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedItems.length > 0 ? displayedItems.map((record, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={record.id}
                  className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === 'ITEM' ? 'bg-blue-50 text-blue-600' :
                        record.type === 'BLOOD' ? 'bg-red-50 text-red-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                        <span className="material-symbols-outlined text-lg">
                          {record.type === 'ITEM' ? 'inventory_2' : record.type === 'BLOOD' ? 'bloodtype' : 'payments'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 tracking-tight">{record.type}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-medium text-slate-600 max-w-sm">
                    {record.details}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900">{new Date(record.date).toLocaleDateString()}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(record.date).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    {record.status === 'PENDING' ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest animate-pulse">In Transit</span>
                    ) : record.status === 'SUCCESSFUL' ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">Received</span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest">Issue Reported</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {record.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusUpdate(record.id, 'SUCCESSFUL')}
                          className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm"
                          title="Confirm Receipt"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(record.id, 'FAILED')}
                          className="w-8 h-8 rounded-lg bg-white border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
                          title="Report Problem"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                        {record.referenceId?.slice(-8).toUpperCase() || 'INTERNAL'}
                      </span>
                    )}
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-200">history</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xl font-bold text-slate-900">Ledger is empty</div>
                        <p className="text-slate-400 max-w-sm mx-auto italic">No received assets have been logged for this facility yet.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedAssetCategory === 'ITEM' ? 'bg-blue-100 text-blue-600' :
                    selectedAssetCategory === 'BLOOD' ? 'bg-red-100 text-red-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {selectedAssetCategory === 'ITEM' ? 'inventory_2' : selectedAssetCategory === 'BLOOD' ? 'bloodtype' : 'payments'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {selectedAssetCategory === 'ITEM' ? 'Items Breakdown' : selectedAssetCategory === 'BLOOD' ? 'Blood Breakdown' : 'Funds Breakdown'}
                    </h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Detailed Stock Ledger
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {aggregatedStock.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aggregatedStock.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors"
                      >
                        <div className="font-bold text-slate-700 truncate pr-4">{item.name}</div>
                        <div className="text-xl font-black text-slate-900 shrink-0">
                          {selectedAssetCategory === 'FINANCE' ? `LKR ${item.quantity.toLocaleString()}` : item.quantity}
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                            {selectedAssetCategory === 'FINANCE' ? '' : selectedAssetCategory === 'BLOOD' ? 'Pints' : 'Units'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl text-slate-300">inventory_2</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No records found</h3>
                    <p className="text-slate-500 italic mt-1">There are no documented stock details for this category.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Close Tracker
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalReceivedAssets;

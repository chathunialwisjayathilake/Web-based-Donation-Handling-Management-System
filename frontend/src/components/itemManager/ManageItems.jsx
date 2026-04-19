import React, { useState, useEffect, useCallback } from 'react';
import FilterBar from './FilterBar';
import InventoryTable from './InventoryTable';
import EditItemModal from './EditItemModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../utils/api';

const ManageItems = ({ activeTab, onAddNew }) => {
  const [itemCount, setItemCount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '', sort: '' });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce filter changes to prevent rapid re-fetches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleUpdateSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePaginationChange = useCallback(({ total, totalPages }) => {
    setItemCount(total);
    setTotalPages(totalPages);
  }, []);

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      // Fetch all items matching current filters
      const response = await api.get(`/item-donations`, {
        params: {
          ...debouncedFilters,
          limit: 10000,
          activeTab
        }
      });

      const exportItems = response.data.items || [];
      
      const doc = new jsPDF();
      
      // Header Section Formatting
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("INVENTORY STEWARDSHIP LEDGER", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(`Exported On: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${exportItems.length}`, 14, 34);

      // Prepare Table Data
      const tableColumn = ["Item Name", "Donor Source", "Category", "Quantity", "Priority", "Status", "Registered Date"];
      const tableRows = exportItems.map(item => [
        item.itemName || "Unnamed Asset",
        item.donor?.name || "Anonymous Donor",
        item.category || "Uncategorized",
        `${item.quantity || 0} units`,
        item.priority || "Medium",
        item.status || "Pending",
        new Date(item.createdAt).toLocaleDateString()
      ]);

      // AutoTable 
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 4,
          textColor: [51, 65, 85], // slate-700
          lineColor: [226, 232, 240], // slate-200
        },
        headStyles: {
          fillColor: [241, 245, 249], // slate-100
          textColor: [15, 23, 42], // slate-900
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${i} of ${pageCount} | Healio Core System`, 14, doc.internal.pageSize.height - 10);
      }

      doc.save("inventory_ledger_export.pdf");

    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export ledger to PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 font-['Work_Sans']">
            {activeTab === 'item_donations' ? 'Item Donations' : 'Item Inventory'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {activeTab === 'item_donations'
              ? 'Review and manage curated donations from medical partners.'
              : 'Manage and steward curated hospital supplies across all departments.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:border-slate-300 hover:text-slate-900 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
            ) : (
                <span className="material-symbols-outlined font-bold text-lg">picture_as_pdf</span>
            )}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={onAddNew}
            className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined font-semibold text-lg">add</span>
            Add New Item
          </button>
        </div>
      </section>

      {/* Filters Section */}
      <FilterBar 
        itemCount={itemCount} 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <InventoryTable
          key={`${activeTab}-${refreshKey}-${currentPage}`}
          activeTab={activeTab}
          filters={debouncedFilters}
          onCountChange={setItemCount}
          onEdit={(item) => setEditingItem(item)}
          page={currentPage}
          onPaginationChange={handlePaginationChange}
        />

        {/* Pagination Footer */}
        {itemCount > 0 && (
          <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${page === currentPage
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-slate-400 hover:bg-slate-100'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{Math.min((currentPage - 1) * 6 + 1, itemCount)} - {Math.min(currentPage * 6, itemCount)}</span> of <span className="text-slate-900">{itemCount}</span> Items
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Modals */}
      <EditItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={handleUpdateSuccess}
      />
    </div>
  );
};

export default ManageItems;

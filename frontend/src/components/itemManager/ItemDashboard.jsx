import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import ItemSidebar from './ItemSidebar';
import ItemHeader from './ItemHeader';
import StatCard from './StatCard';
import { AvailabilityTrends, DistributionDonut } from './Charts';
import UrgentAllocations from './UrgentAllocations';
import ActivityLog from './ActivityLog';
import RecentItemsTable from './RecentItemsTable';
import ManageItems from './ManageItems';
import ManageCategories from './ManageCategories';
import AddItem from './AddItem';
import ItemRequests from './ItemRequests';
import ManageNeeds from './ManageNeeds';

const ItemDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [stats, setStats] = useState({
    totalManagedItems: 0,
    totalQuantity: 0,
    lowStockAlerts: 0,
    distribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/item-donations/stats');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    const isManageItems = activeTab === 'manage_items' || 
                         ['all_items', 'ppe_kits', 'diagnostics', 'supplies', 'item_donations'].includes(activeTab);
    
    if (isManageItems) {
      return <ManageItems activeTab={activeTab} onAddNew={() => setActiveTab('add_item')} />;
    }

    if (activeTab === 'add_item') {
      return (
        <AddItem 
          onCancel={() => setActiveTab('manage_items')} 
          onSuccess={() => setActiveTab('manage_items')} 
        />
      );
    }

    if (activeTab === 'categories') {
      return <ManageCategories onAddNew={() => setActiveTab('add_item')} />;
    }

    if (activeTab === 'requests') {
      return <ItemRequests />;
    }

    if (activeTab === 'needs') {
      return <ManageNeeds />;
    }

    return (
      <div className="p-10 space-y-12 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <section className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 font-['Work_Sans']">Inventory Overview</h1>
            <p className="text-slate-500 mt-3 font-medium text-lg">Monitoring real-time stewardship and distribution metrics across the facility.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow-md transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">download</span>
              Export Report
            </button>
            <button 
              onClick={() => setActiveTab('add_item')}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-[0_15px_30px_rgba(183,19,26,0.3)] hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl font-bold">add</span>
              Curate Asset
            </button>
          </div>
        </section>

        {/* Stat Cards Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            title="Total Cataloged Items"
            value={loading ? "..." : stats.totalManagedItems.toLocaleString()}
            icon="inventory_2"
            trend="+100% (Real Data)"
          />
          <StatCard
            title="Available Net Quantity"
            value={loading ? "..." : stats.totalQuantity.toLocaleString()}
            icon="token"
            subtext="Calculated from stewardship ledger"
          />
          <StatCard
            title="Immediate Stock Alerts"
            value={loading ? "..." : stats.lowStockAlerts.toLocaleString()}
            icon="emergency_home"
            subtext="Requires replenishment"
            isPrimary
          />
        </section>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-12 gap-10">
          {/* Left Column: Charts & Trends */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <AvailabilityTrends />

            <div className="grid grid-cols-2 gap-10">
              <DistributionDonut data={stats.distribution} />
              <UrgentAllocations />
            </div>
          </div>

          {/* Right Column: Recent Activity & Logs */}
          <div className="col-span-12 lg:col-span-4">
            <ActivityLog items={stats.recentItems} />
          </div>
        </div>

        {/* Detailed Table Preview Section */}
        <div className="pt-8">
           <RecentItemsTable items={stats.recentItems} />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased">
      <ItemSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-72 min-h-screen relative">
        <ItemHeader />

        {/* Dashboard Canvas */}
        {renderContent()}
      </main>

      {/* FAB Action Button */}
      <button 
        onClick={() => setActiveTab('add_item')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default ItemDashboard;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import FundSidebar from './FundSidebar';
import ItemHeader from '../itemManager/ItemHeader';
import FundOverview from './FundOverview';
import ManageFunds from './ManageFunds';
import FundRequests from './FundRequests';
import FundCampaigns from './FundCampaigns';
import DonorDonations from './DonorDonations';

const FundManagerDashboardContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FundOverview />;
      case 'manage_funds':
        return <ManageFunds />;
      case 'requests':
        return <FundRequests />;
      case 'donations':
        return <DonorDonations />;
      case 'campaigns':
        return <FundCampaigns />;
      default:
        return <FundOverview />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased">
      <FundSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-72 min-h-screen relative">
        <ItemHeader />

        {/* Dashboard Canvas */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>

      {/* FAB Action Button */}
      <button 
        onClick={() => setActiveTab('manage_funds')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 hover:bg-primary transition-colors"
      >
        <span className="material-symbols-outlined text-3xl">add_card</span>
      </button>
    </div>
  );
};

export default FundManagerDashboardContainer;

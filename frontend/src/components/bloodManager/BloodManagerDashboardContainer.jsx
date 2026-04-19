import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BloodSidebar from './BloodSidebar';
import ItemHeader from '../itemManager/ItemHeader';
import BloodOverview from './BloodOverview';
import BloodStock from './BloodStock';
import BloodRequests from './BloodRequests';
import BloodCampaigns from './BloodCampaigns';
import BloodCollectionCenters from './BloodCollectionCenters';
import DonorHistory from './DonorHistory';

const BloodManagerDashboardContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BloodOverview />;
      case 'blood_stock':
      case 'add_blood':
        return <BloodStock />;
      case 'requests':
        return <BloodRequests />;
      case 'campaigns':
        return <BloodCampaigns />;
      case 'locations':
        return <BloodCollectionCenters />;
      case 'donations':
        return <DonorHistory />;
      default:
        return <BloodOverview />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased">
      <BloodSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-72 min-h-screen relative">
        <ItemHeader />

        {/* Dashboard Canvas */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>

      {/* FAB Action Button */}
      <button 
        onClick={() => setActiveTab('blood_stock')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 hover:bg-red-700 transition-colors"
      >
        <span className="material-symbols-outlined text-3xl">add_box</span>
      </button>
    </div>
  );
};

export default BloodManagerDashboardContainer;

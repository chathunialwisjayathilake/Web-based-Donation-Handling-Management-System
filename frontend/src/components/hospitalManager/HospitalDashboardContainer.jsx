import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HospitalSidebar from './HospitalSidebar';
import ItemHeader from '../itemManager/ItemHeader';
import HospitalDashboard from './HospitalDashboard';
import HospitalItemRequests from './HospitalItemRequests';
import HospitalFundRequests from './HospitalFundRequests';
import HospitalBloodRequests from './HospitalBloodRequests';
import HospitalReceivedAssets from './HospitalReceivedAssets';

const HospitalDashboardContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HospitalDashboard />;
      case 'item_requests':
        return <HospitalItemRequests />;
      case 'fund_requests':
        return <HospitalFundRequests />;
      case 'blood_requests':
        return <HospitalBloodRequests />;
      case 'received_assets':
        return <HospitalReceivedAssets />;
      default:
        return <HospitalDashboard />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased">
      <HospitalSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-72 min-h-screen relative">
        <ItemHeader />

        {/* Dashboard Canvas */}
        {renderContent()}
      </main>

      {/* FAB Action Button - Generic for quick dashboard return or new request */}
      <button 
        onClick={() => setActiveTab('dashboard')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 hover:bg-primary transition-colors"
        title="Return to Hub"
      >
        <span className="material-symbols-outlined text-3xl font-bold italic">hub</span>
      </button>
    </div>
  );
};

export default HospitalDashboardContainer;

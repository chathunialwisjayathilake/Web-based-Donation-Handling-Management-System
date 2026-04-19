import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DonorSidebar from './DonorSidebar';
import DonorList from './DonorList';
import DonorDashboard from './DonorDashboard';

const DonorDashboardContainer = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DonorDashboard />;
            case 'donors':
            case 'leaderboard':
            case 'activity':
                return <DonorList activeTab={activeTab} />;
            default:
                return <DonorDashboard />;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-['Work_Sans']">
            <DonorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 ml-80">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DonorDashboardContainer;

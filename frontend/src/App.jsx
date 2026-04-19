import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import AuthModal from './components/auth/AuthModal';
import ItemDashboard from './components/itemManager/ItemDashboard';
import HospitalDashboardContainer from './components/hospitalManager/HospitalDashboardContainer';
import FundManagerDashboardContainer from './components/fundManager/FundManagerDashboardContainer';
import BloodManagerDashboardContainer from './components/bloodManager/BloodManagerDashboardContainer';
import DonorDashboardContainer from './components/donorManager/DonorDashboardContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DonatePage from './pages/Donate';
import BookBlood from './pages/BookBlood';

// Placeholder components for routing
const AboutUs = () => <div className="container" style={{ padding: '150px 0', minHeight: '50vh' }}><h1>About Us</h1></div>;
const Campaigns = () => <div className="container" style={{ padding: '150px 0', minHeight: '50vh' }}><h1>Campaigns</h1></div>;
const FAQ = () => <div className="container" style={{ padding: '150px 0', minHeight: '50vh' }}><h1>FAQ</h1></div>;
const News = () => <div className="container" style={{ padding: '150px 0', minHeight: '50vh' }}><h1>News and Events</h1></div>;
const Contact = () => <div className="container" style={{ padding: '150px 0', minHeight: '50vh' }}><h1>Contact Us</h1></div>;

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  return (
    <div className="app-container">
      {!isDashboard && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/book-blood" element={<BookBlood />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />

          {/* Dashboard Routes */}
          <Route
            path="/item-manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ITEM_MANAGER']}>
                <ItemDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital-manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HOSPITAL_MANAGER', 'HOSPITAL']}>
                <HospitalDashboardContainer />
              </ProtectedRoute>
            }
          />
          <Route path="/fund-manager" element={<Navigate to="/fund-manager/dashboard" replace />} />
          <Route
            path="/fund-manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FUND_MANAGER']}>
                <FundManagerDashboardContainer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-manager/dashboard"
            element={
              <BloodManagerDashboardContainer />
            }
          />
          <Route
            path="/donor-manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DONOR_MANAGER']}>
                <DonorDashboardContainer />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      <AuthModal />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

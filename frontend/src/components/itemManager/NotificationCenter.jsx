import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
      setUnreadCount(response.data.filter(a => !a.isRead).length);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Poll every 10s for real-time feel
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      fetchAlerts();
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/alerts/read-all');
      fetchAlerts();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'CRITICAL': return 'warning';
      case 'WARNING': return 'info';
      default: return 'notifications';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-500 bg-green-50';
      case 'CRITICAL': return 'text-primary bg-primary/5';
      case 'WARNING': return 'text-orange-500 bg-orange-50';
      default: return 'text-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${isOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-primary hover:bg-primary/5'}`}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_40px_rgba(7,28,54,0.12)] border border-slate-100 z-50 overflow-hidden overflow-y-auto max-h-[500px]"
          >
            <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Alert Ledger</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
                  className={`p-5 flex gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${!alert.isRead ? 'bg-slate-50/30' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getAlertColor(alert.type)}`}>
                    <span className="material-symbols-outlined text-lg">{getAlertIcon(alert.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className={`text-xs font-bold leading-tight ${!alert.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                        {alert.title}
                      </div>
                      {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1"></div>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="text-[9px] text-slate-400 font-bold mt-2 uppercase">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-400 text-xs font-medium italic">
                  Systems clear. No alerts recorded.
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-50 text-center bg-slate-50/50">
                <button className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest">
                  View Management Console
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;

import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DonorNotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const { user } = useAuth();

    const fetchNotifications = async () => {
        try {
            const userId = user?._id || user?.id;
            const response = await api.get(`/notifications${userId ? `?userId=${userId}` : ''}`);
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

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
            const userId = user?._id || user?.id;
            await api.put(`/notifications/${id}/read?userId=${userId}`);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const userId = user?._id || user?.id;
            await api.put(`/notifications/read-all?userId=${userId}`);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'CAMPAIGN': return 'fa-bullhorn';
            case 'URGENT': return 'fa-triangle-exclamation';
            case 'BLOOD_DRIVE': return 'fa-droplet';
            case 'FUND_NEED': return 'fa-hand-holding-dollar';
            default: return 'fa-bell';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'CAMPAIGN': return { bg: '#eef2ff', color: '#4f46e5' };
            case 'URGENT': return { bg: '#fef2f2', color: '#dc2626' };
            case 'BLOOD_DRIVE': return { bg: '#fdf2f8', color: '#db2777' };
            case 'FUND_NEED': return { bg: '#f0fdf4', color: '#16a34a' };
            default: return { bg: '#f8fafc', color: '#64748b' };
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="notification-center-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isOpen ? 'rgba(230, 57, 70, 0.1)' : 'transparent',
                    color: isOpen ? '#e63946' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    fontSize: '18px',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'rgba(230, 57, 70, 0.06)';
                        e.currentTarget.style.color = '#e63946';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                    }
                }}
            >
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: unreadCount > 9 ? '18px' : '16px',
                        height: '16px',
                        borderRadius: '999px',
                        background: '#e63946',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                        animation: 'pulse 2s infinite',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            marginTop: '12px',
                            width: '360px',
                            background: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                            zIndex: 9999,
                            overflow: 'hidden',
                            maxHeight: '480px',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-bell" style={{ color: '#e63946', fontSize: '14px' }}></i>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    Notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span style={{
                                        background: '#e63946',
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        padding: '2px 7px',
                                        borderRadius: '999px',
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#e63946',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(230,57,70,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div style={{ overflowY: 'auto', maxHeight: '380px', flex: 1 }}>
                            {notifications.length > 0 ? notifications.map((n) => {
                                const typeStyle = getTypeColor(n.type);
                                return (
                                    <div
                                        key={n.id || n._id}
                                        onClick={() => !n.isRead && handleMarkAsRead(n.id || n._id)}
                                        style={{
                                            padding: '14px 20px',
                                            display: 'flex',
                                            gap: '12px',
                                            cursor: n.isRead ? 'default' : 'pointer',
                                            borderBottom: '1px solid #f8fafc',
                                            background: n.isRead ? '#fff' : '#fafbff',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? '#fff' : '#fafbff'}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: typeStyle.bg,
                                            color: typeStyle.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            fontSize: '14px',
                                        }}>
                                            <i className={`fa-solid ${getTypeIcon(n.type)}`}></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: n.isRead ? '500' : '700',
                                                    color: n.isRead ? '#64748b' : '#0f172a',
                                                    lineHeight: '1.4',
                                                }}>
                                                    {n.title}
                                                </span>
                                                {!n.isRead && (
                                                    <span style={{
                                                        width: '7px',
                                                        height: '7px',
                                                        borderRadius: '50%',
                                                        background: '#e63946',
                                                        flexShrink: 0,
                                                        marginTop: '4px',
                                                    }}></span>
                                                )}
                                            </div>
                                            <p style={{
                                                fontSize: '11px',
                                                color: '#94a3b8',
                                                marginTop: '4px',
                                                lineHeight: '1.5',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}>
                                                {n.message}
                                            </p>
                                            <span style={{
                                                fontSize: '10px',
                                                color: '#cbd5e1',
                                                fontWeight: '600',
                                                marginTop: '6px',
                                                display: 'block',
                                            }}>
                                                {timeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                }}>
                                    <i className="fa-regular fa-bell-slash" style={{ fontSize: '28px', marginBottom: '12px', display: 'block', color: '#cbd5e1' }}></i>
                                    <p style={{ fontSize: '13px', fontWeight: '500' }}>No notifications yet</p>
                                    <p style={{ fontSize: '11px', marginTop: '4px', color: '#cbd5e1' }}>You'll be notified when campaigns are posted</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DonorNotificationCenter;

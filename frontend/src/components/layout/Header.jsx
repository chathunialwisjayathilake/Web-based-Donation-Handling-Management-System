import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import DonorNotificationCenter from './DonorNotificationCenter';
import './Header.css';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const location = useLocation();
    const { isAuthenticated, openLogin, user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close menu/dropdown when route changes
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [location]);

    return (
        <header className={`healio-header ${isScrolled ? 'scrolled glass-panel' : ''}`}>
            <div className="container header-container">
                <div className="logo-container">
                    <Link to="/" className="brand-logo">
                        <span className="logo-icon"><i className="fa-solid fa-heart-pulse"></i></span>
                        <span className="logo-text">Healio</span>
                    </Link>
                </div>

                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <ul className="nav-list">
                        <li className="nav-item"><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link></li>
                        <li className="nav-item"><Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link></li>
                        <li className="nav-item"><Link to="/donate" className={`nav-link ${location.pathname === '/donate' ? 'active' : ''}`}>Campaigns</Link></li>
                        <li className="nav-item"><Link to="/book-blood" className={`nav-link ${location.pathname === '/book-blood' ? 'active' : ''}`}>Booking</Link></li>
                        <li className="nav-item"><Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link></li>
                    </ul>
                </nav>

                <div className="header-actions">
                    {!isAuthenticated ? (
                        <button onClick={openLogin} className="btn-primary donate-btn">Login</button>
                    ) : (
                        <>
                            <Link to="/donate" className="btn-primary donate-btn">Donate Now</Link>
                            <DonorNotificationCenter />
                            <div className="user-profile-container" ref={profileRef}>
                                <button
                                    className={`profile-toggle glass-panel ${isProfileOpen ? 'active' : ''}`}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <div className="user-avatar-mini">
                                        <i className="fa-solid fa-user"></i>
                                    </div>
                                    <span className="user-name">{user?.username}</span>
                                    <i className={`fa-solid fa-chevron-down toggle-icon ${isProfileOpen ? 'rotate' : ''}`}></i>
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            className="profile-dropdown glass-panel"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="dropdown-header">
                                                <p className="signed-in-as">Signed in as</p>
                                                <p className="user-email">{user?.email}</p>
                                            </div>
                                            <div className="dropdown-divider"></div>
                                            <Link to="/profile" className="dropdown-item">
                                                <i className="fa-solid fa-gear"></i>
                                                <span>Profile Settings</span>
                                            </Link>
                                            <button onClick={logout} className="dropdown-item logout-item">
                                                <i className="fa-solid fa-right-from-bracket"></i>
                                                <span>Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                    <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

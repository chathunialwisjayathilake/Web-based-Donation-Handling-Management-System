import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

const AuthModal = () => {
    const navigate = useNavigate();
    const { isAuthModalOpen, closeAuthModal, authMode, setAuthMode, login, register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setError('');
        setFieldErrors({});
        setFormData({
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        });
    }, [authMode, isAuthModalOpen]);

    if (!isAuthModalOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const filtered = value.replace(/[^0-9+]/g, '');
            setFormData({ ...formData, [name]: filtered });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        if (error) setError('');
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: false });
        }
    };
    /* loging and register validationa*/
    const validateForm = () => {
        const { username, email, phone, password, confirmPassword } = formData;
        const newFieldErrors = {};
        let mainError = '';
        
        if (authMode === 'register') {
            if (username.length < 3) {
                newFieldErrors.username = true;
                mainError = 'Username must be at least 3 characters long';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                newFieldErrors.email = true;
                mainError = 'Please enter a valid email address';
            } else if (!/^(?:0|(?:\+94))[1-9][0-9]{8}$/.test(phone.replace(/\s/g, ''))) {
                newFieldErrors.phone = true;
                mainError = 'Please enter a valid Sri Lankan phone number (e.g., 0771234567)';
            } else if (password.length < 8) {
                newFieldErrors.password = true;
                mainError = 'Password must be at least 8 characters long';
            } else if (password !== confirmPassword) {
                newFieldErrors.confirmPassword = true;
                mainError = 'Passwords do not match';
            }
        } else {
            const identifier = formData.identifier || formData.email;
            if (!identifier) {
                newFieldErrors.identifier = true;
                mainError = 'Email or username is required';
            } else if (!password) {
                newFieldErrors.password = true;
                mainError = 'Password is required';
            }
        }

        if (mainError) {
            setFieldErrors(newFieldErrors);
            setError(mainError);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setFieldErrors({});

        const result = authMode === 'login'
            ? await login({ identifier: formData.identifier || formData.email, password: formData.password })
            : await register(formData);

        if (result.success) {
            const userRole = result.user?.role;
            if (userRole === 'ITEM_MANAGER') {
                navigate('/item-manager/dashboard');
            } else if (userRole === 'BLOOD_MANAGER') {
                navigate('/blood-manager/dashboard');
            } else if (userRole === 'FUND_MANAGER') {
                navigate('/fund-manager/dashboard');
            } else if (userRole === 'HOSPITAL_MANAGER') {
                navigate('/hospital-manager/dashboard');
            } else if (userRole === 'DONOR_MANAGER') {
                navigate('/donor-manager/dashboard');
            } else if (userRole === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isAuthModalOpen && (
                <div className="auth-overlay">
                    <motion.div
                        className="liquid-glass-background"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                    />

                    <motion.div
                        className={`auth-modal-container ${authMode}-layout`}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <button className="modal-close" onClick={closeAuthModal}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <div className="auth-grid">
                            {/* Left Side: Form */}
                            <div className="auth-left">
                                <div className="auth-header-mini">
                                    <Link to="/" className="brand-logo" onClick={closeAuthModal}>
                                        <span className="logo-icon"><i className="fa-solid fa-heart-pulse"></i></span>
                                        <span className="logo-text">Healio</span>
                                    </Link>
                                    <h3>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                                    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error-msg">{error}</motion.p>}
                                </div>

                                <form className="auth-form" onSubmit={handleSubmit}>
                                    {authMode === 'register' ? (
                                        <div className="form-grid">
                                            <div className={`form-group full-width ${fieldErrors.username ? 'field-error' : ''}`}>
                                                <label>Username</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-at"></i>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        placeholder="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={`form-group full-width ${fieldErrors.email ? 'field-error' : ''}`}>
                                                <label>Email</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-envelope"></i>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        placeholder="email@example.com"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={`form-group full-width ${fieldErrors.phone ? 'field-error' : ''}`}>
                                                <label>Phone Number</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-phone"></i>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        placeholder="0771234567"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        maxLength="12"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={`form-group ${fieldErrors.password ? 'field-error' : ''}`}>
                                                <label>Password</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-lock"></i>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={`form-group ${fieldErrors.confirmPassword ? 'field-error' : ''}`}>
                                                <label>Confirm Password</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-shield-halved"></i>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        placeholder="••••••••"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="form-grid login-grid">
                                            <div className={`form-group full-width ${fieldErrors.identifier ? 'field-error' : ''}`}>
                                                <label>Email or Username</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-user-shield"></i>
                                                    <input
                                                        type="text"
                                                        name="identifier"
                                                        placeholder="email@example.com or username"
                                                        value={formData.identifier || formData.email}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className={`form-group full-width ${fieldErrors.password ? 'field-error' : ''}`}>
                                                <label>Password</label>
                                                <div className="input-wrapper">
                                                    <i className="fa-solid fa-lock"></i>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`btn-primary auth-submit-btn ${loading ? 'loading' : ''}`}
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Join Now')}
                                        {!loading && <i className={`fa-solid ${authMode === 'login' ? 'fa-right-to-bracket' : 'fa-user-plus'}`}></i>}
                                    </motion.button>
                                </form>

                                <div className="auth-switch">
                                    {authMode === 'login' ? (
                                        <p>New to Healio? <button onClick={() => setAuthMode('register')}>Create Account</button></p>
                                    ) : (
                                        <p>Already a member? <button onClick={() => setAuthMode('login')}>Sign In</button></p>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Branding/Mission */}
                            <div className="auth-right">
                                <div className="branding-content">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <span className="branding-badge">Trusted by 50,000+ Donors</span>
                                        <h2>Saving Lives, <br />One Drop at a Time.</h2>
                                        <p>Join our global community of life-savers. Your contribution directly supports hospitals and patients in urgent need.</p>

                                        <div className="branding-features">
                                            <div className="feature-item">
                                                <i className="fa-solid fa-shield-heart"></i>
                                                <span>Secure & Transparent</span>
                                            </div>
                                            <div className="feature-item">
                                                <i className="fa-solid fa-bolt"></i>
                                                <span>Instant Donor Matching</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                                <div className="branding-decoration">
                                    <div className="blob blob-1"></div>
                                    <div className="blob blob-2"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;

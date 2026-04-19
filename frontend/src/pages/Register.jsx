import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css'; // Reusing styles

const Register = () => {
    return (
        <div className="login-page"> {/* Reusing background wrapper */}
            <div className="auth-background">
                <div className="animated-blob blob-1"></div>
                <div className="animated-blob blob-2"></div>
                <div className="animated-blob blob-3"></div>
            </div>

            <motion.div
                className="auth-container glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">H</span>
                        Healio
                    </Link>
                    <h1>Create Account</h1>
                    <p>Join our life-saving community today</p>
                </div>

                <form className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-user input-icon"></i>
                            <input type="text" placeholder="John Doe" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-envelope input-icon"></i>
                            <input type="email" placeholder="name@example.com" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock input-icon"></i>
                            <input type="password" placeholder="••••••••" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-shield-halved input-icon"></i>
                            <input type="password" placeholder="••••••••" required />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary auth-submit"
                        type="submit"
                    >
                        Sign Up <i className="fa-solid fa-user-plus"></i>
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

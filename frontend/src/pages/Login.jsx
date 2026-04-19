import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css';

const Login = () => {
    return (
        <div className="login-page">
            <div className="auth-background">
                <div className="animated-blob blob-1"></div>
                <div className="animated-blob blob-2"></div>
                <div className="animated-blob blob-3"></div>
            </div>

            <motion.div
                className="auth-container glass-panel"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">H</span>
                        Healio
                    </Link>
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your account</p>
                </div>

                <form className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-envelope input-icon"></i>
                            <input type="email" placeholder="name@example.com" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row">
                            <label>Password</label>
                            <Link to="/forgot-password" id="forgot-password">Forgot password?</Link>
                        </div>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock input-icon"></i>
                            <input type="password" placeholder="••••••••" required />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary auth-submit"
                        type="submit"
                    >
                        Sign In <i className="fa-solid fa-right-to-bracket"></i>
                    </motion.button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Create an account</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

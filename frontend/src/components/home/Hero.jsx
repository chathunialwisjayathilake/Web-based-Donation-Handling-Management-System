import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Hero.css';

const Hero = () => {
    const { isAuthenticated, openRegister, openLogin } = useAuth();
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <section className="healio-hero">
            <div className="hero-background">
                <img src="/assets/cover_new.png" className="main-cover" alt="Blood Donation Abstract Background" />
                <motion.div
                    className="hover-image-wrapper primary-float"
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                >
                    <img src="/assets/hover_img1.png" className="hover-image" alt="Hover Detail 1" />
                </motion.div>
                <motion.div
                    className="hover-image-wrapper secondary-float"
                    initial={{ opacity: 0, scale: 1.2, filter: "blur(15px)" }}
                    animate={{
                        opacity: 1,
                        scale: [1, 1.05, 1],
                        filter: "blur(0px)",
                        y: [0, -30, 10, 0], // Vertical flow
                        x: [0, 15, -15, 0], // Horizontal drift
                        rotate: [0, 5, -5, 0] // Subtle tilt
                    }}
                    transition={{
                        opacity: { duration: 2, ease: "easeOut", delay: 0.2 },
                        scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                        filter: { duration: 2, ease: "easeOut", delay: 0.2 },
                        y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
                        x: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 15, repeat: Infinity, ease: "easeInOut" }
                    }}
                >
                    <img src="/assets/cells_hover_img.png" className="hover-image" alt="Cells Background" />
                </motion.div>
                <div className="hero-overlay"></div>
            </div>

            <div className="container hero-content-container">
                <motion.div
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.div variants={itemVariants} className="badge-pill">
                        <span className="pulse-dot"></span>
                        Centralized Healthcare Support
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="hero-title">
                        Efficient, Transparent, <br />
                        <span className="text-gradient">Life-Saving Donations.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="hero-description">
                        A structured platform bridging the gap between donors and hospitals.
                        Efficiently manage blood, medical items, and fund contributions to fulfill urgent healthcare needs.
                    </motion.p>

                    <motion.div variants={itemVariants} className="hero-actions">
                        {!isAuthenticated ? (
                            <button
                                onClick={openLogin}
                                className="btn-primary btn-lg"
                            >
                                Login <i className="fa-solid fa-right-to-bracket action-icon"></i>
                            </button>
                        ) : (
                            <Link to="/donate" className="btn-primary btn-lg">
                                Donate Now
                            </Link>
                        )}
                        <Link to="/hospital/requests" className="btn-outline btn-lg glass-btn">
                            View Urgent Requests
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className="hero-stats glass-panel-dark">
                        <div className="stat-item">
                            <span className="stat-value text-gradient">Blood</span>
                            <span className="stat-label">Book Slots</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value text-gradient">Items</span>
                            <span className="stat-label">Fulfill Needs</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value text-gradient">Funds</span>
                            <span className="stat-label">Transparent</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;

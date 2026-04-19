import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AboutSection.css';

const AboutSection = () => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 }
        }
    };

    const visualVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const textVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section className="healio-about section-padding">
            <div className="container">
                <div className="about-grid">
                    {/* Left Column - Images & Floating Elements */}
                    <motion.div
                        className="about-visuals"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={visualVariants}
                    >
                        <div className="main-image-wrapper">
                            <img src="/assets/medical-help.png" alt="Medical Professionals Helping Patient" className="about-main-img" />

                            {/* Decorative Elements */}
                            <div className="decor-circle circle-1"></div>
                            <div className="decor-circle circle-2"></div>

                            {/* Floating Glass Card */}
                            <motion.div
                                className="floating-card glass-panel"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <div className="floating-icon">
                                    <i className="fa-solid fa-hand-holding-heart"></i>
                                </div>
                                <div className="floating-text">
                                    <span className="floating-title">10k+</span>
                                    <span className="floating-subtitle">Lives Touched</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Column - Text Content */}
                    <motion.div
                        className="about-content"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <motion.div variants={textVariants} className="section-head">
                            <span className="section-subtitle"> The Problem & Solution</span>
                            <h2 className="section-title">
                                Modernizing <br /> Healthcare <span className="text-gradient">Donations.</span>
                            </h2>
                        </motion.div>

                        <motion.p variants={textVariants} className="about-text-lead">
                            Healthcare institutions often depend on donations such as blood, medical items and fund contributions. However, managing these manually causes data inconsistency and tracking difficulties.
                        </motion.p>

                        <motion.p variants={textVariants} className="about-text-body">
                            The proposed Donation Handling System solves the problem of inefficient and unorganized donation management. We automate donor registration, donation tracking, hospital blood requirement handling, and fund management. By using this system, administrators and hospitals can maintain accurate records and communicate daily requirements effectively.
                        </motion.p>

                        <motion.div variants={textVariants} className="about-features">
                            <div className="feature-item">
                                <i className="fa-solid fa-droplet feature-icon"></i>
                                <span>Blood Donor Booking & Requests</span>
                            </div>
                            <div className="feature-item">
                                <i className="fa-solid fa-box-open feature-icon"></i>
                                <span>Medical Item Tracking</span>
                            </div>
                            <div className="feature-item">
                                <i className="fa-solid fa-file-invoice-dollar feature-icon"></i>
                                <span>Secure Fund Management</span>
                            </div>
                        </motion.div>

                        <motion.div variants={textVariants}>
                            <Link to="/about" className="btn-outline">
                                Learn More About Us
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './DonationMethods.css';

const DonationMethods = () => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.2 }
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
        <section className="healio-methods section-padding">
            <div className="container">
                <div className="methods-wrapper">

                    <motion.div
                        className="methods-visuals"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={visualVariants}
                    >
                        <div className="img-glass-wrapper">
                            <img src="/assets/why-donate-us.jpg" alt="Ways to Give" className="methods-img" />
                            <motion.div
                                className="glass-overlay-box glass-panel-dark"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <span className="text-gradient highlight-number">100%</span>
                                <span className="highlight-text">of your donation goes to patient care.</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="methods-content"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <motion.span variants={textVariants} className="section-subtitle">Ways to Give</motion.span>
                        <motion.h2 variants={textVariants} className="section-title">
                            How You Can <span className="text-gradient">Help</span> <br /> Today
                        </motion.h2>

                        <motion.p variants={textVariants} className="methods-description">
                            Your generosity fuels our mission. We provide multiple secure and
                            convenient ways for you to contribute based on hospital requirements.
                        </motion.p>

                        <motion.div variants={textVariants} className="method-items">
                            <div className="method-item">
                                <div className="method-icon"><i className="fa-solid fa-droplet"></i></div>
                                <div className="method-text">
                                    <h4>Book a Blood Donation</h4>
                                    <p>Schedule a date and time slot for normal or emergency blood donation.</p>
                                </div>
                            </div>

                            <div className="method-item">
                                <div className="method-icon"><i className="fa-solid fa-box-open"></i></div>
                                <div className="method-text">
                                    <h4>Donate Medical Items</h4>
                                    <p>Fulfill specific hospital item requests from our priority lists.</p>
                                </div>
                            </div>

                            <div className="method-item">
                                <div className="method-icon"><i className="fa-solid fa-file-invoice-dollar"></i></div>
                                <div className="method-text">
                                    <h4>Fund Contributions</h4>
                                    <p>Transfer funds securely and upload payment slips for verification.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={textVariants}>
                            <Link to="/donate" className="btn-primary mt-4">
                                Start Donating
                            </Link>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default DonationMethods;

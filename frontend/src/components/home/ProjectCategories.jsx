import React from 'react';
import { motion } from 'framer-motion';
import './ProjectCategories.css';

const ProjectCategories = () => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const headerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 30 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <section className="healio-categories section-padding">
            <div className="container">
                <motion.div
                    className="section-head text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={headerVariants}
                >
                    <span className="section-subtitle">System Features</span>
                    <h2 className="section-title">
                        Core <span className="text-gradient">Capabilities</span>
                    </h2>
                    <p className="section-description">
                        Our platform is built to handle all major healthcare donation requirements efficiently.
                    </p>
                </motion.div>

                <motion.div
                    className="categories-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div variants={cardVariants} className="category-card hover-lift">
                        <div className="category-icon-wrapper medical-icon">
                            <i className="fa-solid fa-box-open"></i>
                        </div>
                        <h3 className="category-title">Item Donations</h3>
                        <p className="category-text">Manage hospital-required items with urgency priority levels.</p>
                    </motion.div>

                    <motion.div variants={cardVariants} className="category-card hover-lift">
                        <div className="category-icon-wrapper medicine-icon">
                            <i className="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                        <h3 className="category-title">Fund & Donor</h3>
                        <p className="category-text">Securely upload payment slips and maintain a complete donation history.</p>
                    </motion.div>

                    <motion.div variants={cardVariants} className="category-card hover-lift">
                        <div className="category-icon-wrapper infra-icon">
                            <i className="fa-solid fa-droplet"></i>
                        </div>
                        <h3 className="category-title">Blood Donor Reg.</h3>
                        <p className="category-text">Book date and time slots for normal and emergency blood donations.</p>
                    </motion.div>

                    <motion.div variants={cardVariants} className="category-card hover-lift">
                        <div className="category-icon-wrapper welfare-icon">
                            <i className="fa-solid fa-hospital-user"></i>
                        </div>
                        <h3 className="category-title">Hospital Requests</h3>
                        <p className="category-text">Allow hospitals to submit and track requests for items and blood.</p>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProjectCategories;

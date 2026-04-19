import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="healio-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="brand-logo footer-logo">
                            <span className="logo-icon"><i className="fa-solid fa-heart-pulse"></i></span>
                            <span className="logo-text">Healio</span>
                        </Link>
                        <p className="footer-brand-text">
                            Your donation can save lives. Join us in our mission to bring hope
                            and healing to those fighting cancer at Apeksha Hospital.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-title">Quick Links</h4>
                        <ul className="footer-nav-list">
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/campaigns">Our Campaigns</Link></li>
                            <li><Link to="/donate">Donate</Link></li>
                            <li><Link to="/faq">FAQ</Link></li>
                            <li><Link to="/news">News & Events</Link></li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4 className="footer-title">Contact Us</h4>
                        <ul className="footer-contact-list">
                            <li><i className="fa-solid fa-location-dot"></i> Apeksha Hospital, Maharagama</li>
                            <li><i className="fa-solid fa-envelope"></i> contact@healio.org</li>
                            <li><i className="fa-solid fa-phone"></i> +94 11 285 0253</li>
                        </ul>
                    </div>

                    <div className="footer-social">
                        <h4 className="footer-title">Connect With Us</h4>
                        <p className="footer-social-text">Stay updated on our latest projects and impact.</p>
                        <div className="social-icons">
                            <a href="#" className="social-icon"><i className="fa-brands fa-facebook-f"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-twitter"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-instagram"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-linkedin-in"></i></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Healio. Empowering Hope. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

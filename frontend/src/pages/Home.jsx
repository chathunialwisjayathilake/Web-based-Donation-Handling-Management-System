import React from 'react';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/AboutSection';
import FeaturedProjects from '../components/home/FeaturedProjects';
import ProjectCategories from '../components/home/ProjectCategories';
import DonationMethods from '../components/home/DonationMethods';

const Home = () => {
    return (
        <div className="home-wrapper">
            <Hero />
            <AboutSection />
            <FeaturedProjects />
            <ProjectCategories />
            <DonationMethods />
        </div>
    );
};

export default Home;

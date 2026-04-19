import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './FeaturedProjects.css';

const FeaturedProjects = () => {
    const [liveNeeds, setLiveNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 6;
    const navigate = useNavigate();

    const fetchNeeds = async () => {
        try {
            const res = await api.get('/hospital-requests/needs');
            const mapped = res.data.map(need => ({
                id: need.id || need._id,
                title: need.title || need.itemName,
                category: need.category === 'BLOOD' ? "Blood Drive" : need.category === 'FINANCE' ? "Financial Aid" : "Medical Supplies",
                raised: (parseInt(need.donatedQuantity) || 0) + (parseInt(need.transferredQuantity) || 0) + (parseInt(need.pendingTransferQuantity) || 0),
                goal: parseInt(need.quantity) || 0,
                unit: need.category === 'BLOOD' ? "Pints" : need.category === 'FINANCE' ? "LKR" : "Units",
                image: need.imageUrl || "/assets/medical-equipment.jpg",
                description: need.description || "",
                rawCategory: need.category || 'ITEM'
            }));
            setLiveNeeds(mapped);
        } catch (err) {
            console.error("Error fetching live needs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNeeds();
    }, []);

    const staticProjects = [
        {
            id: 1,
            title: "O- Negative Blood Shortage",
            category: "Blood Request",
            raised: 15,
            goal: 50,
            unit: "Pints",
            image: "/assets/medical-equipment.jpg",
            description: "Urgent requirement for O- Negative blood types for upcoming emergency surgeries at Apeksha Hospital."
        },
    ];

    const projects = liveNeeds.length > 0 ? liveNeeds : staticProjects;
    const totalPages = Math.ceil(projects.length / itemsPerPage);
    const currentProjects = projects.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    // Remove Animation Variants to ensure immediate visibility
    return (
        <section className="healio-projects section-padding">
            <div className="container">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-12 h-[2px] bg-primary rounded-full"></span>
                            <span className="text-xs font-bold text-primary uppercase tracking-[0.3em]">Coordination Ledger</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                            Urgent Hospital <span className="text-primary italic">Requests</span>
                        </h2>
                        <p className="text-slate-500 mt-6 text-lg font-medium leading-relaxed max-w-xl italic">
                            Help us bridge the gap. These are real-time resource deficits reported by our medical partners that require immediate donor intervention.
                        </p>
                    </div>
                </div>

                <div className="projects-grid">
                    {currentProjects.map((project, index) => {
                        const percent = Math.min(100, Math.round((project.raised / project.goal) * 100));
                        return (
                            <div className="project-card hover-lift" key={project.id}>
                                <div className="card-img-wrapper">
                                    <img src={project.image} alt={project.title} className="card-img" />
                                    <div className="card-category-badge">{project.category}</div>
                                </div>

                                <div className="card-body">
                                    <h3 className="card-title">{project.title}</h3>
                                    <p className="card-text">{project.description}</p>

                                    <div className="funding-stats">
                                        <div className="funding-header">
                                            <span className="funding-percent">{percent}% Completed</span>
                                            <span className="funding-goal">
                                                Goal: {project.goal} {project.unit}
                                            </span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${percent}%` }}>
                                                <div className="progress-glow"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        <button 
                                            onClick={() => {
                                                navigate('/donate', { state: { category: project.rawCategory || 'ITEM' } });
                                            }}
                                            className="btn-outline donate-sm-btn w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group hover:bg-slate-900 hover:text-white transition-all duration-300"
                                        >
                                            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">volunteer_activism</span>
                                            Fulfill Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="projects-action flex flex-col items-center justify-center gap-6 mt-12">
                    {totalPages > 1 && (
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="px-6 py-3 rounded-full border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-6 py-3 rounded-full border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                    
                    <Link to="/donate" className="btn-primary">
                        View All Requests
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProjects;

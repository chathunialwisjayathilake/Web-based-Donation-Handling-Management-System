import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Show nothing or a spinner while checking auth
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to home if not logged in
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to home if role is not allowed
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

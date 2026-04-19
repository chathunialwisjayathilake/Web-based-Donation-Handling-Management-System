import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const savedUser = sessionStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await api.post(`/auth/login`, credentials);
            const { token, user: userData } = response.data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);
            setIsAuthModalOpen(false);
            return { success: true, user: userData };
        } catch (error) {
            console.error('Login Error:', error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post(`/auth/register`, userData);
            const { token, user: createdUser } = response.data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(createdUser));

            setUser(createdUser);
            setIsAuthenticated(true);
            setIsAuthModalOpen(false);
            return { success: true, user: createdUser };
        } catch (error) {
            console.error('Register Error:', error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const openLogin = () => {
        setAuthMode('login');
        setIsAuthModalOpen(true);
    };

    const openRegister = () => {
        setAuthMode('register');
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            isAuthModalOpen,
            authMode,
            setAuthMode,
            login,
            register,
            logout,
            openLogin,
            openRegister,
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

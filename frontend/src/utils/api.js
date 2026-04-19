import axios from 'axios';

// SIDE EFFECT: Configure the GLOBAL axios instance
// This ensures that even components importing 'axios' directly 
// will send the session-specific token in their headers.
axios.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Create and export a configured instance for use in AuthContext and elsewhere
const api = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Also add the interceptor to the custom instance (it's a separate object)
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

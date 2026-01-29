import axios from 'axios';

// Create an axios instance
const api = axios.create({
    baseURL:'https://scaling-broccoli-q764qjq4x59w25jx-8000.app.github.dev', // Points to your FastAPI backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Attach the token to every request if we have one
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
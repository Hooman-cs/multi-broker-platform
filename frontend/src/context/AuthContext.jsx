import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If we have a token but no user data, we could fetch it here (future improvement)
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Call the Backend Login Endpoint
            const response = await api.post('/auth/login', { email, password });
            
            const { access_token, user } = response.data;

            // Save to Storage and State
            localStorage.setItem('access_token', access_token);
            setToken(access_token);
            setUser(user);
            
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { 
                success: false, 
                message: error.response?.data?.detail || "Login failed" 
            };
        }
    };

    const logout = async () => {
        try {
             // 1. Call backend to close session (Wait for it to finish!)
             // The token is still in localStorage here, so the interceptor can find it.
             await api.post('/auth/logout'); 
        } catch (e) { 
            console.error("Logout failed (likely already expired):", e); 
        } finally {
            // 2. Clear local storage ONLY after the attempt
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
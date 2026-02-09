import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        console.log(`[DEBUG] AuthContext Init - StoredUser: ${storedUser ? "Exists" : "None"}, Token: ${token ? "Exists" : "None"}`);
        if (storedUser && token) {
            const parsedUser = JSON.parse(storedUser);
            console.log(`[DEBUG] Logged in as: ${parsedUser.email} (${parsedUser._id})`);
            setUser(parsedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/users/login', { email, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return response.data;
    };

    const register = async (name, email, password) => {
        const response = await api.post('/users/register', { name, email, password });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

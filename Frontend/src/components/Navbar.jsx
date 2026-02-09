import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, LogOut, User, PlusCircle } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/" className="nav-logo">
                    <Layout size={24} />
                    <span>TaskFlow</span>
                </Link>

                <div className="nav-links">
                    {user ? (
                        <>
                            <div className="nav-user">
                                <User size={18} />
                                <span>{user.name}</span>
                            </div>
                            <button onClick={handleLogout} className="logout-btn">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link nav-btn">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="top-nav">
      <Link to="/"><h1>🔎 Smart Lost &amp; Found</h1></Link>
      <div className="nav-links">
        <Link to="/">Browse</Link>
        {isLoggedIn && <Link to="/report">Report Item</Link>}
        {isLoggedIn && <Link to="/my-items">My Items</Link>}
        {isLoggedIn ? (
          <>
            <span style={{ fontSize: 13, color: '#667' }}>Hi, {user.name}</span>
            <button className="secondary" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

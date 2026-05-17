import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav
      style={{
        height: 60,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        to={user ? '/dashboard' : '/'}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          color: 'var(--text-primary)',
          flexShrink: 0,
        }}
      >
        StudentSolve
      </Link>

      <div style={{ flex: 1 }} />

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {user.displayName || user.email}
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 16px', fontSize: '0.82rem' }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '0.85rem' }}>
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard',          icon: '⊞', label: 'Dashboard' },
  { to: '/tutor',              icon: '✦', label: 'AI Tutor' },
  { to: '/essay-marker',       icon: '✎', label: 'Essay Marker' },
  { to: '/notes',              icon: '▶', label: 'YouTube Notes' },
  { to: '/flashcards',         icon: '⊟', label: 'Flashcards' },
  { to: '/quickfire',          icon: '↯', label: 'Exam Quickfire' },
  { to: '/revision-timetable', icon: '▦', label: 'Revision Timetable' },
  { to: '/saved',              icon: '◈', label: 'Saved Work' },
  { to: '/settings',           icon: '⊙', label: 'Settings' },
  { to: '/roadmap',            icon: '→', label: 'Road Map' },
];

const navLinkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 14px',
  borderRadius: 'var(--radius)',
  fontSize: '0.95rem',
  fontWeight: isActive ? 600 : 400,
  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
  background: isActive ? 'var(--accent-dim)' : 'transparent',
  textDecoration: 'none',
});

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="desktop-sidebar" style={{
        width: 224,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px 20px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', padding: '0 8px 24px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 16, flexShrink: 0 }}>
          StudentSolve
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius)',
                fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                transition: 'all var(--transition)', textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: '1rem', opacity: 0.75, flexShrink: 0 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-ghost"
          style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.85rem', gap: 10, color: 'var(--text-muted)', flexShrink: 0 }}
          onClick={handleSignOut}
        >
          <span>↩</span> Sign out
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 56, zIndex: 200,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          StudentSolve
        </span>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.4rem', padding: '6px 8px', lineHeight: 1 }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <div className="mobile-menu" style={{
        display: menuOpen ? 'flex' : 'none',
        position: 'fixed', top: 56, left: 0, right: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        flexDirection: 'column',
        padding: '8px 12px 16px',
        zIndex: 199,
        gap: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => setMenuOpen(false)}
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 'var(--radius)', fontSize: '0.95rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 4 }}
          onClick={handleSignOut}
        >
          <span>↩</span> Sign out
        </button>
      </div>

      {/* ── Backdrop ── */}
      {menuOpen && (
        <div className="mobile-backdrop"
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, top: 56, zIndex: 198, background: 'rgba(0,0,0,0.5)' }}
        />
      )}
    </>
  );
}
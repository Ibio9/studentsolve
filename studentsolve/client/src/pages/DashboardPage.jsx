import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getRecentSaved } from '../firebase/firestore.js';

const FEATURES = [
  { icon: '✦', title: 'AI Tutor', desc: 'Ask questions across any subject', to: '/tutor', accent: '#c8a96e' },
  { icon: '✎', title: 'Essay Marker', desc: 'AO-level feedback on your essays', to: '/essay-marker', accent: '#6c9fe0' },
  { icon: '▶', title: 'YouTube Notes', desc: 'Turn videos into revision notes', to: '/notes', accent: '#5cb87a' },
  { icon: '⊟', title: 'Flashcards', desc: 'Generate flashcards from any content', to: '/flashcards', accent: '#b87ce0' },
];

const FOLDER_COLORS = [
  '#c8a96e', '#6c9fe0', '#5cb87a', '#b87ce0',
  '#e06c6c', '#6ce0d4', '#e0a96c', '#9fe06c',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [folders, setFolders] = useState({});

  useEffect(() => {
    if (!user) return;

    // Load folders from localStorage
    const saved = localStorage.getItem(`folders_${user.uid}`);
    if (saved) {
      try { setFolders(JSON.parse(saved)); } catch {}
    }

    getRecentSaved(user.uid)
      .then(setRecent)
      .catch(console.error)
      .finally(() => setLoadingRecent(false));
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0];

  const folderNames = Object.keys(folders);

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          {/* Greeting */}
          <div style={{ marginBottom: 36 }}>
            <h1 className="page-title">
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="page-subtitle">What would you like to work on today?</p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
            {FEATURES.map(f => <FeatureCard key={f.to} {...f} />)}
          </div>

          {/* Subject folders */}
          {folderNames.length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                Your subject folders
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {folderNames.map((folder, i) => {
                  const color = FOLDER_COLORS[i % FOLDER_COLORS.length];
                  const count = folders[folder]?.length || 0;
                  return (
                    <button
                      key={folder}
                      onClick={() => navigate(`/saved?folder=${encodeURIComponent(folder)}`)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        padding: '16px 16px',
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid var(--border-subtle)`,
                        background: 'var(--bg-card)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: 36, height: 36,
                        borderRadius: 'var(--radius)',
                        background: `${color}18`,
                        border: `1px solid ${color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem',
                      }}>
                        ▣
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {folder}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                          {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Add folder shortcut */}
                <button
                  onClick={() => navigate('/saved')}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 10,
                    padding: '16px 16px', borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border)', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: 96,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>New folder</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent work */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              Recent work
            </div>

            {loadingRecent ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading…</p>
            ) : recent.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '2rem', opacity: 0.25, marginBottom: 12 }}>◈</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No saved work yet — use a feature above to get started.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {recent.map(item => (
                  <div key={item.id} className="card" style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => navigate('/saved')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="badge badge-gold">{item.type}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-GB') : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.title || item.subject || item.url || 'Saved item'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
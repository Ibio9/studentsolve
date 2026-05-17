import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeatureCard({ icon, title, description, to, accent }) {
  const navigate = useNavigate();
  const color = accent || 'var(--accent)';

  return (
    <div
      className="card"
      onClick={() => navigate(to)}
      style={{
        cursor: 'pointer',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          background: `${color}18`,
          border: `1px solid ${color}44`,
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
        }}
      >
        {icon}
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{description}</p>
      </div>
      <div style={{ color, fontSize: '0.82rem', fontWeight: 500, marginTop: 'auto' }}>
        Open →
      </div>
    </div>
  );
}

import React from 'react';

export default function ResultPanel({ children, title }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease forwards',
      }}
    >
      {title && (
        <div
          style={{
            padding: '13px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
}

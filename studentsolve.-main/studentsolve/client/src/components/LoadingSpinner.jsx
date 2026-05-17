import React from 'react';

export default function LoadingSpinner({ size = 22, message = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
      <div
        style={{
          width: size,
          height: size,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
      {message && <span>{message}</span>}
    </div>
  );
}

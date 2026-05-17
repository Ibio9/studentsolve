import React, { useState } from 'react';

export default function FlashcardCard({ question, answer, index }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      style={{
        cursor: 'pointer',
        minHeight: 164,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${flipped ? 'rgba(200,169,110,0.4)' : 'var(--border)'}`,
        background: flipped ? 'var(--accent-dim)' : 'var(--bg-card)',
        padding: '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.2s ease',
        userSelect: 'none',
        animation: 'fadeIn 0.25s ease forwards',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: flipped ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        {flipped ? 'Answer' : `Card ${index + 1}`}
      </div>

      <div
        style={{
          flex: 1,
          fontSize: '0.9rem',
          lineHeight: 1.65,
          color: 'var(--text-primary)',
        }}
      >
        {flipped ? answer : question}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        {flipped ? 'Click to see question' : 'Click to reveal answer'}
      </div>
    </div>
  );
}

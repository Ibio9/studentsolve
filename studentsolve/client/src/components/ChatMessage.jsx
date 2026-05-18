import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 18,
        animation: 'fadeIn 0.22s ease forwards',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(200,169,110,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            color: 'var(--accent)',
            flexShrink: 0,
            marginRight: 12,
            alignSelf: 'flex-start',
            marginTop: 2,
          }}
        >
          ✦
        </div>
      )}

      <div
        style={{
          maxWidth: '72%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'var(--accent)' : 'var(--bg-elevated)',
          color: isUser ? '#0d0d0f' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--border-subtle)',
          fontSize: '0.9rem',
          lineHeight: 1.65,
        }}
      >
        {isUser ? (
          <span>{content}</span>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';

export default function FileUpload({ onFile, accept = '.pdf', label = 'Upload PDF' }) {
  const inputRef = useRef();
  const [fileName, setFileName] = useState('');

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      style={{
        border: '1.5px dashed var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        background: 'var(--bg-elevated)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'var(--accent-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: '1.8rem', marginBottom: 10, opacity: 0.4 }}>⬆</div>
      <div style={{ fontSize: '0.9rem', color: fileName ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 4 }}>
        {fileName || label}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Click to browse · PDF only · Max 5MB
      </div>
    </div>
  );
}

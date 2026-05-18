import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatMessage from '../components/ChatMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { saveTutorSession } from '../firebase/firestore.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      // ← Changed: direct fetch instead of sendTutorMessage so we can pass userId + isPro
      const res = await fetch(`${API}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages,
          userId: user?.uid || null,  // injects Quickfire progress into system prompt
          isPro: false,               // set true when Pro is live
        }),
      });
      if (!res.ok) throw new Error('Failed to get a response. Please try again.');
      const { reply } = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSave() {
    if (!user || messages.length === 0) return;
    const title = messages[0]?.content?.substring(0, 60) || 'Tutor Session';
    await saveTutorSession(user.uid, messages, title);
    setSaved(true);
  }

  function handleClear() {
    setMessages([]);
    setError('');
    setSaved(false);
    inputRef.current?.focus();
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '18px 32px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
              AI Tutor
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ask anything across any subject
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            {messages.length > 0 && (
              <>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                  onClick={handleClear}
                >
                  Clear
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                  onClick={handleSave}
                  disabled={saved}
                >
                  {saved ? 'Saved ✓' : 'Save chat'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✦</div>
              <h3>Your AI Tutor is ready</h3>
              <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
                Ask about maths, sciences, economics, history, English, and more.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
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
                }}
              >
                ✦
              </div>
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '13px 16px',
                }}
              >
                <LoadingSpinner size={16} message="Thinking…" />
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '16px 32px 22px',
            flexShrink: 0,
          }}
        >
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              style={{ flex: 1, borderRadius: 'var(--radius-lg)', padding: '12px 18px' }}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{ padding: '12px 26px', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
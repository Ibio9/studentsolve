import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../components/Sidebar.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { generateYoutubeNotes } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { saveNotes } from '../firebase/firestore.js';

export default function NotesPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setNotes(null);
    setSaved(false);

    try {
      const result = await generateYoutubeNotes(url);
      setNotes(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !notes) return;
    await saveNotes(user.uid, url, notes);
    setSaved(true);
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          <h1 className="page-title">YouTube Notes</h1>
          <p className="page-subtitle">
            Generate structured revision notes from any YouTube video
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">YouTube URL</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !url.trim()}
                  style={{ flexShrink: 0, padding: '10px 24px' }}
                >
                  {loading ? 'Generating…' : 'Generate notes'}
                </button>
              </div>
              <span className="form-hint">
                Works with lectures, documentaries, tutorials, and more. Video must have captions enabled.
              </span>
            </div>

            {loading && (
              <div style={{ marginTop: 4 }}>
                <LoadingSpinner message="Fetching transcript and generating notes…" />
              </div>
            )}
          </form>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          {notes && (
            <div
              style={{
                marginTop: 36,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <ResultPanel title="Topic">
                <h2 style={{ fontSize: '1.35rem', lineHeight: 1.3 }}>{notes.title}</h2>
              </ResultPanel>

              <ResultPanel title="Summary">
                <p style={{ fontSize: '0.93rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
                  {notes.summary}
                </p>
              </ResultPanel>

              <ResultPanel title="Key Points">
                <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, padding: 0 }}>
                  {notes.keyPoints?.map((point, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', gap: 14, fontSize: '0.9rem', lineHeight: 1.6 }}
                    >
                      <span
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 700,
                          flexShrink: 0,
                          minWidth: 20,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{point}</span>
                    </li>
                  ))}
                </ol>
              </ResultPanel>

              <ResultPanel title="Detailed Notes">
                <div
                  className="markdown-body"
                  style={{ fontSize: '0.9rem', lineHeight: 1.75 }}
                >
                  <ReactMarkdown>{notes.detailedNotes}</ReactMarkdown>
                </div>
              </ResultPanel>

              <div>
                <button
                  className="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saved}
                  style={{ fontSize: '0.85rem' }}
                >
                  {saved ? 'Saved ✓' : 'Save these notes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

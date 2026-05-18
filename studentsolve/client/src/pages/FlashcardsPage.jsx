import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import FlashcardCard from '../components/FlashcardCard.jsx';
import FileUpload from '../components/FileUpload.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { generateFlashcards } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { saveFlashcards } from '../firebase/firestore.js';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [mode, setMode] = useState('text');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'pdf' && !pdfFile) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    try {
      const data = await generateFlashcards(
        mode === 'text' ? text : '',
        mode === 'pdf' ? pdfFile : null
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !result) return;
    await saveFlashcards(user.uid, result.title, result.flashcards);
    setSaved(true);
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          <h1 className="page-title">Flashcard Generator</h1>
          <p className="page-subtitle">Generate revision flashcards from notes or a PDF</p>

          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              marginBottom: 24,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              padding: 4,
              width: 'fit-content',
              border: '1px solid var(--border)',
            }}
          >
            {['text', 'pdf'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '7px 22px',
                  borderRadius: 'calc(var(--radius) - 3px)',
                  fontSize: '0.85rem',
                  fontWeight: mode === m ? 600 : 400,
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: mode === m ? '1px solid var(--border)' : 'none',
                  transition: 'all var(--transition)',
                }}
              >
                {m === 'text' ? 'Paste text' : 'Upload PDF'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'text' ? (
              <div className="form-group">
                <label className="form-label">Study content</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your notes, textbook content, or any study material here…"
                  rows={10}
                  style={{ resize: 'vertical' }}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">PDF file</label>
                <FileUpload
                  onFile={(file) => setPdfFile(file)}
                  label={pdfFile ? `Selected: ${pdfFile.name}` : 'Click to upload a PDF'}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (mode === 'text' ? !text.trim() : !pdfFile)}
                style={{ padding: '11px 30px' }}
              >
                {loading ? 'Generating…' : 'Generate flashcards'}
              </button>
              {loading && <LoadingSpinner message="Creating your flashcards…" />}
            </div>
          </form>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 40, animation: 'fadeIn 0.3s ease' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>{result.title}</h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {result.flashcards?.length} cards · Click any card to flip it
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saved}
                  style={{ fontSize: '0.85rem', flexShrink: 0 }}
                >
                  {saved ? 'Saved ✓' : 'Save flashcards'}
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: 16,
                }}
              >
                {result.flashcards?.map((fc, i) => (
                  <FlashcardCard key={i} question={fc.question} answer={fc.answer} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

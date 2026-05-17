import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { markEssay } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { saveEssay } from '../firebase/firestore.js';

const EXAM_BOARDS = ['Edexcel IGCSE', 'Edexcel GCSE', 'AQA'];
const SUBJECTS = [
  'Economics',
  'History',
  'English Literature',
  'English Language',
  'Geography',
  'Biology',
  'Chemistry',
  'Physics',
  'Business',
  'Sociology',
  'Psychology',
  'Politics',
];

function gradeColor(grade) {
  const g = parseInt(grade);
  if (g >= 7) return 'var(--green)';
  if (g >= 5) return 'var(--accent)';
  return 'var(--red)';
}

export default function EssayMarkerPage() {
  const { user } = useAuth();
  const [essayText, setEssayText] = useState('');
  const [examBoard, setExamBoard] = useState('Edexcel IGCSE');
  const [subject, setSubject] = useState('Economics');
  const [question, setQuestion] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!essayText.trim()) return;
    setLoading(true);
    setError('');
    setFeedback(null);
    setSaved(false);

    try {
      const result = await markEssay(essayText, examBoard, subject, question);
      setFeedback(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !feedback) return;
    await saveEssay(user.uid, essayText, examBoard, subject, feedback);
    setSaved(true);
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          <h1 className="page-title">Essay Marker</h1>
          <p className="page-subtitle">Paste your essay for structured AO-level feedback</p>

          <form onSubmit={handleSubmit}>
            {/* Selectors row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Exam Board</label>
                <select value={examBoard} onChange={(e) => setExamBoard(e.target.value)}>
                  {EXAM_BOARDS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Question (optional)</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Paste the question here…"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Essay</label>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Paste your essay here…"
                rows={14}
                style={{ resize: 'vertical', lineHeight: 1.75 }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !essayText.trim()}
                style={{ padding: '11px 30px' }}
              >
                {loading ? 'Marking…' : 'Mark essay'}
              </button>
              {loading && <LoadingSpinner message="Analysing your essay…" />}
            </div>
          </form>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 22 }}>
              {error}
            </div>
          )}

          {/* Results */}
          {feedback && (
            <div
              style={{
                marginTop: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {/* Score overview */}
              <ResultPanel title="Overall Result">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ lineHeight: 1 }}>
                    <span
                      style={{
                        fontSize: '3.2rem',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {feedback.overallMark}
                    </span>
                    <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }}>
                      /{feedback.maxMark}
                    </span>
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: `2px solid ${gradeColor(feedback.gradeEstimate)}`,
                      color: gradeColor(feedback.gradeEstimate),
                      borderRadius: 'var(--radius)',
                      padding: '8px 22px',
                      fontWeight: 700,
                      fontSize: '1.6rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Grade {feedback.gradeEstimate}
                  </div>
                </div>
              </ResultPanel>

              {/* AO Breakdown */}
              <ResultPanel title="Assessment Objective Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {feedback.aoBreakdown?.map((ao, i) => (
                    <div key={i}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 7,
                          alignItems: 'baseline',
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ao.objective}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600 }}>
                          {ao.score}/{ao.maxScore}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'var(--bg-elevated)',
                          borderRadius: 99,
                          marginBottom: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(ao.score / ao.maxScore) * 100}%`,
                            background: 'var(--accent)',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {ao.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultPanel>

              {/* Strengths + Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ResultPanel title="Strengths">
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {feedback.strengths?.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.875rem', lineHeight: 1.55 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                      </li>
                    ))}
                  </ul>
                </ResultPanel>

                <ResultPanel title="Areas to Improve">
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {feedback.improvements?.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.875rem', lineHeight: 1.55 }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>→</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                      </li>
                    ))}
                  </ul>
                </ResultPanel>
              </div>

              {/* Examiner comment */}
              <ResultPanel title="Examiner Comment">
                <p
                  style={{
                    fontSize: '0.93rem',
                    lineHeight: 1.75,
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  "{feedback.examinerComment}"
                </p>
              </ResultPanel>

              <div>
                <button
                  className="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saved}
                  style={{ fontSize: '0.85rem' }}
                >
                  {saved ? 'Saved to your account ✓' : 'Save this feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

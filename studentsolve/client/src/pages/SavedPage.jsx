import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getSpecUrl } from '../data/specLinks.js';
import Sidebar from '../components/Sidebar.jsx';
import FlashcardCard from '../components/FlashcardCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserSaved } from '../firebase/firestore.js';
import { uploadFileToFolder, getFilesInFolder, softDeleteFile, restoreFileDoc, formatFileSize, getFileIcon } from '../firebase/storage.js';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '../firebase/firebase.js';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const TYPE_ICONS = { essays: '✎', notes: '▶', flashcards: '⊟', tutor_sessions: '✦' };
const TYPE_LABELS = { essays: 'Essay', notes: 'YouTube Notes', flashcards: 'Flashcards', tutor_sessions: 'Tutor Chat' };
const TYPE_COLORS = { essays: '#6c9fe0', notes: '#5cb87a', flashcards: '#b87ce0', tutor_sessions: '#c8a96e' };

function formatDate(ts) {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getItemTitle(item, type) {
  if (type === 'essays') return item.subject || 'Essay';
  if (type === 'notes') return item.notes?.title || 'YouTube Notes';
  if (type === 'flashcards') return item.title || 'Flashcards';
  if (type === 'tutor_sessions') return item.title || 'Tutor Session';
  return 'Saved item';
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 22, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, justifyContent: 'center', padding: '10px', background: 'var(--red)', color: '#fff' }}>Move to bin</button>
        </div>
      </div>
    </div>
  );
}

function SpecCard({ subject, board, qualification }) {
  const url = getSpecUrl(subject, board, qualification);
  if (!url) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(200,169,110,0.35)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--accent-dim)', border: '1px solid rgba(200,169,110,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📋</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Specification</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{board}</span>
            <span> · Official PDF</span>
          </div>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '7px 16px', textDecoration: 'none', flexShrink: 0 }}>Open PDF →</a>
      </div>
    </div>
  );
}

function FilePanel({ file, onBin }) {
  const [expanded, setExpanded] = useState(false);
  const FILE_COLOR = '#6c9fe0';
  const fileType = file.fileType?.includes('pdf') ? 'PDF'
    : file.fileType?.includes('image') ? 'Image'
    : file.fileType?.includes('word') || file.fileType?.includes('document') ? 'Document'
    : file.fileType?.includes('text') ? 'Text file' : 'File';

  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${expanded ? FILE_COLOR + '55' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: `${FILE_COLOR}18`, border: `1px solid ${FILE_COLOR}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{getFileIcon(file.fileType)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{file.fileName}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
            <span style={{ color: FILE_COLOR, fontWeight: 500 }}>{fileType}</span>
            <span>·</span>
            <span>{formatFileSize(file.fileSize)}</span>
          </div>
        </div>
        <button onClick={() => onBin({ ...file, _type: 'file' })} title="Move to bin"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '4px 7px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
        >🗑</button>
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 7px', flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >▼</button>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 18px', display: 'flex', gap: 10, animation: 'fadeIn 0.2s ease' }}>
          <a href={file.downloadURL} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.83rem', padding: '8px 18px', textDecoration: 'none' }}>Open {fileType}</a>
          <a href={file.downloadURL} download={file.fileName} className="btn btn-secondary" style={{ fontSize: '0.83rem', padding: '8px 18px', textDecoration: 'none' }}>↓ Download</a>
        </div>
      )}
    </div>
  );
}

// ── Flashcard Editor Modal ─────────────────────────────────────────────────
function FlashcardEditor({ item, onSave, onClose }) {
  const [cards, setCards] = useState(item.flashcards ? [...item.flashcards.map(c => ({ ...c }))] : []);
  const [saving, setSaving] = useState(false);

  function updateCard(i, field, val) {
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  function addCard() {
    setCards(prev => [...prev, { question: '', answer: '' }]);
  }

  function removeCard(i) {
    setCards(prev => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    const cleaned = cards.filter(c => c.question.trim() || c.answer.trim());
    try {
      await updateDoc(doc(db, 'flashcards', item.id), { flashcards: cleaned });
      onSave(cleaned);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '26px', width: '100%', maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>Edit Flashcard Set</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0' }}>{item.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, marginBottom: 16 }}>
          {cards.map((card, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card {i + 1}</span>
                <button onClick={() => removeCard(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >✕ Remove</button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Question</div>
                <textarea value={card.question} onChange={e => updateCard(i, 'question', e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '8px 10px', resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Answer</div>
                <textarea value={card.answer} onChange={e => updateCard(i, 'answer', e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '8px 10px', resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>
          ))}
          <button onClick={addCard}
            style={{ padding: '10px', border: '1.5px dashed var(--border-subtle)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.83rem', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >+ Add card</button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : `Save ${cards.length} card${cards.length !== 1 ? 's' : ''}`}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Saved Item ─────────────────────────────────────────────────────────────
function SavedItem({ item, type, isExpanded, onToggle, onDragStart, onBin, folders, onAssignFolder, onFlashcardsUpdated }) {
  const title = getItemTitle(item, type);
  const color = TYPE_COLORS[type];
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [editingFlashcards, setEditingFlashcards] = useState(false);
  const [localFlashcards, setLocalFlashcards] = useState(item.flashcards || []);

  function handleFlashcardsSaved(updated) {
    setLocalFlashcards(updated);
    setEditingFlashcards(false);
    if (onFlashcardsUpdated) onFlashcardsUpdated(item.id, updated);
  }

  return (
    <>
      {editingFlashcards && (
        <FlashcardEditor
          item={{ ...item, flashcards: localFlashcards }}
          onSave={handleFlashcardsSaved}
          onClose={() => setEditingFlashcards(false)}
        />
      )}
      <div draggable onDragStart={onDragStart}
        style={{ background: 'var(--bg-card)', border: `1px solid ${isExpanded ? color + '44' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
          <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', color, flexShrink: 0 }}>
              {TYPE_ICONS[type]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color, fontWeight: 500 }}>{TYPE_LABELS[type]}</span>
                <span>·</span><span>{formatDate(item.createdAt)}</span>
                {type === 'flashcards' && <><span>·</span><span>{localFlashcards.length} cards</span></>}
                {type === 'essays' && item.feedback && <><span>·</span><span style={{ color: 'var(--accent)' }}>Grade {item.feedback.gradeEstimate} · {item.feedback.overallMark}/{item.feedback.maxMark}</span></>}
              </div>
            </div>
          </div>

          {/* Action buttons — always visible, folder + edit at front */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

            {/* Edit flashcards — always visible for flashcard type */}
            {type === 'flashcards' && (
              <button onClick={e => { e.stopPropagation(); setEditingFlashcards(true); }} title="Edit flashcards"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 7px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
              >✎</button>
            )}

            {/* Move to folder — always visible */}
            {Object.keys(folders).length > 0 && (
              <div style={{ position: 'relative' }}>
                <button onClick={e => { e.stopPropagation(); setShowFolderMenu(m => !m); }} title="Move to folder"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px 7px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                >📁</button>
                {showFolderMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 8, zIndex: 20, minWidth: 160, boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '2px 8px 8px' }}>Move to folder</div>
                    <button onClick={() => { onAssignFolder(item.id, 'none'); setShowFolderMenu(false); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.83rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >No folder</button>
                    {Object.keys(folders).map(f => (
                      <button key={f} onClick={() => { onAssignFolder(item.id, f); setShowFolderMenu(false); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '0.83rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 4 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >{f}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bin */}
            <button onClick={e => { e.stopPropagation(); onBin(item); }} title="Move to bin"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px 7px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >🗑</button>

            {/* Expand chevron */}
            <button onClick={onToggle}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 7px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
            >▼</button>
          </div>
        </div>

        {isExpanded && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            {type === 'flashcards' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {localFlashcards.map((fc, i) => <FlashcardCard key={i} question={fc.question} answer={fc.answer} index={i} />)}
                {localFlashcards.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No cards yet. Click ✎ to add some.</p>
                )}
              </div>
            )}
            {type === 'essays' && item.feedback && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div><span style={{ fontSize: '2.6rem', fontFamily: 'var(--font-display)' }}>{item.feedback.overallMark}</span><span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{item.feedback.maxMark}</span></div>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 'var(--radius)', padding: '5px 16px', fontWeight: 700, fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>Grade {item.feedback.gradeEstimate}</div>
                </div>
                {item.feedback.aoBreakdown?.map((ao, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ao.objective}</span><span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>{ao.score}/{ao.maxScore}</span></div>
                    <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99, marginBottom: 7 }}><div style={{ height: '100%', width: `${(ao.score / ao.maxScore) * 100}%`, background: 'var(--accent)', borderRadius: 99 }} /></div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{ao.comment}</p>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 14 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Strengths</div>
                    {item.feedback.strengths?.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.83rem', marginBottom: 7, lineHeight: 1.5 }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>{s}</span></div>)}
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 14 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Improvements</div>
                    {item.feedback.improvements?.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.83rem', marginBottom: 7, lineHeight: 1.5 }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span><span style={{ color: 'var(--text-secondary)' }}>{s}</span></div>)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 14 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Examiner Comment</div>
                  <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7 }}>"{item.feedback.examinerComment}"</p>
                </div>
              </div>
            )}
            {type === 'notes' && item.notes && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.notes.summary}</p>
                {item.notes.keyPoints && <div>{item.notes.keyPoints.map((p, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.86rem', marginBottom: 7, lineHeight: 1.55 }}><span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span><span style={{ color: 'var(--text-secondary)' }}>{p}</span></div>)}</div>}
                {item.notes.detailedNotes && <div className="markdown-body" style={{ fontSize: '0.86rem', lineHeight: 1.75 }}><ReactMarkdown>{item.notes.detailedNotes}</ReactMarkdown></div>}
              </div>
            )}
            {type === 'tutor_sessions' && item.messages && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {item.messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)', color: msg.role === 'user' ? '#0d0d0f' : 'var(--text-primary)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function FolderUploadZone({ user, folderName, onBinFile }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    setLoading(false);
    if (!user || !folderName || folderName === 'all') return;
    getFilesInFolder(user.uid, folderName).then(setFiles).catch(() => setFiles([])).finally(() => setLoading(false));
  }, [user, folderName]);

  async function handleFiles(fileList) {
    const allowed = Array.from(fileList).filter(f => f.size < 20 * 1024 * 1024);
    if (!allowed.length) return;
    setUploading(true);
    const newFiles = [];
    for (const file of allowed) {
      try {
        const result = await uploadFileToFolder(user.uid, folderName, file, p => setUploadProgress(prev => ({ ...prev, [file.name]: p })));
        newFiles.push(result);
      } catch (err) { console.error(err); }
    }
    setFiles(prev => [...newFiles, ...prev]);
    setUploadProgress({});
    setUploading(false);
  }

  async function handleBinFile(file) {
    setFiles(prev => prev.filter(f => f.id !== file.id));
    try { await softDeleteFile(file.id); } catch (e) { console.error(e); }
    onBinFile({ ...file, _type: 'file', originalFolder: folderName });
  }

  if (folderName === 'all') return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current.click()}
        style={{ border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '24px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--accent-glow)' : 'var(--bg-elevated)', transition: 'all var(--transition)', marginBottom: 12 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
        onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}}
      >
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ fontSize: '1.4rem', marginBottom: 6, opacity: 0.5 }}>⬆</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{uploading ? 'Uploading…' : 'Drop files here or click to upload'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>PDF, images, documents · Max 20MB each</div>
      </div>
      {Object.entries(uploadProgress).map(([name, progress]) => (
        <div key={name} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}><span>{name}</span><span>{progress}%</span></div>
          <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99 }}><div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.2s' }} /></div>
        </div>
      ))}
      {loading ? <LoadingSpinner message="Loading files…" /> : files.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No files uploaded yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(file => <FilePanel key={file.id} file={file} onBin={handleBinFile} />)}
        </div>
      )}
    </div>
  );
}

function BinSubSection({ label, icon, entries, bin, onRecover, getLabel, getSubLabel }) {
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer', transition: 'all var(--transition)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      >
        {icon} {label}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 99, padding: '1px 6px' }}>{entries.length}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5, paddingLeft: 4 }}>
          {entries.map(entry => {
            const globalIndex = bin.indexOf(entry);
            const title = getLabel ? getLabel(entry) : `📁 ${entry.name}`;
            const sub = getSubLabel ? getSubLabel(entry) : null;
            return (
              <div key={globalIndex} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '9px 11px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>{sub}</div>}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 7 }}>{new Date(entry.binnedAt).toLocaleDateString('en-GB')}</div>
                <button onClick={() => onRecover(entry, globalIndex)}
                  style={{ width: '100%', padding: '5px 8px', fontSize: '0.74rem', background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >↩ Recover</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeFolder, setActiveFolder] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('folder') || 'all';
  });
  const [folders, setFolders] = useState({});
  const [userProfile, setUserProfile] = useState({});
  const [folderOrder, setFolderOrder] = useState([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [draggingFolder, setDraggingFolder] = useState(null);
  const [shareToast, setShareToast] = useState('');
  const [bin, setBin] = useState([]);
  const [showBin, setShowBin] = useState(false);
  const [confirmPending, setConfirmPending] = useState(null);
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserSaved(user.uid).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
    const saved = localStorage.getItem(`folders_${user.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setFolders(parsed);
      setFolderOrder(Object.keys(parsed));
    }
    const savedBin = localStorage.getItem(`bin_${user.uid}`);
    if (savedBin) setBin(JSON.parse(savedBin));
    import('../firebase/firestore.js').then(({ getUserProfile }) => {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profile));
          setUserProfile(profile);
        }
      }).catch(() => {});
    });
  }, [user]);

  function saveFolders(updated, order) {
    setFolders(updated);
    const newOrder = order || Object.keys(updated);
    setFolderOrder(newOrder);
    localStorage.setItem(`folders_${user.uid}`, JSON.stringify(updated));
    localStorage.setItem(`folderOrder_${user.uid}`, JSON.stringify(newOrder));
  }

  function saveBin(updated) {
    setBin(updated);
    localStorage.setItem(`bin_${user.uid}`, JSON.stringify(updated));
  }

  function createFolder() {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    const updated = { ...folders, [name]: [] };
    saveFolders(updated, [...folderOrder, name]);
    setNewFolderName('');
    setShowNewFolder(false);
    setActiveFolder(name);
  }

  function moveFolderToBin(folderName) {
    setConfirmPending({ type: 'folder', name: folderName });
  }

  function confirmBin() {
    const pending = confirmPending;
    setConfirmPending(null);
    if (pending.type === 'folder') {
      const updated = { ...folders };
      const items = updated[pending.name] || [];
      delete updated[pending.name];
      saveFolders(updated, folderOrder.filter(f => f !== pending.name));
      saveBin([...bin, { type: 'folder', name: pending.name, items, binnedAt: Date.now() }]);
      if (activeFolder === pending.name) setActiveFolder('all');
    } else {
      const item = pending.item;
      const originalFolder = Object.keys(folders).find(f => folders[f]?.includes(item.id)) || null;
      if (item._type !== 'file') {
        const updated = { ...folders };
        Object.keys(updated).forEach(f => { updated[f] = updated[f].filter(id => id !== item.id); });
        saveFolders(updated);
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, [item._type]: prev[item._type].filter(i => i.id !== item.id) };
        });
      }
      saveBin([...bin, { type: item._type === 'file' ? 'file' : 'item', item, originalFolder, binnedAt: Date.now() }]);
    }
  }

  function recoverFromBin(binEntry, index) {
    const newBin = bin.filter((_, i) => i !== index);
    saveBin(newBin);
    if (binEntry.type === 'folder') {
      const updated = { ...folders, [binEntry.name]: binEntry.items || [] };
      saveFolders(updated, [...folderOrder, binEntry.name]);
    } else if (binEntry.type === 'item') {
      setData(prev => {
        if (!prev) return prev;
        const col = binEntry.item._type;
        const exists = prev[col].find(i => i.id === binEntry.item.id);
        if (exists) return prev;
        return { ...prev, [col]: [binEntry.item, ...prev[col]] };
      });
      if (binEntry.originalFolder && folders[binEntry.originalFolder]) {
        const updated = { ...folders };
        if (!updated[binEntry.originalFolder].includes(binEntry.item.id)) {
          updated[binEntry.originalFolder] = [...updated[binEntry.originalFolder], binEntry.item.id];
        }
        saveFolders(updated);
      }
    } else if (binEntry.type === 'file') {
      restoreFileDoc(user.uid, { ...binEntry, folderName: binEntry.originalFolder || binEntry.folderName });
    }
  }

  function requestBinItem(item) {
    setConfirmPending({ type: 'item', item });
  }

  function assignToFolder(itemId, folderName) {
    const updated = { ...folders };
    Object.keys(updated).forEach(f => { updated[f] = updated[f].filter(id => id !== itemId); });
    if (folderName !== 'none') updated[folderName] = [...(updated[folderName] || []), itemId];
    saveFolders(updated);
  }

  function handleDragStart(item) { setDraggingItem(item.id); }

  function handleDropOnFolder(folderName) {
    if (draggingFolder) {
      const from = draggingFolder;
      if (from === folderName) { setDraggingFolder(null); return; }
      const order = [...folderOrder];
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(folderName);
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, from);
      setFolderOrder(order);
      localStorage.setItem(`folderOrder_${user.uid}`, JSON.stringify(order));
      setDraggingFolder(null);
    } else if (draggingItem) {
      assignToFolder(draggingItem, folderName);
      setDraggingItem(null);
    }
    setDragOverFolder(null);
  }

  function handleShareFolder() {
    const url = `${window.location.origin}/saved?folder=${encodeURIComponent(activeFolder)}`;
    navigator.clipboard.writeText(url);
    setShareToast('Link copied!');
    setTimeout(() => setShareToast(''), 3000);
  }

  function handleFlashcardsUpdated(itemId, updatedCards) {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, flashcards: prev.flashcards.map(f => f.id === itemId ? { ...f, flashcards: updatedCards } : f) };
    });
  }

  function handleExport() {
    let content = `# ${activeFolder === 'all' ? 'All Saved Work' : activeFolder}\n\n`;
    filteredItems.forEach(item => {
      content += `## ${getItemTitle(item, item._type)}\n*${TYPE_LABELS[item._type]} · ${formatDate(item.createdAt)}*\n\n`;
      if (item._type === 'essays' && item.feedback) {
        content += `**Grade:** ${item.feedback.gradeEstimate} (${item.feedback.overallMark}/${item.feedback.maxMark})\n\n`;
        content += `**Examiner Comment:** ${item.feedback.examinerComment}\n\n`;
        content += `**Strengths:**\n${item.feedback.strengths?.map(s => `- ${s}`).join('\n')}\n\n`;
        content += `**Improvements:**\n${item.feedback.improvements?.map(s => `- ${s}`).join('\n')}\n\n`;
      }
      if (item._type === 'notes' && item.notes) content += `${item.notes.summary}\n\n${item.notes.detailedNotes}\n\n`;
      if (item._type === 'flashcards' && item.flashcards) content += item.flashcards.map(fc => `**Q:** ${fc.question}\n**A:** ${fc.answer}`).join('\n\n') + '\n\n';
      content += '---\n\n';
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeFolder === 'all' ? 'saved-work' : activeFolder}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  const allItems = data ? [
    ...data.essays.map(i => ({ ...i, _type: 'essays' })),
    ...data.notes.map(i => ({ ...i, _type: 'notes' })),
    ...data.flashcards.map(i => ({ ...i, _type: 'flashcards' })),
    ...data.tutor_sessions.map(i => ({ ...i, _type: 'tutor_sessions' })),
  ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) : [];

  const filteredItems = activeFolder === 'all'
    ? allItems
    : allItems.filter(item => folders[activeFolder]?.includes(item.id));

  const orderedFolderNames = folderOrder.filter(f => f in folders);

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          <h1 className="page-title" style={{ marginBottom: 6 }}>Saved Work</h1>
          <p className="page-subtitle">All your previously saved outputs</p>

          {shareToast && <div className="alert alert-success" style={{ marginBottom: 16, animation: 'fadeIn 0.2s ease' }}>{shareToast}</div>}
          {confirmPending && (
            <ConfirmDialog
              message={confirmPending.type === 'folder' ? `Move folder "${confirmPending.name}" to bin? You can recover it later.` : `Move "${getItemTitle(confirmPending.item, confirmPending.item._type)}" to bin? You can recover it later.`}
              onConfirm={confirmBin}
              onCancel={() => setConfirmPending(null)}
            />
          )}

          <div className="saved-folder-topbar" style={{ position: 'sticky', top: 56, zIndex: 50, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', marginBottom: 16, marginLeft: -16, marginRight: -16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeFolder === 'all' ? '◈ All saved' : `▣ ${activeFolder}`}</span>
            <button onClick={() => setMobileFolderOpen(o => !o)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Folders {mobileFolderOpen ? '▲' : '▼'}
            </button>
          </div>

          {mobileFolderOpen && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => { setActiveFolder('all'); setMobileFolderOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: activeFolder === 'all' ? 600 : 400, color: activeFolder === 'all' ? 'var(--accent)' : 'var(--text-secondary)', background: activeFolder === 'all' ? 'var(--accent-dim)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>◈ All saved <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.6 }}>{allItems.length}</span></button>
              {orderedFolderNames.map(folder => (
                <button key={folder} onClick={() => { setActiveFolder(folder); setMobileFolderOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: activeFolder === folder ? 600 : 400, color: activeFolder === folder ? 'var(--accent)' : 'var(--text-secondary)', background: activeFolder === folder ? 'var(--accent-dim)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>▣ {folder} <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.6 }}>{folders[folder]?.length || 0}</span></button>
              ))}
              <button onClick={() => { setShowNewFolder(true); setMobileFolderOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', width: '100%', marginTop: 4 }}>+ New folder</button>
            </div>
          )}

          <div className="saved-layout" style={{ display: 'flex', gap: 12 }}>
            <div className="saved-folder-sidebar" style={{ width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Folders</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
                <button onClick={() => setActiveFolder('all')}
                  onDragOver={e => { e.preventDefault(); setDragOverFolder('all'); }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={() => handleDropOnFolder('none')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: activeFolder === 'all' ? 600 : 400, color: activeFolder === 'all' ? 'var(--accent)' : 'var(--text-secondary)', background: activeFolder === 'all' ? 'var(--accent-dim)' : 'transparent', border: dragOverFolder === 'all' ? '1px dashed var(--accent)' : 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >◈ All saved <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.6 }}>{allItems.length}</span></button>
                {orderedFolderNames.map(folder => (
                  <div key={folder} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}
                    draggable
                    onDragStart={() => setDraggingFolder(folder)}
                    onDragOver={e => { e.preventDefault(); setDragOverFolder(folder); }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={() => handleDropOnFolder(folder)}
                  >
                    <button onClick={() => setActiveFolder(folder)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: activeFolder === folder ? 600 : 400, color: activeFolder === folder ? 'var(--accent)' : 'var(--text-secondary)', background: dragOverFolder === folder ? 'var(--accent-dim)' : activeFolder === folder ? 'var(--accent-dim)' : 'transparent', border: dragOverFolder === folder ? '1px dashed var(--accent)' : 'none', cursor: 'pointer', textAlign: 'left', flex: 1 }}
                    >
                      <span style={{ cursor: 'grab', opacity: 0.4, fontSize: '0.7rem' }}>⠿</span>
                      ▣ {folder}
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.6 }}>{folders[folder]?.length || 0}</span>
                    </button>
                    <button onClick={() => moveFolderToBin(folder)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.78rem', padding: '4px 6px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-dim)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'none'; }}
                    >🗑</button>
                  </div>
                ))}
              </div>
              {showNewFolder ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name" style={{ fontSize: '0.83rem', padding: '7px 10px' }} autoFocus onKeyDown={e => e.key === 'Enter' && createFolder()} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', justifyContent: 'center' }} onClick={createFolder}>Create</button>
                    <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', justifyContent: 'center' }} onClick={() => setShowNewFolder(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewFolder(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border)', cursor: 'pointer', width: '100%', transition: 'all var(--transition)', marginBottom: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >+ New folder</button>
              )}
              {allItems.length > 0 && orderedFolderNames.length > 0 && (
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5, textAlign: 'center' }}>Drag folders to reorder · Drag items onto folders</p>
              )}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <button onClick={() => setShowBin(b => !b)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: bin.length > 0 ? 'var(--red)' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🗑 Bin
                  {bin.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>{bin.length}</span>}
                  <span style={{ fontSize: '0.7rem', marginLeft: bin.length > 0 ? 0 : 'auto' }}>{showBin ? '▲' : '▼'}</span>
                </button>
                {showBin && (() => {
                  const binFolders = bin.filter(e => e.type === 'folder');
                  const binItems = bin.filter(e => e.type === 'item' || e.type === 'file');
                  return (
                    <div style={{ marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
                      {bin.length === 0 ? (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 12px' }}>Bin is empty</p>
                      ) : (
                        <>
                          <BinSubSection label="Folders" icon="📁" entries={binFolders} bin={bin} onRecover={recoverFromBin} />
                          <BinSubSection label="Saved Items" icon="◈" entries={binItems} bin={bin} onRecover={recoverFromBin}
                            getLabel={entry => entry.type === 'file' ? (entry.item?.fileName || 'File') : `${TYPE_ICONS[entry.item?._type] || '◈'} ${getItemTitle(entry.item, entry.item?._type)}`}
                            getSubLabel={entry => entry.originalFolder ? `from ${entry.originalFolder}` : null}
                          />
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {activeFolder !== 'all' && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }} onClick={handleExport}>↓ Export as Markdown</button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }} onClick={handleShareFolder}>⎘ Copy share link</button>
                </div>
              )}
              {activeFolder !== 'all' && (
                <div style={{ marginBottom: 20 }}>
                  {(() => {
                    const board = userProfile?.subjectBoards?.[activeFolder];
                    const qual = userProfile?.primaryQualification || 'GCSE';
                    return board ? <SpecCard subject={activeFolder} board={board} qualification={qual} /> : null;
                  })()}
                  <FolderUploadZone user={user} folderName={activeFolder} onBinFile={requestBinItem} />
                </div>
              )}
              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
              {loading && <LoadingSpinner message="Loading saved work…" />}
              {!loading && filteredItems.length === 0 && activeFolder === 'all' && (
                <div className="empty-state">
                  <div className="empty-state-icon">◈</div>
                  <h3>Nothing saved yet</h3>
                  <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Use a feature and save your results to see them here.</p>
                </div>
              )}
              {!loading && filteredItems.length === 0 && activeFolder !== 'all' && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.3 }}>▣</div>
                  <p style={{ fontSize: '0.85rem' }}>Drag saved items here to add them to this folder</p>
                </div>
              )}
              {!loading && filteredItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredItems.map(item => (
                    <SavedItem
                      key={item.id}
                      item={item}
                      type={item._type}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onDragStart={() => handleDragStart(item)}
                      onBin={requestBinItem}
                      folders={folders}
                      onAssignFolder={assignToFolder}
                      onFlashcardsUpdated={handleFlashcardsUpdated}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
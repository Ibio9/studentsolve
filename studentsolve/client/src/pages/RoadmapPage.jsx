import { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { saveRoadmap, getUserRoadmaps, deleteRoadmap, renameRoadmap } from '../firebase/firestore.js';

const API_URL = import.meta.env.VITE_API_URL || 'https://studentsolve-production.up.railway.app/api';

const SUBJECTS = [
  'Mathematics', 'Further Maths', 'Economics', 'Biology', 'Chemistry',
  'Physics', 'History', 'Geography', 'English Literature', 'Philosophy',
  'Computer Science', 'Psychology', 'Sociology', 'Politics', 'French', 'Spanish',
];

const iconStyle = {
  critical: { background: 'rgba(200,90,90,0.12)', color: '#c85a5a' },
  high: { background: 'rgba(200,136,75,0.12)', color: '#c8884b' },
  medium: { background: 'rgba(74,126,200,0.12)', color: '#4a7ec8' },
};

export default function RoadMapPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({ university: '', degree: '', year: '', school: '', grades: '', doneAlready: '', extra: '' });
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [customSubject, setCustomSubject] = useState('');
  const [extraSubjects, setExtraSubjects] = useState([]);
  const [uploadedText, setUploadedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState('');
  const [taskState, setTaskState] = useState({});
  const [formError, setFormError] = useState('');

  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentRoadmapId, setCurrentRoadmapId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSubj = (s) => setSelectedSubjects(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const addCustomSubject = () => { const v = customSubject.trim(); if (!v) return; setExtraSubjects(p => [...p, v]); setSelectedSubjects(prev => new Set([...prev, v])); setCustomSubject(''); };

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setUploadedFileName(file.name);
    try {
      if (file.name.endsWith('.docx')) { const buf = await file.arrayBuffer(); const r = await mammoth.extractRawText({ arrayBuffer: buf }); setUploadedText(r.value); }
      else { setUploadedText(await file.text()); }
    } catch { setUploadedText(''); setUploadedFileName('Could not read file — try .txt or .docx'); }
    setUploading(false);
  };

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingId]);

  useEffect(() => {
    if (user) loadSavedRoadmaps();
  }, [user]);

  const loadSavedRoadmaps = async () => {
    try { setSavedRoadmaps(await getUserRoadmaps(user.uid)); }
    catch (e) { console.error('Failed to load roadmaps', e); }
  };

  const handleSave = async () => {
    if (!roadmap || !user) return;
    setSaving(true);
    try {
      const title = `${form.university} — ${form.degree}`;
      const ref = await saveRoadmap(user.uid, title, { ...form, subjects: [...selectedSubjects] }, roadmap);
      setCurrentRoadmapId(ref.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadSavedRoadmaps();
    } catch (e) { console.error('Failed to save', e); }
    setSaving(false);
  };

  const handleLoad = (saved) => {
    setRoadmap(saved.roadmapData);
    setForm(saved.formData);
    setSelectedSubjects(new Set(saved.formData.subjects || []));
    setTaskState({});
    setCurrentRoadmapId(saved.id);
    setDropdownOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoadmap(deleteTarget.id);
      setSavedRoadmaps(p => p.filter(r => r.id !== deleteTarget.id));
      if (currentRoadmapId === deleteTarget.id) { setRoadmap(null); setCurrentRoadmapId(null); }
    } catch (e) { console.error('Failed to delete', e); }
    setDeleteTarget(null);
  };

  const startRename = (r, e) => { e.stopPropagation(); setRenamingId(r.id); setRenameValue(r.title); };

  const submitRename = async (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    try {
      await renameRoadmap(id, trimmed);
      setSavedRoadmaps(p => p.map(r => r.id === id ? { ...r, title: trimmed } : r));
    } catch (e) { console.error('Failed to rename', e); }
    setRenamingId(null);
  };

  const allSubjects = [...SUBJECTS, ...extraSubjects];
  const totalTasks = roadmap ? roadmap.phases.reduce((s, p) => s + p.tasks.length, 0) : 0;
  const doneTasks = Object.values(taskState).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const toggleTask = (id) => setTaskState(p => ({ ...p, [id]: !p[id] }));
  const taskBoost = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 15) : 0;
  const displayProbability = roadmap ? Math.min(99, roadmap.probability + taskBoost) : 0;
  const probCol = !roadmap ? 'low' : displayProbability < 25 ? 'low' : displayProbability < 50 ? 'mid' : 'high';

  const generate = async () => {
    setFormError('');
    if (!form.university || !form.degree || !form.year) { setFormError('Please fill in university, degree, and year group.'); return; }
    setLoading(true); setRoadmap(null); setTaskState({}); setError(''); setCurrentRoadmapId(null);
    try {
      const res = await fetch(`${API_URL}/roadmap`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, subjects: [...selectedSubjects], uploadedText }) });
      if (!res.ok) throw new Error('Server error');
      setRoadmap(await res.json());
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 44px 80px', width: '100%' }}>

          {/* TOP BAR */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={s.eye}>AI-Powered · Personalised · Honest</div>
              <h1 style={s.title}>Your route to <em style={s.em}>university</em></h1>
              <p style={s.sub}>Tell us your target, your subjects, and where you're starting from. We'll build a realistic roadmap — and tell you honestly what stands in the way.</p>
            </div>

            {/* SAVED ROADMAPS DROPDOWN */}
            <div style={{ position: 'relative', flexShrink: 0, marginTop: 4 }} ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(o => !o)} style={s.dropBtn}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 5 }}>
                  <rect x="1" y="1" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="1" y="5.5" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="1" y="10" width="5" height="1.5" rx=".75" fill="currentColor"/>
                </svg>
                Saved roadmaps
                {savedRoadmaps.length > 0 && <span style={s.dropCount}>{savedRoadmaps.length}</span>}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginLeft: 5, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                  <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={s.dropdown}>
                  {savedRoadmaps.length === 0 ? (
                    <div style={s.dropEmpty}>No saved roadmaps yet</div>
                  ) : savedRoadmaps.map(r => (
                    <div key={r.id} style={s.dropItem} onClick={() => handleLoad(r)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {renamingId === r.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={() => submitRename(r.id)}
                            onKeyDown={e => { if (e.key === 'Enter') submitRename(r.id); if (e.key === 'Escape') setRenamingId(null); }}
                            onClick={e => e.stopPropagation()}
                            style={s.renameInput}
                          />
                        ) : (
                          <>
                            <div style={s.dropItemTitle}>{r.title}</div>
                            <div style={s.dropItemSub}>{r.formData?.university} · {r.formData?.degree}</div>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button title="Rename" onClick={e => startRename(r, e)} style={s.dropIconBtn}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M7.5 1a1.414 1.414 0 012 2L2.5 10l-2.5.5.5-2.5L7.5 1z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button title="Delete" onClick={e => { e.stopPropagation(); setDeleteTarget(r); setDropdownOpen(false); }} style={{ ...s.dropIconBtn, color: '#c85a5a' }}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M1 2.5h9M4 2.5V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v.5M4.5 5v3M6.5 5v3M2 2.5l.5 6.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L9 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INTAKE FORM */}
          <div style={s.card}>
            <div style={s.cardHdr}>
              <div style={s.cardIcon}>01</div>
              <div><div style={s.cardTitle}>About your application</div><div style={s.cardSub}>Fill in what you know — estimates are fine</div></div>
            </div>
            <div style={s.cardBody}>
              <div style={s.row}>
                <Field label="Target university"><input style={s.input} value={form.university} onChange={e => set('university', e.target.value)} placeholder="e.g. Oxford, LSE, UCL..." /></Field>
                <Field label="Desired degree"><input style={s.input} value={form.degree} onChange={e => set('degree', e.target.value)} placeholder="e.g. Economics, Law, Medicine..." /></Field>
              </div>
              <div style={s.row}>
                <Field label="Current year group">
                  <select style={s.input} value={form.year} onChange={e => set('year', e.target.value)}>
                    <option value="">Select year...</option>
                    <option>Year 9</option><option>Year 10</option><option>Year 11 (GCSEs)</option>
                    <option>Year 12 (Lower Sixth)</option><option>Year 13 (Upper Sixth)</option><option>Gap year</option>
                  </select>
                </Field>
                <Field label="School type">
                  <select style={s.input} value={form.school} onChange={e => set('school', e.target.value)}>
                    <option value="">Select...</option>
                    <option>State comprehensive</option><option>State grammar</option><option>State sixth form college</option>
                    <option>Independent / private</option><option>Academy</option><option>International school</option>
                  </select>
                </Field>
              </div>
              <Field label="Your subjects">
                <div style={s.pillGrid}>{allSubjects.map(subj => <button key={subj} onClick={() => toggleSubj(subj)} style={{ ...s.pill, ...(selectedSubjects.has(subj) ? s.pillActive : {}) }}>{subj}</button>)}</div>
                <div style={s.pillAddRow}>
                  <input style={{ ...s.input, flex: 1 }} value={customSubject} onChange={e => setCustomSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomSubject()} placeholder="Add another subject..." />
                  <button onClick={addCustomSubject} style={s.addBtn}>+ Add</button>
                </div>
              </Field>
              <Field label="Current / predicted grades"><input style={s.input} value={form.grades} onChange={e => set('grades', e.target.value)} placeholder="e.g. Maths A*, Economics A — or 'not sure yet'" /></Field>
              <Field label="What have you done already? (optional)"><textarea style={{ ...s.input, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }} value={form.doneAlready} onChange={e => set('doneAlready', e.target.value)} placeholder="Work experience, competitions, books read, clubs, EPQ..." /></Field>
              <Field label="Upload a document (CV, personal statement draft, etc.)">
                <label style={s.uploadLabel}>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFile} style={{ display: 'none' }} />
                  <span style={s.uploadBtn}>{uploading ? 'Reading file...' : uploadedFileName ? `✓ ${uploadedFileName}` : '↑ Choose file (.pdf, .docx, .txt)'}</span>
                </label>
                {uploadedText && <div style={s.uploadConfirm}>File read — AI will use this as context</div>}
              </Field>
              <Field label="Anything else we should know?"><textarea style={{ ...s.input, minHeight: 60, resize: 'vertical', lineHeight: 1.5 }} value={form.extra} onChange={e => set('extra', e.target.value)} placeholder="Contextual factors, specific concerns, what you're most worried about..." /></Field>
              {formError && <div style={s.formError}>{formError}</div>}
              {error && <div style={s.formError}>{error}</div>}
              <button onClick={generate} disabled={loading} style={{ ...s.genBtn, opacity: loading ? .5 : 1 }}>{loading ? 'Building your roadmap...' : 'Generate my roadmap'}</button>
            </div>
          </div>

          {loading && (
            <div style={s.loadCard}>
              <div style={s.dots}>{[0,1,2].map(i => <div key={i} style={{ ...s.dot, animationDelay: `${i*0.2}s` }} />)}</div>
              <div style={s.loadText}>Building your personalised roadmap</div>
              <div style={s.loadSub}>Analysing your profile against admission patterns...</div>
            </div>
          )}

          {roadmap && (
            <div>
              {/* DISCLAIMER */}
              <div style={{ background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 8, padding: '2px 6px', borderRadius: 2, background: 'rgba(200,168,75,0.15)', color: '#c8a84b', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1, letterSpacing: '.04em', textTransform: 'uppercase' }}>estimate</span>
                <span style={{ fontSize: 12, color: '#8a8070', lineHeight: 1.6 }}>This roadmap is AI-generated based on the information you provided. Probabilities are estimates only — university admissions involve many unpredictable factors. Nothing here constitutes formal advice.</span>
              </div>

              {/* SAVE BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={handleSave} disabled={saving || !!currentRoadmapId} style={{ ...s.saveBtn, opacity: (saving || currentRoadmapId) ? .6 : 1 }}>
                  {saveSuccess ? '✓ Saved!' : saving ? 'Saving...' : currentRoadmapId ? '✓ Saved' : '↓ Save roadmap'}
                </button>
              </div>

              {/* STICKY PROBABILITY */}
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111110', paddingBottom: 8, paddingTop: 4 }}>
                <div style={s.probCard}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={s.probLbl}>Offer probability</div>
                    <div style={{ ...s.probNum, color: probCol === 'low' ? '#c85a5a' : probCol === 'mid' ? '#c8884b' : '#4a9e6a', transition: 'color 0.3s ease' }}>{displayProbability}%</div>
                    <div style={s.probBase}>base rate: ~{roadmap.baseProbability}%</div>
                    {taskBoost > 0 && <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a9e6a', marginTop: 2 }}>+{taskBoost}% from tasks</div>}
                  </div>
                  <div style={s.probDiv} />
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={s.probBarWrap}><div style={{ ...s.probBar, width: `${Math.min(100, Math.round(((displayProbability - roadmap.baseProbability) / Math.max(1, 70 - roadmap.baseProbability)) * 100 + 10))}%`, background: probCol === 'low' ? '#c85a5a' : probCol === 'mid' ? '#c8884b' : '#4a9e6a', transition: 'width 0.5s ease' }} /></div>
                    <div style={s.probMsg} dangerouslySetInnerHTML={{ __html: roadmap.probMessage }} />
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.5rem', flexShrink: 0, minWidth: 100 }}>
                    <div style={s.psLabel}>Tasks done</div>
                    <div style={s.psVal}>{pct}%</div>
                    <div style={s.psBarWrap}><div style={{ ...s.psBar, width: `${pct}%` }} /></div>
                    <div style={s.psTasks}><b style={{ color: '#f0ece4' }}>{doneTasks}</b> / <b style={{ color: '#f0ece4' }}>{totalTasks}</b></div>
                  </div>
                </div>
              </div>

              <div style={s.caveat}><span style={s.caveatTag}>honest reality</span><span style={s.caveatText}>{roadmap.caveat}</span></div>

              {roadmap.phases.map((phase, pi) => {
                const pri = phase.priority || 'medium';
                return (
                  <div key={phase.id} style={{ ...s.phaseBlock, animationDelay: `${pi * 0.08 + 0.1}s` }}>
                    <div style={s.phaseHdr}>
                      <div style={{ ...s.phaseIcon, ...iconStyle[pri] }}>{String(pi+1).padStart(2,'0')}</div>
                      <div style={{ flex: 1 }}>
                        <div style={s.phaseTitle}>{phase.title}</div>
                        <div style={s.phaseSub}>{phase.timeframe} · {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}</div>
                        <div style={{ ...s.phaseBadge, ...(pri === 'critical' ? s.badgeCrit : pri === 'high' ? s.badgeHigh : s.badgeMed) }}>{pri}</div>
                      </div>
                    </div>
                    <div>
                      {phase.tasks.map(task => {
                        const done = !!taskState[task.id]; const tp = task.priority || 'medium';
                        return (
                          <div key={task.id} onClick={() => toggleTask(task.id)} style={{ ...s.taskItem, ...(done ? s.taskDone : {}) }}>
                            <div style={{ ...s.cb, ...(done ? s.cbDone : {}) }}>{done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ ...s.taskMain, ...(done ? s.taskMainDone : {}) }}>{task.title}<span style={{ ...s.taskPri, ...(tp === 'critical' ? s.priCrit : tp === 'high' ? s.priHigh : s.priMed) }}>{tp}</span></div>
                              {!done && <div style={s.taskDetail}>{task.detail}</div>}
                            </div>
                            <div style={{ ...s.taskWeight, ...(done ? { color: '#4a9e6a' } : {}) }}>+{task.impact || 1}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div style={s.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Delete roadmap?</div>
            <div style={s.modalSub}>"{deleteTarget.title}" will be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setDeleteTarget(null)} style={s.modalCancel}>Cancel</button>
              <button onClick={confirmDelete} style={s.modalDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8070' }}>{label}</div>
      {children}
    </div>
  );
}

const s = {
  eye: { fontFamily: 'monospace', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8b6914', marginBottom: '.8rem' },
  title: { fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 400, lineHeight: 1.05, marginBottom: '.6rem', color: '#f0ece4' },
  em: { fontStyle: 'italic', color: '#c8a84b' },
  sub: { color: '#8a8070', fontSize: 13, maxWidth: 480, marginBottom: '2.5rem' },
  dropBtn: { display: 'flex', alignItems: 'center', background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '8px 12px', color: '#8a8070', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' },
  dropCount: { background: 'rgba(200,168,75,0.12)', color: '#c8a84b', borderRadius: 10, padding: '1px 6px', fontSize: 9, marginLeft: 6 },
  dropdown: { position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 300, background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  dropEmpty: { padding: '20px 16px', fontFamily: 'monospace', fontSize: 10, color: '#5a5248', textAlign: 'center' },
  dropItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' },
  dropItemTitle: { fontSize: 12, fontWeight: 500, color: '#f0ece4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dropItemSub: { fontSize: 10, color: '#5a5248', fontFamily: 'monospace', marginTop: 2 },
  dropIconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#5a5248', padding: '3px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' },
  renameInput: { background: '#2a2820', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 4, color: '#f0ece4', fontFamily: 'monospace', fontSize: 11, padding: '3px 6px', outline: 'none', width: '100%' },
  saveBtn: { background: 'rgba(74,158,106,0.1)', border: '1px solid rgba(74,158,106,0.3)', borderRadius: 6, color: '#4a9e6a', fontFamily: 'monospace', fontSize: 10, padding: '6px 14px', cursor: 'pointer', letterSpacing: '.04em' },
  card: { background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' },
  cardHdr: { padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 },
  cardIcon: { width: 30, height: 30, borderRadius: '50%', background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: '#c8a84b', flexShrink: 0 },
  cardTitle: { fontSize: 13, fontWeight: 500, color: '#f0ece4' },
  cardSub: { fontSize: 11.5, color: '#8a8070', marginTop: 1 },
  cardBody: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: { background: '#222118', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#f0ece4', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', width: '100%' },
  pillGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  pill: { fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: '#8a8070', cursor: 'pointer', background: '#222118', transition: 'all .12s' },
  pillActive: { background: 'rgba(200,168,75,0.08)', borderColor: 'rgba(200,168,75,0.25)', color: '#c8a84b' },
  pillAddRow: { display: 'flex', gap: 6, marginTop: 4 },
  addBtn: { background: '#2a2820', border: '1px solid rgba(255,255,255,0.12)', color: '#8a8070', borderRadius: 6, padding: '0 12px', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' },
  uploadLabel: { cursor: 'pointer' },
  uploadBtn: { display: 'inline-block', background: '#222118', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#8a8070', fontSize: 12, padding: '9px 14px', cursor: 'pointer' },
  uploadConfirm: { fontSize: 11, color: '#4a9e6a', marginTop: 6, fontFamily: 'monospace' },
  formError: { background: 'rgba(200,90,90,0.08)', border: '1px solid rgba(200,90,90,0.25)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#c85a5a' },
  genBtn: { width: '100%', background: '#c8a84b', color: '#111110', border: 'none', borderRadius: 8, padding: '13px 20px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4 },
  loadCard: { background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '40px 20px', textAlign: 'center', marginBottom: '1.5rem' },
  dots: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#c8a84b', animation: 'pulse 1.4s ease-in-out infinite' },
  loadText: { fontFamily: 'monospace', fontSize: 11, color: '#8a8070' },
  loadSub: { fontSize: 12, color: '#5a5248', marginTop: 4 },
  psLabel: { fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8070' },
  psVal: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#c8a84b' },
  psBarWrap: { flex: 1, minWidth: 80, height: 4, background: '#2a2820', borderRadius: 2, overflow: 'hidden' },
  psBar: { height: '100%', borderRadius: 2, background: '#c8a84b', transition: 'width .5s ease' },
  psTasks: { fontFamily: 'monospace', fontSize: 9, color: '#8a8070', whiteSpace: 'nowrap' },
  probCard: { background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '20px 24px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' },
  probLbl: { fontFamily: 'monospace', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a8070', marginBottom: 4 },
  probNum: { fontFamily: 'Georgia, serif', fontSize: '3.5rem', lineHeight: 1 },
  probBase: { fontFamily: 'monospace', fontSize: 8, color: '#5a5248', marginTop: 4 },
  probDiv: { width: 1, height: 60, background: 'rgba(255,255,255,0.12)', flexShrink: 0 },
  probBarWrap: { height: 6, background: '#2a2820', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  probBar: { height: '100%', borderRadius: 3, transition: 'width .8s ease' },
  probMsg: { fontSize: 12.5, color: '#8a8070', lineHeight: 1.6 },
  caveat: { background: 'rgba(200,90,90,0.08)', border: '1px solid rgba(200,90,90,0.25)', borderRadius: 8, padding: '14px 16px', marginBottom: '1rem', display: 'flex', gap: 10, alignItems: 'flex-start' },
  caveatTag: { fontFamily: 'monospace', fontSize: 8, padding: '2px 6px', borderRadius: 2, background: '#c85a5a', color: '#fff', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1, letterSpacing: '.04em', textTransform: 'uppercase' },
  caveatText: { fontSize: 12.5, color: '#c85a5a', lineHeight: 1.6 },
  phaseBlock: { background: '#1a1916', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem', animation: 'fadeUp .4s forwards' },
  phaseHdr: { padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', gap: 12 },
  phaseIcon: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, fontWeight: 500, flexShrink: 0, marginTop: 1 },
  phaseTitle: { fontSize: 13, fontWeight: 600, color: '#f0ece4', marginBottom: 2 },
  phaseSub: { fontSize: 11.5, color: '#8a8070' },
  phaseBadge: { fontFamily: 'monospace', fontSize: 8, padding: '2px 6px', borderRadius: 2, letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 6, display: 'inline-block' },
  badgeCrit: { background: 'rgba(200,90,90,0.08)', color: '#c85a5a', border: '1px solid rgba(200,90,90,0.25)' },
  badgeHigh: { background: 'rgba(200,136,75,0.08)', color: '#c8884b', border: '1px solid rgba(200,136,75,0.25)' },
  badgeMed: { background: 'rgba(74,126,200,0.08)', color: '#4a7ec8', border: '1px solid rgba(74,126,200,0.25)' },
  taskItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'background .1s' },
  taskDone: { background: 'rgba(74,158,106,0.08)' },
  cb: { width: 18, height: 18, borderRadius: 4, border: '1.5px solid #5a5248', background: 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' },
  cbDone: { background: '#4a9e6a', borderColor: '#4a9e6a' },
  taskMain: { fontSize: 13, fontWeight: 500, color: '#f0ece4', lineHeight: 1.4 },
  taskMainDone: { color: '#4a9e6a', textDecoration: 'line-through', textDecorationColor: 'rgba(74,158,106,.4)' },
  taskDetail: { fontSize: 12, color: '#8a8070', marginTop: 4, lineHeight: 1.55 },
  taskPri: { fontFamily: 'monospace', fontSize: 7.5, padding: '1px 5px', borderRadius: 2, marginLeft: 5, verticalAlign: 'middle', display: 'inline-block' },
  priCrit: { background: 'rgba(200,90,90,0.08)', color: '#c85a5a' },
  priHigh: { background: 'rgba(200,136,75,0.08)', color: '#c8884b' },
  priMed: { background: 'rgba(74,126,200,0.08)', color: '#4a7ec8' },
  taskWeight: { fontFamily: 'monospace', fontSize: 8.5, color: '#5a5248', whiteSpace: 'nowrap', paddingTop: 2, flexShrink: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#1a1916', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '24px 24px 20px', maxWidth: 380, width: '100%' },
  modalTitle: { fontSize: 15, fontWeight: 600, color: '#f0ece4', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#8a8070', lineHeight: 1.6 },
  modalCancel: { flex: 1, background: '#2a2820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#8a8070', fontSize: 13, padding: '9px', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" },
  modalDelete: { flex: 1, background: 'rgba(200,90,90,0.12)', border: '1px solid rgba(200,90,90,0.3)', borderRadius: 6, color: '#c85a5a', fontSize: 13, padding: '9px', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500 },
};
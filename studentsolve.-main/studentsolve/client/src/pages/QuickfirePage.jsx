import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase/firebase.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SUBJECT_TOPICS = {
  'Maths': ['Number','Algebra','Ratio, Proportion & Rates of Change','Geometry & Measures','Probability','Statistics'],
  'Biology': ['Cell Biology','Organisation','Infection & Response','Bioenergetics','Homeostasis & Response','Inheritance, Variation & Evolution','Ecology'],
  'Chemistry': ['Atomic Structure & The Periodic Table','Bonding, Structure & Properties','Quantitative Chemistry','Chemical Changes','Energy Changes','The Rate & Extent of Chemical Change','Organic Chemistry','Chemical Analysis','Chemistry of the Atmosphere','Using Resources'],
  'Physics': ['Energy','Electricity','Particle Model of Matter','Atomic Structure','Forces','Waves','Magnetism & Electromagnetism','Space Physics'],
  'English Language': ['Reading: Fiction','Reading: Non-Fiction','Writing: Narrative','Writing: Descriptive','Writing: Persuasive','Writing: Informative','Spoken Language'],
  'English Literature': ['Shakespeare','19th Century Novel','Modern Prose or Drama','Poetry Anthology','Unseen Poetry'],
  'History': ['Medicine Through Time','Power & The People','Weimar & Nazi Germany','Cold War','Elizabethan England','Norman England','Conflict & Tension'],
  'Geography': ['The Living World','Physical Landscapes in the UK','Urban Issues & Challenges','The Changing Economic World','The Challenge of Resource Management','Tectonic Hazards','Weather Hazards','Climate Change'],
  'Computer Science': ['Fundamentals of Algorithms','Programming','Data Representation','Computer Systems','Computer Networks','Cyber Security','Databases','Impacts of Digital Technology'],
  'Economics': ['Microeconomics','Macroeconomics','Business Economics','International Trade','Financial Markets','Market Failure','Government Intervention'],
  'Psychology': ['Social Influence','Memory','Attachment','Psychopathology','Approaches in Psychology','Biopsychology','Research Methods','Cognition & Development'],
  'Sociology': ['Families & Households','Education','Research Methods','Crime & Deviance','Beliefs in Society','Media','Stratification & Differentiation'],
  'Business': ['Business in the Real World','Influences on Business','Business Operations','Human Resources','Marketing','Finance'],
  'French': ['Identity & Culture','Local Area, Holiday & Travel','School','Future Aspirations, Study & Work','International & Global Dimension','Grammar'],
  'Spanish': ['Identity & Culture','Local Area, Holiday & Travel','School','Future Aspirations, Study & Work','International & Global Dimension','Grammar'],
  'German': ['Identity & Culture','Local Area, Holiday & Travel','School','Future Aspirations, Study & Work','International & Global Dimension','Grammar'],
  'Religious Studies': ['Christian Beliefs','Muslim Beliefs','Christian Practices','Muslim Practices','Relationships & Families','Crime & Punishment','Peace & Conflict','Human Rights & Social Justice'],
  'Philosophy': ['Epistemology','Moral Philosophy','Metaphysics of God','Metaphysics of Mind'],
  'Politics': ['UK Politics','UK Government','Global Politics','US Politics'],
  'Art & Design': ['Developing Ideas','Exploring Media & Materials','Recording Ideas','Presenting Personal Response'],
  'Music': ['Performing','Composing','Listening & Appraising','Musical Elements'],
  'Drama': ['Devising','Texts in Practice','Theatre Makers in Practice'],
  'Physical Education': ['Applied Anatomy & Physiology','Exercise Physiology','Biomechanics','Sport Psychology','Socio-Cultural Influences','Health, Fitness & Wellbeing'],
  'Further Maths': ['Pure Mathematics','Statistics','Mechanics','Decision Mathematics'],
};

const SUBJECT_BOARDS = {
  'Maths': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Biology': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Chemistry': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Physics': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'English Language': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'English Literature': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'History': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Geography': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Computer Science': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Economics': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Psychology': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Sociology': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Business': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'French': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Spanish': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'German': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Religious Studies': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Philosophy': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Politics': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Art & Design': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Music': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Drama': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Physical Education': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Further Maths': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
};

function gradeFromPercent(pct) {
  if (pct >= 90) return { grade: 'A*', color: '#c8a96e' };
  if (pct >= 80) return { grade: 'A', color: '#c8a96e' };
  if (pct >= 70) return { grade: 'B', color: '#7eb87e' };
  if (pct >= 60) return { grade: 'C', color: '#7eb87e' };
  if (pct >= 50) return { grade: 'D', color: '#e09e4a' };
  return { grade: 'U', color: '#e06060' };
}

export default function QuickfirePage() {
  const { user } = useAuth();
  const [sessionSubjects, setSessionSubjects] = useState([]);
  const [practiceModal, setPracticeModal] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addSelected, setAddSelected] = useState(null);
  const [addBoard, setAddBoard] = useState('');
  const [levelChoice, setLevelChoice] = useState('GCSE');
  const [count, setCount] = useState(10);
  const [session, setSession] = useState(null);
  const [mcqSelected, setMcqSelected] = useState(null);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  // Flashcard modal state
  const [flashcardModal, setFlashcardModal] = useState(null);
  const [folders, setFolders] = useState({});
  const [existingSets, setExistingSets] = useState([]); // [{id, title, folder}]
  const [flashcardFolder, setFlashcardFolder] = useState('');
  const [flashcardSet, setFlashcardSet] = useState(''); // existing set id or 'new'
  const [newSetName, setNewSetName] = useState('');
  const [flashcardSaving, setFlashcardSaving] = useState(false);
  const [flashcardSaved, setFlashcardSaved] = useState(false);
  const answerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`userProfile_${user.uid}`);
      if (raw) {
        const profile = JSON.parse(raw);
        const subs = (profile.subjects || []).map(s => ({
          subject: s,
          board: profile.subjectBoards?.[s] || 'AQA',
          level: profile.primaryQualification === 'A-Level' ? 'A-level' : 'GCSE',
        }));
        setSessionSubjects(subs);
      }
      const rawFolders = localStorage.getItem(`folders_${user.uid}`);
      if (rawFolders) setFolders(JSON.parse(rawFolders));
    } catch { setSessionSubjects([]); }
  }, [user]);

  // Auto-save results when session ends
  useEffect(() => {
    if (session && !session.loading && session.currentIndex >= session.questions.length && session.answers.length > 0 && !resultsSaved) {
      setResultsSaved(true);
      saveSessionResults(session);
    }
  }, [session]);

  async function saveSessionResults(sessionData) {
    if (!user) return;
    try {
      await fetch(`${API}/quickfire-progress/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          subject: sessionData.config.subject,
          board: sessionData.config.board,
          level: sessionData.config.level,
          questions: sessionData.questions,
          answers: sessionData.answers,
        }),
      });
    } catch (err) {
      console.error('[Save session error]', err);
    }
  }

  function openPracticeModal(subjectObj) {
    setLevelChoice(subjectObj.level || 'GCSE');
    setCount(10);
    setSelectedTopics([]);
    setPracticeModal(subjectObj);
  }

  function toggleTopic(topic) {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  }

  async function startSession() {
    if (!practiceModal) return;
    const config = { ...practiceModal, level: levelChoice, topics: selectedTopics };
    setPracticeModal(null);
    setMcqSelected(null);
    setExitConfirm(false);
    setResultsSaved(false);
    setSession({ questions: [], currentIndex: 0, answers: [], loading: true, submitting: false, config });
    try {
      const res = await fetch(`${API}/quickfire/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: config.subject,
          board: config.board,
          level: config.level,
          count,
          useAI: false,
          topics: selectedTopics.length > 0 ? selectedTopics : null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const questions = await res.json();
      if (!Array.isArray(questions) || questions.length === 0) { setSession(null); return; }
      setSession(s => ({ ...s, questions, loading: false }));
    } catch (e) {
      console.error(e);
      setSession(null);
    }
  }

  async function submitAnswer() {
    if (!session || session.submitting) return;
    const q = session.questions[session.currentIndex];

    if (q.type === 'mcq') {
      if (!mcqSelected) return;
      setSession(s => ({ ...s, submitting: true }));
      const res = await fetch(`${API}/quickfire/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mcq', studentAnswer: mcqSelected, correctAnswer: q.correctAnswer, explanation: q.explanation }),
      });
      const result = await res.json();
      setSession(s => ({ ...s, submitting: false, answers: [...s.answers, { answer: mcqSelected, result }] }));
      return;
    }

    const answer = answerRef.current?.value?.trim() || '';
    if (!answer) return;
    setSession(s => ({ ...s, submitting: true }));
    try {
      const res = await fetch(`${API}/quickfire/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'short', question: q.question, markScheme: q.markScheme, studentAnswer: answer, marks: q.marks, subject: q.subject, board: q.board }),
      });
      const result = await res.json();
      setSession(s => ({ ...s, submitting: false, answers: [...s.answers, { answer, result }] }));
    } catch {
      setSession(s => ({ ...s, submitting: false, answers: [...s.answers, { answer, result: { marksAwarded: 0, maxMarks: q.marks, feedback: 'Marking failed.', markSchemePoints: [] } }] }));
    }
  }

  function nextQuestion() {
    setMcqSelected(null);
    setSession(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
    if (answerRef.current) answerRef.current.value = '';
  }

  function getCorrectAnswer(q, isMCQ) {
    if (isMCQ) {
      const idx = ['A','B','C','D'].indexOf(q.correctAnswer);
      const opt = q.options?.[idx] || q.correctAnswer;
      return `${q.correctAnswer}) ${opt.replace(/^[A-D]\)\s*/,'')}${q.explanation ? ' — ' + q.explanation : ''}`;
    }
    return (q.markScheme || []).join(' | ');
  }

  async function openFlashcardModal(q, answer) {
    setFlashcardModal({ question: q.question, answer });
    setFlashcardSaved(false);
    setFlashcardSet('');
    setNewSetName('');

    // Load first folder
    const folderKeys = Object.keys(folders);
    const firstFolder = folderKeys[0] || '';
    setFlashcardFolder(firstFolder);

    // Fetch existing flashcard sets for this user
    if (user) {
      try {
        const q2 = query(collection(db, 'flashcards'), where('userId', '==', user.uid));
        const snap = await getDocs(q2);
        const sets = snap.docs.map(d => ({ id: d.id, title: d.data().title || 'Untitled', folder: d.data().folder || '' }));
        setExistingSets(sets);
      } catch {}
    }
  }

  async function saveAsFlashcard() {
    if (!user || !flashcardModal) return;
    setFlashcardSaving(true);
    try {
      if (flashcardSet === 'new') {
        // Create new set
        const title = newSetName.trim() || `${flashcardFolder} — Quickfire`;
        await addDoc(collection(db, 'flashcards'), {
          userId: user.uid,
          title,
          folder: flashcardFolder,
          flashcards: [{ question: flashcardModal.question, answer: flashcardModal.answer }],
          createdAt: serverTimestamp(),
        });
      } else if (flashcardSet) {
        // Add to existing set — fetch it, append, update
        const { updateDoc, doc: firestoreDoc, arrayUnion } = await import('firebase/firestore');
        await updateDoc(firestoreDoc(db, 'flashcards', flashcardSet), {
          flashcards: arrayUnion({ question: flashcardModal.question, answer: flashcardModal.answer }),
        });
      }
      setFlashcardSaved(true);
    } catch (err) {
      console.error(err);
    }
    setFlashcardSaving(false);
  }

  function addSubjectToSession() {
    if (!addSelected || !addBoard) return;
    if (!sessionSubjects.some(s => s.subject === addSelected)) {
      setSessionSubjects(prev => [...prev, { subject: addSelected, board: addBoard, level: 'GCSE' }]);
    }
    setAddModal(false); setAddSelected(null); setAddBoard(''); setAddSearch('');
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (session && !session.loading && session.currentIndex >= session.questions.length && session.answers.length > 0) {
    const totalMarks = session.questions.reduce((s, q) => s + (q.marks || 0), 0);
    const earnedMarks = session.answers.reduce((s, a) => s + (a.result?.marksAwarded || 0), 0);
    const pct = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const { grade, color } = gradeFromPercent(pct);
    const topicMap = {};
    session.questions.forEach((q, i) => {
      const t = q.topic || 'General';
      if (!topicMap[t]) topicMap[t] = { earned: 0, total: 0 };
      topicMap[t].total += q.marks || 0;
      topicMap[t].earned += session.answers[i]?.result?.marksAwarded || 0;
    });
    const sortedTopics = Object.entries(topicMap).sort((a, b) => (a[1].total > 0 ? a[1].earned / a[1].total : 0) - (b[1].total > 0 ? b[1].earned / b[1].total : 0));

    return (
      <div className="page-shell">
        <Sidebar />
        <div className="page-main">
          <div className="page-content" style={{ maxWidth: 640 }}>
            <h1 className="page-title">Session Complete</h1>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 700, color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{grade}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>{earnedMarks} / {totalMarks} marks</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: 4 }}>{pct}%</div>
              <div style={{ marginTop: 20, background: 'var(--bg-surface)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {resultsSaved ? '✓ Results saved to your progress' : 'Saving results…'}
              </div>
            </div>
            {sortedTopics.length > 1 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 600 }}>Topic Breakdown</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 16px' }}>Sorted by weakest first</p>
                {sortedTopics.map(([topic, { earned, total }]) => {
                  const tp = total > 0 ? Math.round((earned / total) * 100) : 0;
                  const barColor = tp >= 70 ? '#7eb87e' : tp >= 50 ? '#e09e4a' : '#e06060';
                  return (
                    <div key={topic} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{topic}</span>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{earned}/{total} · {tp}%</span>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 999, height: 6 }}>
                        <div style={{ height: '100%', width: `${tp}%`, background: barColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
                {sortedTopics[0] && (() => {
                  const [weakest] = sortedTopics[0];
                  return (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(224,96,96,0.08)', border: '1px solid rgba(224,96,96,0.2)', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: '#e06060' }}>
                      Weakest topic: <strong>{weakest}</strong> — focus revision here
                    </div>
                  );
                })()}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => { setSession(null); openPracticeModal(session.config); }}>Practice Again</button>
              <button className="btn btn-secondary" onClick={() => setSession(null)}>Choose Subject</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  if (session) {
    if (session.loading) {
      return (
        <div className="page-shell">
          <Sidebar />
          <div className="page-main">
            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Generating questions from the {session.config?.board} {session.config?.level} {session.config?.subject} spec…
              </p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          </div>
        </div>
      );
    }

    if (session.currentIndex >= session.questions.length) return null;

    const q = session.questions[session.currentIndex];
    const answered = session.answers.length > session.currentIndex;
    const currentAnswer = session.answers[session.currentIndex];
    const earnedSoFar = session.answers.reduce((s, a) => s + (a.result?.marksAwarded || 0), 0);
    const progressPct = session.questions.length > 0 ? (session.currentIndex / session.questions.length) * 100 : 0;
    const isMCQ = q.type === 'mcq';
    const gotWrong = answered && currentAnswer && (currentAnswer.result?.marksAwarded < currentAnswer.result?.maxMarks);

    return (
      <div className="page-shell">
        <Sidebar />
        <div className="page-main">
          <div className="page-content" style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 className="page-title" style={{ marginBottom: 2 }}>{q.subject} · {q.board}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                  Question {session.currentIndex + 1} of {session.questions.length}
                  {session.answers.length > 0 && <span style={{ marginLeft: 12, color: 'var(--accent)' }}>Score: {earnedSoFar}/{session.answers.reduce((s, a) => s + (a.result?.maxMarks || 0), 0)}</span>}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setExitConfirm(true)}>✕ Exit</button>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 999, height: 5, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 999, transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>{q.topic}</span>
                <span style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999 }}>{isMCQ ? 'Multiple Choice' : `${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}`}</span>
                <span style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999 }}>{q.level}</span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>{q.question}</p>
            </div>

            {isMCQ && !answered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {q.options.map((opt, i) => {
                  const letter = ['A', 'B', 'C', 'D'][i];
                  const isSelected = mcqSelected === letter;
                  return (
                    <button key={i} onClick={() => setMcqSelected(letter)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: isSelected ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? 'var(--accent)' : 'var(--bg-surface)', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#0d0d0f' : 'var(--text-muted)' }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: '0.92rem', color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isSelected ? 500 : 400 }}>{opt.replace(/^[A-D]\)\s*/, '')}</span>
                    </button>
                  );
                })}
                <button className="btn btn-primary" style={{ marginTop: 6, alignSelf: 'flex-start', minWidth: 160 }} disabled={!mcqSelected || session.submitting} onClick={submitAnswer}>
                  {session.submitting ? 'Checking…' : 'Submit Answer'}
                </button>
              </div>
            )}

            {!isMCQ && !answered && (
              <>
                <textarea ref={answerRef} placeholder="Write your answer here…"
                  style={{ width: '100%', minHeight: 130, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, padding: '13px 15px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 13 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
                <button className="btn btn-primary" onClick={submitAnswer} disabled={session.submitting} style={{ minWidth: 160 }}>
                  {session.submitting ? 'Marking…' : 'Submit Answer'}
                </button>
              </>
            )}

            {answered && currentAnswer && (
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${currentAnswer.result.marksAwarded >= currentAnswer.result.maxMarks ? 'rgba(126,184,126,0.3)' : currentAnswer.result.marksAwarded > 0 ? 'rgba(200,169,110,0.3)' : 'rgba(224,96,96,0.3)'}`, borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 14 }}>
                {isMCQ && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: '1.8rem' }}>{currentAnswer.result.correct ? '✓' : '✗'}</div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: currentAnswer.result.correct ? '#7eb87e' : '#e06060' }}>{currentAnswer.result.correct ? 'Correct!' : 'Incorrect'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentAnswer.result.correct ? '1/1 mark' : '0/1 marks'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                      {q.options.map((opt, i) => {
                        const letter = ['A', 'B', 'C', 'D'][i];
                        const isCorrect = letter === q.correctAnswer;
                        const wasSelected = currentAnswer.answer === letter;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isCorrect ? 'rgba(126,184,126,0.12)' : wasSelected && !isCorrect ? 'rgba(224,96,96,0.08)' : 'transparent', border: isCorrect ? '1.5px solid rgba(126,184,126,0.4)' : wasSelected && !isCorrect ? '1.5px solid rgba(224,96,96,0.3)' : '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: isCorrect ? '#7eb87e' : wasSelected ? '#e06060' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: isCorrect || wasSelected ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
                              {isCorrect ? '✓' : wasSelected ? '✗' : letter}
                            </div>
                            <span style={{ fontSize: '0.88rem', color: isCorrect ? '#7eb87e' : 'var(--text-secondary)' }}>{opt.replace(/^[A-D]\)\s*/, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                    {currentAnswer.result.feedback && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>{currentAnswer.result.feedback}</p>}
                  </div>
                )}
                {!isMCQ && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: currentAnswer.result.marksAwarded >= currentAnswer.result.maxMarks ? '#7eb87e' : currentAnswer.result.marksAwarded > 0 ? 'var(--accent)' : '#e06060' }}>
                        {currentAnswer.result.marksAwarded}/{currentAnswer.result.maxMarks}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>marks awarded</div>
                    </div>
                    {currentAnswer.result.markSchemePoints?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        {currentAnswer.result.markSchemePoints.map((pt, i) => (
                          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 7 }}>
                            <span style={{ fontSize: '0.9rem', flexShrink: 0, color: pt.awarded ? '#7eb87e' : '#e06060' }}>{pt.awarded ? '✓' : '✗'}</span>
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, opacity: pt.awarded ? 1 : 0.6 }}>{pt.point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {currentAnswer.result.feedback && <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>{currentAnswer.result.feedback}</p>}
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Your answer</summary>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{currentAnswer.answer || '(blank)'}</p>
                    </details>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={nextQuestion}>
                    {session.currentIndex + 1 >= session.questions.length ? 'See Results →' : 'Next Question →'}
                  </button>
                  {gotWrong && (
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '7px 14px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => openFlashcardModal(q, getCorrectAnswer(q, isMCQ))}>
                      Save as flashcard
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exit confirm */}
        {exitConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: 360, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>Exit session?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 24px', lineHeight: 1.5 }}>You've answered {session.answers.length} of {session.questions.length} questions. Progress won't be saved.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setExitConfirm(false)}>Keep going</button>
                <button className="btn btn-primary" style={{ flex: 1, background: '#e06060', borderColor: '#e06060' }} onClick={() => { setExitConfirm(false); setSession(null); }}>Exit</button>
              </div>
            </div>
          </div>
        )}

        {/* Flashcard modal — folder + set picker */}
        {flashcardModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '26px', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Save as Flashcard</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 18px' }}>This question and correct answer will be saved as a flashcard</p>

              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: '10px 13px', marginBottom: 10 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{flashcardModal.question}</p>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: '10px 13px', marginBottom: 20 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Answer</div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{flashcardModal.answer}</p>
              </div>

              {/* Folder picker */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Folder</div>
                {Object.keys(folders).length === 0 ? (
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>No folders. Add subjects in Settings first.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {Object.keys(folders).map(folder => (
                      <button key={folder} onClick={() => { setFlashcardFolder(folder); setFlashcardSet(''); }}
                        style={{ padding: '6px 13px', borderRadius: 'var(--radius)', border: `1.5px solid ${flashcardFolder === folder ? 'var(--accent)' : 'var(--border-subtle)'}`, background: flashcardFolder === folder ? 'var(--accent-dim)' : 'var(--bg-surface)', color: flashcardFolder === folder ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: flashcardFolder === folder ? 600 : 400 }}>
                        {folder}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Set picker */}
              {flashcardFolder && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Set</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {existingSets.filter(s => !s.folder || s.folder === flashcardFolder || s.title.toLowerCase().includes(flashcardFolder.toLowerCase())).map(set => (
                      <button key={set.id} onClick={() => setFlashcardSet(set.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 'var(--radius)', border: `1.5px solid ${flashcardSet === set.id ? 'var(--accent)' : 'var(--border-subtle)'}`, background: flashcardSet === set.id ? 'var(--accent-dim)' : 'var(--bg-surface)', color: flashcardSet === set.id ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.83rem', cursor: 'pointer', fontWeight: flashcardSet === set.id ? 600 : 400, textAlign: 'left' }}>
                        <span style={{ fontSize: '0.9rem' }}>⊟</span> {set.title}
                      </button>
                    ))}
                    <button onClick={() => setFlashcardSet('new')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 'var(--radius)', border: `1.5px dashed ${flashcardSet === 'new' ? 'var(--accent)' : 'var(--border-subtle)'}`, background: flashcardSet === 'new' ? 'var(--accent-dim)' : 'transparent', color: flashcardSet === 'new' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.83rem', cursor: 'pointer', fontWeight: flashcardSet === 'new' ? 600 : 400, textAlign: 'left' }}>
                      <span>+</span> Create new set
                    </button>
                    {flashcardSet === 'new' && (
                      <input type="text" placeholder="Set name…" value={newSetName} onChange={e => setNewSetName(e.target.value)}
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '8px 12px', outline: 'none' }} />
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                {flashcardSaved ? (
                  <div style={{ flex: 1, textAlign: 'center', padding: '10px', color: '#7eb87e', fontWeight: 600, fontSize: '0.88rem' }}>✓ Saved!</div>
                ) : (
                  <button className="btn btn-primary" style={{ flex: 1 }}
                    disabled={!flashcardFolder || !flashcardSet || (flashcardSet === 'new' && !newSetName.trim()) || flashcardSaving}
                    onClick={saveAsFlashcard}>
                    {flashcardSaving ? 'Saving…' : 'Save flashcard'}
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setFlashcardModal(null)}>{flashcardSaved ? 'Close' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Subject cards ─────────────────────────────────────────────────────────
  const filteredAddSubjects = Object.keys(SUBJECT_BOARDS).filter(s => s.toLowerCase().includes(addSearch.toLowerCase()));

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content">
          <h1 className="page-title">Exam Quickfire</h1>
          <p className="page-subtitle">Answer past-paper style questions and get instant AI marking</p>

          {sessionSubjects.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '40px 32px', textAlign: 'center', maxWidth: 440, marginTop: 24 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No subjects in your profile. Add subjects in Settings, or add one for this session.</p>
              <button className="btn btn-primary" onClick={() => setAddModal(true)}>Add a Subject</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
              {sessionSubjects.map(s => (
                <div key={s.subject}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 20px 16px', transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 10 }}>{s.subject}</div>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', borderRadius: 999 }}>{s.board}</span>
                    <span style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '2px 9px', borderRadius: 999 }}>{s.level || 'GCSE'}</span>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '9px 0' }} onClick={() => openPracticeModal(s)}>Practice →</button>
                </div>
              ))}
              <div style={{ background: 'var(--bg-card)', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                onClick={() => setAddModal(true)}>
                <span style={{ fontSize: '1.6rem', color: 'var(--text-muted)', marginBottom: 6 }}>+</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Add subject</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Practice modal */}
      {practiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setPracticeModal(null); }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 700 }}>{practiceModal.subject}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: '0 0 24px' }}>{practiceModal.board}</p>

            {/* Level */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</div>
              <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: 3, border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
                {['GCSE', 'A-level'].map(lv => (
                  <button key={lv} onClick={() => setLevelChoice(lv)}
                    style={{ padding: '7px 20px', borderRadius: 'calc(var(--radius) - 2px)', fontSize: '0.84rem', fontWeight: levelChoice === lv ? 600 : 400, background: levelChoice === lv ? 'var(--bg-card)' : 'transparent', color: levelChoice === lv ? 'var(--text-primary)' : 'var(--text-muted)', border: levelChoice === lv ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics */}
            {SUBJECT_TOPICS[practiceModal.subject] && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Topics {selectedTopics.length > 0 ? `(${selectedTopics.length} selected)` : '— all topics'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SUBJECT_TOPICS[practiceModal.subject].map(topic => {
                    const active = selectedTopics.includes(topic);
                    return (
                      <button key={topic} onClick={() => toggleTopic(topic)}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, background: active ? 'var(--accent-dim)' : 'var(--bg-surface)', color: active ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                        {topic}
                      </button>
                    );
                  })}
                </div>
                {selectedTopics.length > 0 && (
                  <button onClick={() => setSelectedTopics([])} style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear — use all topics
                  </button>
                )}
              </div>
            )}

            {/* Question count */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions: {count}</div>
              <input type="range" min={5} max={100} step={5} value={count} onChange={e => setCount(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 6, accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>5</span><span>100</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={startSession}>Start Practice</button>
              <button className="btn btn-ghost" onClick={() => setPracticeModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add subject modal */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setAddModal(false); setAddSelected(null); setAddBoard(''); setAddSearch(''); } }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '26px', width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 3px', fontSize: '1.05rem', fontWeight: 700 }}>Add a subject</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 14px' }}>Session only — won't affect your profile</p>
            <input type="text" placeholder="Search subjects…" value={addSearch} onChange={e => setAddSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '9px 13px', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 7, marginBottom: 14 }}>
              {filteredAddSubjects.map(s => (
                <button key={s} onClick={() => { setAddSelected(s); setAddBoard(SUBJECT_BOARDS[s][0]); }}
                  style={{ background: addSelected === s ? 'var(--accent-dim)' : 'var(--bg-surface)', border: addSelected === s ? '1px solid var(--accent)' : '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: addSelected === s ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.8rem', padding: '9px 10px', cursor: 'pointer', textAlign: 'left', fontWeight: addSelected === s ? 600 : 400 }}>
                  {s}
                </button>
              ))}
            </div>
            {addSelected && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Board for {addSelected}</div>
                <select value={addBoard} onChange={e => setAddBoard(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '8px 11px', outline: 'none' }}>
                  {SUBJECT_BOARDS[addSelected].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={!addSelected || !addBoard} style={{ flex: 1 }} onClick={addSubjectToSession}>Add to session</button>
              <button className="btn btn-ghost" onClick={() => { setAddModal(false); setAddSelected(null); setAddBoard(''); setAddSearch(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
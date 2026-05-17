import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days) {
  if (days === null) return 'var(--text-muted)';
  if (days <= 7) return '#e06060';
  if (days <= 21) return '#e09e4a';
  return '#7eb87e';
}

export default function RevisionTimetablePage() {
  const { user } = useAuth();
  const printRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [examDates, setExamDates] = useState({});
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [activeTab, setActiveTab] = useState('setup');

  // Custom slots: [{ id, label, days: ['Mon','Tue'...], startTime, duration }]
  const [customSlots, setCustomSlots] = useState([]);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ label: '', days: [], startTime: '09:00', duration: '1h' });

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`userProfile_${user.uid}`);
      if (raw) setProfile(JSON.parse(raw));

      const savedDates = localStorage.getItem(`examDates_${user.uid}`);
      if (savedDates) setExamDates(JSON.parse(savedDates));

      const savedTimetable = localStorage.getItem(`timetable_${user.uid}`);
      if (savedTimetable) {
        setTimetable(JSON.parse(savedTimetable));
        setActiveTab('timetable');
      }

      const savedSlots = localStorage.getItem(`customSlots_${user.uid}`);
      if (savedSlots) setCustomSlots(JSON.parse(savedSlots));
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/quickfire-progress/${user.uid}`)
      .then(r => r.json())
      .then(data => { if (data.topicProgress) setProgress(data.topicProgress); })
      .catch(() => {});
  }, [user]);

  function saveExamDate(subject, date) {
    const updated = { ...examDates, [subject]: date };
    setExamDates(updated);
    localStorage.setItem(`examDates_${user.uid}`, JSON.stringify(updated));
  }

  function toggleDay(day) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function toggleNewSlotDay(day) {
    setNewSlot(s => ({
      ...s,
      days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day],
    }));
  }

  function addCustomSlot() {
    if (!newSlot.label.trim() || newSlot.days.length === 0) return;
    const slot = { ...newSlot, id: Date.now() };
    const updated = [...customSlots, slot];
    setCustomSlots(updated);
    localStorage.setItem(`customSlots_${user.uid}`, JSON.stringify(updated));
    setNewSlot({ label: '', days: [], startTime: '09:00', duration: '1h' });
    setAddingSlot(false);
  }

  function removeCustomSlot(id) {
    const updated = customSlots.filter(s => s.id !== id);
    setCustomSlots(updated);
    localStorage.setItem(`customSlots_${user.uid}`, JSON.stringify(updated));
  }

  async function generateTimetable() {
    if (!profile || !user) return;
    setLoading(true);

    const subjects = profile.subjects || [];
    const weakTopics = Object.values(progress)
      .filter(t => t.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 10)
      .map(t => ({ subject: t.subject, topic: t.topic, percentage: t.percentage }));

    const subjectInfo = subjects.map(s => ({
      subject: s,
      board: profile.subjectBoards?.[s] || '',
      examDate: examDates[s] || null,
      daysUntil: getDaysUntil(examDates[s]),
      weakTopics: weakTopics.filter(t => t.subject === s),
    }));

    try {
      const res = await fetch(`${API}/revision-timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          subjects: subjectInfo,
          hoursPerDay,
          studyDays: selectedDays,
          weakTopics,
          qualification: profile.primaryQualification || 'GCSE',
          customSlots,
        }),
      });

      const data = await res.json();
      if (data.timetable) {
        setTimetable(data.timetable);
        localStorage.setItem(`timetable_${user.uid}`, JSON.stringify(data.timetable));
        setActiveTab('timetable');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Revision Timetable — StudentSolve</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 32px; color: #111; background: #fff; }
            h1 { font-size: 1.4rem; margin-bottom: 4px; }
            p { color: #666; font-size: 0.85rem; margin-bottom: 24px; }
            .week { margin-bottom: 24px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .week-header { background: #f5f5f5; padding: 10px 16px; font-weight: 600; font-size: 0.88rem; display: flex; justify-content: space-between; }
            .week-body { padding: 12px 16px; }
            .day-row { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
            .day-label { min-width: 36px; font-size: 0.75rem; font-weight: 600; color: #888; padding-top: 4px; }
            .sessions { display: flex; gap: 8px; flex-wrap: wrap; }
            .session { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px 10px; font-size: 0.78rem; }
            .session-subject { font-weight: 600; margin-bottom: 2px; }
            .session-topic { color: #666; font-size: 0.72rem; }
            .custom-tag { background: #e8f0fe; border-color: #c5d8f6; }
            .summary { margin-top: 20px; padding: 14px 16px; background: #f9f9f9; border-radius: 8px; font-size: 0.85rem; color: #444; line-height: 1.6; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  const subjects = profile?.subjects || [];

  // Build printable content
  const printableContent = timetable ? (
    <div>
      <h1>Revision Timetable</h1>
      <p>Generated by StudentSolve</p>
      {timetable.weeks?.map((week, wi) => (
        <div key={wi} className="week">
          <div className="week-header">
            <span>Week {wi + 1}</span>
            <span>{week.dateRange}</span>
          </div>
          <div className="week-body">
            {week.days?.map((day, di) => (
              <div key={di} className="day-row">
                <div className="day-label">{day.day}</div>
                <div className="sessions">
                  {/* Custom slots for this day */}
                  {customSlots.filter(s => s.days.includes(day.day)).map(slot => (
                    <div key={slot.id} className="session custom-tag">
                      <div className="session-subject">{slot.label}</div>
                      <div className="session-topic">{slot.startTime} · {slot.duration}</div>
                    </div>
                  ))}
                  {day.sessions?.map((session, si) => (
                    <div key={si} className="session">
                      <div className="session-subject">{session.subject}</div>
                      <div className="session-topic">{session.topic} · {session.duration}</div>
                    </div>
                  ))}
                  {(!day.sessions || day.sessions.length === 0) && customSlots.filter(s => s.days.includes(day.day)).length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>Rest day</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {timetable.summary && (
        <div className="summary"><strong>AI Recommendations:</strong> {timetable.summary}</div>
      )}
    </div>
  ) : null;

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content" style={{ maxWidth: 800 }}>
          <h1 className="page-title">Revision Timetable</h1>
          <p className="page-subtitle">AI-generated revision plan based on your exam dates and weak topics</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: 3, border: '1px solid var(--border-subtle)', width: 'fit-content', marginBottom: 28, marginTop: 8 }}>
            {['setup', 'timetable'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '7px 20px', borderRadius: 'calc(var(--radius) - 2px)', fontSize: '0.84rem', fontWeight: activeTab === tab ? 600 : 400, background: activeTab === tab ? 'var(--bg-card)' : 'transparent', color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)', border: activeTab === tab ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
                {tab === 'setup' ? 'Setup' : 'My Timetable'}
              </button>
            ))}
          </div>

          {/* ── SETUP TAB ── */}
          {activeTab === 'setup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Exam dates */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>Exam Dates</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 16px' }}>Add your exam dates so we can prioritise subjects running out of time</p>
                {subjects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subjects found. Add subjects in Settings first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {subjects.map(subject => {
                      const date = examDates[subject] || '';
                      const days = getDaysUntil(date);
                      return (
                        <div key={subject} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 160, fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{subject}</div>
                          <input type="date" value={date} onChange={e => saveExamDate(subject, e.target.value)}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '6px 10px', outline: 'none' }} />
                          {days !== null && (
                            <span style={{ fontSize: '0.78rem', color: getUrgencyColor(days), fontWeight: 600 }}>
                              {days <= 0 ? 'Exam passed' : `${days} days`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom slots */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>Fixed Commitments</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 16px' }}>Add recurring commitments so the timetable works around them — school, sports, volunteering, etc.</p>

                {customSlots.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {customSlots.map(slot => (
                      <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: '9px 12px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{slot.label}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                            {slot.days.join(', ')} · {slot.startTime} · {slot.duration}
                          </span>
                        </div>
                        <button onClick={() => removeCustomSlot(slot.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 6px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {addingSlot ? (
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. School, Football, Volunteering)"
                      value={newSlot.label}
                      onChange={e => setNewSlot(s => ({ ...s, label: e.target.value }))}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '8px 12px', outline: 'none' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 7 }}>Days</div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {DAYS.map(day => {
                          const active = newSlot.days.includes(day);
                          return (
                            <button key={day} onClick={() => toggleNewSlotDay(day)}
                              style={{ padding: '5px 12px', borderRadius: 'var(--radius)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, background: active ? 'var(--accent-dim)' : 'var(--bg-card)', color: active ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: active ? 600 : 400 }}>
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>Start time</div>
                        <input type="time" value={newSlot.startTime} onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))}
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '6px 10px', outline: 'none', width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>Duration</div>
                        <select value={newSlot.duration} onChange={e => setNewSlot(s => ({ ...s, duration: e.target.value }))}
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '6px 10px', outline: 'none', width: '100%' }}>
                          {['30min','45min','1h','1.5h','2h','3h','4h','6h','8h'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px' }} onClick={addCustomSlot} disabled={!newSlot.label.trim() || newSlot.days.length === 0}>Add</button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => { setAddingSlot(false); setNewSlot({ label: '', days: [], startTime: '09:00', duration: '1h' }); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-ghost" style={{ fontSize: '0.82rem', border: '1px dashed var(--border-subtle)' }} onClick={() => setAddingSlot(true)}>
                    + Add commitment
                  </button>
                )}
              </div>

              {/* Study preferences */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600 }}>Study Preferences</h3>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Hours per day: {hoursPerDay}h</div>
                  <input type="range" min={1} max={8} step={0.5} value={hoursPerDay}
                    onChange={e => setHoursPerDay(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>1h</span><span>8h</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>Study days</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DAYS.map(day => {
                      const active = selectedDays.includes(day);
                      return (
                        <button key={day} onClick={() => toggleDay(day)}
                          style={{ padding: '7px 14px', borderRadius: 'var(--radius)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, background: active ? 'var(--accent-dim)' : 'var(--bg-surface)', color: active ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: active ? 600 : 400, cursor: 'pointer' }}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weak topics */}
              {Object.keys(progress).length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>Weak Topics Detected</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 14px' }}>These will be prioritised in your timetable</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.values(progress).filter(t => t.percentage < 60).sort((a, b) => a.percentage - b.percentage).slice(0, 6).map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{t.subject} → {t.topic}</span>
                        <span style={{ fontSize: '0.78rem', color: t.percentage < 40 ? '#e06060' : '#e09e4a', fontWeight: 600 }}>{t.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={generateTimetable}
                disabled={loading || subjects.length === 0 || selectedDays.length === 0}
                style={{ alignSelf: 'flex-start', minWidth: 220, padding: '12px 24px', fontSize: '0.95rem' }}>
                {loading ? 'Generating timetable…' : 'Generate My Timetable'}
              </button>
            </div>
          )}

          {/* ── TIMETABLE TAB ── */}
          {activeTab === 'timetable' && (
            <div>
              {!timetable ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No timetable yet. Set up your exam dates and generate one.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('setup')}>Set up timetable</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={handlePrint}>Print / Save PDF</button>
                    <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => setActiveTab('setup')}>Edit & Regenerate</button>
                  </div>

                  {/* Hidden print content */}
                  <div ref={printRef} style={{ display: 'none' }}>{printableContent}</div>

                  {timetable.weeks?.map((week, wi) => (
                    <div key={wi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Week {wi + 1}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{week.dateRange}</span>
                      </div>
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {week.days?.map((day, di) => (
                          <div key={di} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 36, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', paddingTop: 3 }}>{day.day}</div>
                            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {/* Custom slots shown inline */}
                              {customSlots.filter(s => s.days.includes(day.day)).map(slot => (
                                <div key={slot.id} style={{ background: 'rgba(100,120,200,0.08)', border: '1px solid rgba(100,120,200,0.2)', borderRadius: 'var(--radius)', padding: '7px 12px', fontSize: '0.8rem' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{slot.label}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>{slot.startTime} · {slot.duration}</div>
                                </div>
                              ))}
                              {day.sessions?.map((session, si) => (
                                <div key={si} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '7px 12px', fontSize: '0.8rem' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{session.subject}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>{session.topic} · {session.duration}</div>
                                </div>
                              ))}
                              {(!day.sessions || day.sessions.length === 0) && customSlots.filter(s => s.days.includes(day.day)).length === 0 && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Rest day</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {timetable.summary && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 22px' }}>
                      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 600 }}>AI Recommendations</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{timetable.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
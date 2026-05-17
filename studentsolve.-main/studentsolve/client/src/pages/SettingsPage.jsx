import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserProfile, saveUserProfile } from '../firebase/firestore.js';

// ── Same subject/board data as OnboardingPage ──────────────────────────────
const GCSE_SUBJECT_BOARDS = {
  'Maths': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Further Maths': ['AQA', 'CCEA', "I'm not sure"],
  'Statistics': ['AQA', 'Edexcel', 'CCEA', "I'm not sure"],
  'English Language': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'English Literature': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Biology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Chemistry': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Physics': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Combined Science': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Environmental Science': ['AQA', 'OCR', "I'm not sure"],
  'Geology': ['WJEC / Eduqas', "I'm not sure"],
  'Astronomy': ['Edexcel', "I'm not sure"],
  'Applied Science': ['BTEC / Pearson', 'OCR', "I'm not sure"],
  'History': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Geography': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Religious Studies': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Philosophy': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Classical Civilisation': ['OCR', 'Edexcel', "I'm not sure"],
  'Ancient History': ['OCR', 'Edexcel', "I'm not sure"],
  'Archaeology': ['OCR', "I'm not sure"],
  'History of Art': ['AQA', 'OCR', "I'm not sure"],
  'Economics': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Business': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Accounting': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Politics': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Government & Politics': ['AQA', 'Edexcel', "I'm not sure"],
  'Law': ['AQA', 'OCR', "I'm not sure"],
  'Sociology': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Psychology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Citizenship': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Health & Social Care': ['BTEC / Pearson', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'French': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Spanish': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'German': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Italian': ['AQA', 'Edexcel', "I'm not sure"],
  'Mandarin Chinese': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Arabic': ['AQA', 'Edexcel', "I'm not sure"],
  'Japanese': ['AQA', 'Edexcel', "I'm not sure"],
  'Russian': ['AQA', 'Edexcel', "I'm not sure"],
  'Polish': ['AQA', "I'm not sure"],
  'Portuguese': ['Edexcel', "I'm not sure"],
  'Persian': ['AQA', 'Edexcel', "I'm not sure"],
  'Modern Greek': ['AQA', 'Edexcel', "I'm not sure"],
  'Urdu': ['AQA', 'Edexcel', "I'm not sure"],
  'Bengali': ['AQA', "I'm not sure"],
  'Gujarati': ['AQA', "I'm not sure"],
  'Hindi': ['AQA', "I'm not sure"],
  'Panjabi': ['AQA', "I'm not sure"],
  'Latin': ['OCR', 'Edexcel', "I'm not sure"],
  'Classical Greek': ['OCR', "I'm not sure"],
  'Computer Science': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'ICT': ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Design & Technology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Product Design': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Engineering': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Electronics': ['WJEC / Eduqas', "I'm not sure"],
  'Electronic Products': ['AQA', "I'm not sure"],
  'Food Preparation & Nutrition': ['AQA', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Food Technology': ['AQA', 'OCR', "I'm not sure"],
  'Nutrition & Food Science': ['AQA', 'OCR', "I'm not sure"],
  'Art & Design': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Fine Art': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Design': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Communication': ['AQA', "I'm not sure"],
  'Photography': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Textile Design': ['AQA', 'Edexcel', "I'm not sure"],
  'Textiles': ['AQA', 'OCR', "I'm not sure"],
  '3D Design': ['AQA', "I'm not sure"],
  'Architecture': ['AQA', 'Edexcel', "I'm not sure"],
  'Music': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Music Technology': ['AQA', 'Edexcel', "I'm not sure"],
  'Drama': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Drama & Theatre': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Dance': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Film Studies': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Media Studies': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Physical Education': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Sport Science': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
};

const IGCSE_SUBJECT_BOARDS = {
  'Maths': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Additional Maths': ['Cambridge International (CIE)', "I'm not sure"],
  'Maths B': ['Edexcel', "I'm not sure"],
  'English Language': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'English Language B': ['Edexcel', "I'm not sure"],
  'English Literature': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'First Language English': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Chinese': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Spanish': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language French': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Arabic': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language German': ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Portuguese': ['Cambridge International (CIE)', "I'm not sure"],
  'Biology': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Chemistry': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Physics': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Combined Science': ['Cambridge International (CIE)', "I'm not sure"],
  'Double Award Science': ['Edexcel', "I'm not sure"],
  'Human Biology': ['Edexcel', "I'm not sure"],
  'Environmental Management': ['Cambridge International (CIE)', "I'm not sure"],
  'History': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Geography': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Business Studies': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Economics': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Accounting': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Religious Studies': ['Cambridge International (CIE)', "I'm not sure"],
  'Sociology': ['Cambridge International (CIE)', "I'm not sure"],
  'Travel & Tourism': ['Cambridge International (CIE)', "I'm not sure"],
  'Global Perspectives': ['Cambridge International (CIE)', "I'm not sure"],
  'Computer Science': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'ICT': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Design & Technology': ['Cambridge International (CIE)', "I'm not sure"],
  'Food & Nutrition': ['Cambridge International (CIE)', "I'm not sure"],
  'Art & Design': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Music': ['Cambridge International (CIE)', "I'm not sure"],
  'Drama': ['Cambridge International (CIE)', "I'm not sure"],
  'Physical Education': ['Cambridge International (CIE)', "I'm not sure"],
  'French': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Spanish': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'German': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Italian': ['Cambridge International (CIE)', "I'm not sure"],
  'Dutch': ['Cambridge International (CIE)', "I'm not sure"],
  'Greek': ['Cambridge International (CIE)', "I'm not sure"],
  'Latin': ['Cambridge International (CIE)', "I'm not sure"],
  'Russian': ['Cambridge International (CIE)', "I'm not sure"],
  'Turkish': ['Cambridge International (CIE)', "I'm not sure"],
  'Portuguese': ['Cambridge International (CIE)', "I'm not sure"],
  'Arabic': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Chinese (Mandarin)': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Japanese': ['Cambridge International (CIE)', "I'm not sure"],
  'Urdu': ['Cambridge International (CIE)', "I'm not sure"],
  'Hindi': ['Cambridge International (CIE)', "I'm not sure"],
  'Malay': ['Cambridge International (CIE)', "I'm not sure"],
  'Indonesian': ['Cambridge International (CIE)', "I'm not sure"],
  'Afrikaans': ['Cambridge International (CIE)', "I'm not sure"],
  'Bengali': ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Gujarati': ['Cambridge International (CIE)', "I'm not sure"],
  'Panjabi': ['Cambridge International (CIE)', "I'm not sure"],
  'Tamil': ['Cambridge International (CIE)', "I'm not sure"],
  'Swahili': ['Cambridge International (CIE)', "I'm not sure"],
};

const ALEVEL_SUBJECT_BOARDS = {
  'Maths': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Further Maths': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Statistics': ['Edexcel', "I'm not sure"],
  'Biology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Chemistry': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Physics': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Environmental Science': ['AQA', "I'm not sure"],
  'Geology': ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'English Language': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'English Literature': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'English Language & Literature': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'History': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Geography': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Religious Studies': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Philosophy': ['AQA', "I'm not sure"],
  'Classical Civilisation': ['OCR', "I'm not sure"],
  'Ancient History': ['OCR', "I'm not sure"],
  'History of Art': ['Edexcel', "I'm not sure"],
  'Economics': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Business': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Accounting': ['AQA', "I'm not sure"],
  'Politics': ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Government & Politics': ['AQA', 'Edexcel', 'WJEC / Eduqas', "I'm not sure"],
  'Law': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Sociology': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Psychology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Computer Science': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'ICT': ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Design & Technology': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Product Design': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Electronics': ['WJEC / Eduqas', "I'm not sure"],
  'Engineering': ['AQA', "I'm not sure"],
  'Nutrition & Food Science': ['CCEA', "I'm not sure"],
  'Digital Technology': ['CCEA', "I'm not sure"],
  'Software Systems Development': ['CCEA', "I'm not sure"],
  'Art & Design': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Fine Art': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Design': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Communication': ['AQA', "I'm not sure"],
  'Photography': ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Textile Design': ['AQA', "I'm not sure"],
  'Textiles': ['AQA', 'OCR', "I'm not sure"],
  '3D Design': ['AQA', "I'm not sure"],
  'Architecture': ['AQA', 'Edexcel', "I'm not sure"],
  'Music': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Music Technology': ['Edexcel', "I'm not sure"],
  'Drama & Theatre': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Dance': ['AQA', "I'm not sure"],
  'Film Studies': ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Media Studies': ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Moving Image Arts': ['CCEA', "I'm not sure"],
  'Performing Arts': ['CCEA', "I'm not sure"],
  'Physical Education': ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Sport Science': ['CCEA', "I'm not sure"],
  'French': ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Spanish': ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'German': ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Italian': ['Edexcel', "I'm not sure"],
  'Mandarin Chinese': ['Edexcel', "I'm not sure"],
  'Arabic': ['Edexcel', "I'm not sure"],
  'Japanese': ['Edexcel', "I'm not sure"],
  'Russian': ['Edexcel', "I'm not sure"],
  'Portuguese': ['Edexcel', "I'm not sure"],
  'Polish': ['AQA', "I'm not sure"],
  'Persian': ['Edexcel', "I'm not sure"],
  'Modern Greek': ['Edexcel', "I'm not sure"],
  'Urdu': ['Edexcel', "I'm not sure"],
  'Bengali': ['AQA', "I'm not sure"],
  'Gujarati': ['Edexcel', "I'm not sure"],
  'Panjabi': ['AQA', "I'm not sure"],
  'Turkish': ['Edexcel', "I'm not sure"],
  'Hebrew (Modern)': ['AQA', "I'm not sure"],
  'Latin': ['OCR', "I'm not sure"],
  'Classical Greek': ['OCR', "I'm not sure"],
  'Health and Social Care': ['CCEA', "I'm not sure"],
};

const GCSE_SUBJECTS = Object.keys(GCSE_SUBJECT_BOARDS);
const IGCSE_SUBJECTS = Object.keys(IGCSE_SUBJECT_BOARDS);
const ALEVEL_SUBJECTS = Object.keys(ALEVEL_SUBJECT_BOARDS);

const YEAR_OPTIONS = [
  { value: 'year9', label: 'Year 9' },
  { value: 'year10', label: 'Year 10' },
  { value: 'year11', label: 'Year 11' },
  { value: 'year12', label: 'Year 12' },
  { value: 'year13', label: 'Year 13' },
  { value: 'university', label: 'University' },
  { value: 'professional', label: 'Professional / self-study' },
  { value: 'other', label: 'Other' },
];

function getSubjectData(quals) {
  if (!quals || quals.length === 0) return { subjects: GCSE_SUBJECTS, boards: GCSE_SUBJECT_BOARDS };
  if (quals.includes('IGCSE')) return { subjects: IGCSE_SUBJECTS, boards: IGCSE_SUBJECT_BOARDS };
  if (quals.includes('A-Level') || quals.includes('AS-Level')) return { subjects: ALEVEL_SUBJECTS, boards: ALEVEL_SUBJECT_BOARDS };
  return { subjects: GCSE_SUBJECTS, boards: GCSE_SUBJECT_BOARDS };
}

function BoardPicker({ boards, onSelect, onClose, anchorRect }) {
  if (!anchorRect) return null;
  return (
    <div style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, width: anchorRect.width, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', zIndex: 9999, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px 6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>Exam board</div>
      {boards.map(b => (
        <button key={b} onClick={() => onSelect(b)}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.83rem', background: 'none', border: 'none', color: b === "I'm not sure" ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer', fontStyle: b === "I'm not sure" ? 'italic' : 'normal' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{b}</button>
      ))}
      <button onClick={onClose} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: '0.78rem', background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>✕ Cancel</button>
    </div>
  );
}


export default function SettingsPage() {
  const { user } = useAuth();
  const initial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [yearGroup, setYearGroup] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState({}); // { subject: board }
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [search, setSearch] = useState('');
  const [otherInputs, setOtherInputs] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then(data => {
        setProfile(data);
        if (data) initEditState(data);
      })
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  }, [user]);

  function initEditState(data) {
    setYearGroup(data.yearGroup || '');
    // Build selectedSubjects map from existing subjects + boards
    const map = {};
    (data.subjects || []).forEach(s => {
      map[s] = data.subjectBoards?.[s] || "I'm not sure";
    });
    setSelectedSubjects(map);
    // Separate known from other
    const { subjects: knownList } = getSubjectData(data.qualifications);
    const others = (data.subjects || []).filter(s => !knownList.includes(s));
    setOtherInputs(others.length > 0 ? others : ['']);
  }

function handleSubjectClick(subject, e) {
  if (selectedSubjects[subject] !== undefined) {
    setSelectedSubjects(prev => { const c = { ...prev }; delete c[subject]; return c; });
  } else {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setHoveredSubject(subject);
  }
}

  function selectBoard(subject, board) {
    setSelectedSubjects(prev => ({ ...prev, [subject]: board }));
    setHoveredSubject(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);

    const extras = otherInputs.map(s => s.trim()).filter(Boolean);
    const newSubjectNames = [...Object.keys(selectedSubjects), ...extras];
    const oldSubjectNames = profile?.subjects || [];
    const added = newSubjectNames.filter(s => !oldSubjectNames.includes(s));

    // Only create folders for newly added subjects
    const existingFolders = JSON.parse(localStorage.getItem(`folders_${user.uid}`) || '{}');
    added.forEach(s => { if (!existingFolders[s]) existingFolders[s] = []; });
    localStorage.setItem(`folders_${user.uid}`, JSON.stringify(existingFolders));

    const primaryQual = (profile?.qualifications || []).includes('IGCSE') ? 'IGCSE'
      : ((profile?.qualifications || []).includes('A-Level') || (profile?.qualifications || []).includes('AS-Level')) ? 'A-Level'
      : 'GCSE';

    const profileData = {
      yearGroup,
      subjects: newSubjectNames,
      subjectBoards: { ...selectedSubjects },
      primaryQualification: primaryQual,
    };

    await saveUserProfile(user.uid, profileData);
    localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify({ ...profile, ...profileData }));

    setProfile(prev => ({ ...prev, ...profileData }));
    setSaving(false);
    setSaveSuccess(true);
    setEditing(false);
    setTimeout(() => setSaveSuccess(false), 4000);
  }

  const { subjects: subjectList, boards: boardMap } = getSubjectData(profile?.qualifications);
  const filteredSubjects = search.trim()
    ? subjectList.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : subjectList;

  function yearLabel(val) {
    return YEAR_OPTIONS.find(o => o.value === val)?.label || val;
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-main">
        <div className="page-content" style={{ maxWidth: 700 }}>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Your account and study preferences</p>

          {saveSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
              Profile saved — new folders added, removed folders moved to bin ✓
            </div>
          )}

          {/* Account card */}
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(200,169,110,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: 'var(--accent)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                {initial}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{user?.displayName || 'User'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>User ID</div>
                <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '5px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block', wordBreak: 'break-all' }}>{user?.uid}</code>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Email verified</div>
                <span style={{ fontSize: '0.875rem', color: user?.emailVerified ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {user?.emailVerified ? '✓ Verified' : '✗ Not verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Study profile card */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 3 }}>Study Profile</h2>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Your year group and subjects</p>
              </div>
              {!editing && profile && (
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 16px' }} onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>

            {loadingProfile ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading…</p>
            ) : !profile?.yearGroup ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>No study profile yet.</p>
                <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setEditing(true)}>Set up study profile</button>
              </div>
            ) : !editing ? (
              /* Read-only */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div className="form-label" style={{ marginBottom: 8 }}>Year group</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 'var(--radius)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {yearLabel(profile.yearGroup)}
                  </div>
                </div>
                <div>
                  <div className="form-label" style={{ marginBottom: 10 }}>Subjects ({profile.subjects?.length || 0})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(profile.subjects || []).map(s => (
                      <span key={s} style={{ padding: '5px 12px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {s}{profile.subjectBoards?.[s] && profile.subjectBoards[s] !== "I'm not sure" ? ` · ${profile.subjectBoards[s]}` : ''}
                      </span>
                    ))}
                    {(!profile.subjects || profile.subjects.length === 0) && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No subjects added</span>}
                  </div>
                </div>
              </div>
            ) : (
              /* Edit mode */
              <div>
                {/* Year group */}
                <div style={{ marginBottom: 24 }}>
                  <div className="form-label" style={{ marginBottom: 10 }}>Year group</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {YEAR_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setYearGroup(opt.value)}
                        style={{ padding: '7px 14px', borderRadius: 'var(--radius)', border: `1.5px solid ${yearGroup === opt.value ? 'var(--accent)' : 'var(--border-subtle)'}`, background: yearGroup === opt.value ? 'var(--accent-dim)' : 'var(--bg-elevated)', color: yearGroup === opt.value ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: yearGroup === opt.value ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects…" style={{ paddingLeft: 36 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>🔍</span>
                </div>

                {/* Subject grid */}
                <div style={{ marginBottom: 20 }}>
                  <div className="form-label" style={{ marginBottom: 10 }}>
                    Subjects — tick all that apply
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      (unticking moves folder to bin · ticking creates a new folder)
                    </span>
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto', padding: '2px' }} onScroll={() => { setHoveredSubject(null); setAnchorRect(null); }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 7 }}>
                      {filteredSubjects.map(subject => {
                        const isSelected = subject in selectedSubjects;
                        const board = selectedSubjects[subject];
                        const boards = boardMap[subject] || ["I'm not sure"];
                        const isOpen = hoveredSubject === subject;

                        return (
                          <div key={subject} style={{ position: 'relative' }}>
                            <button onClick={(e) => handleSubjectClick(subject, e)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', border: `1.5px solid ${isSelected ? 'var(--accent)' : isOpen ? 'var(--border)' : 'var(--border-subtle)'}`, background: isSelected ? 'var(--accent-dim)' : isOpen ? 'var(--bg-hover)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}
                            >
                              <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected && <span style={{ fontSize: '0.55rem', color: '#0d0d0f', fontWeight: 900 }}>✓</span>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</div>
                                {isSelected && board && board !== "I'm not sure" && (
                                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 1 }}>{board}</div>
                                )}
                              </div>
                            </button>

                            {/* Board picker */}
                            {isOpen && !isSelected && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', zIndex: 50, boxShadow: 'var(--shadow-lg)', marginTop: 4, overflow: 'hidden' }}>
                                <div style={{ padding: '8px 12px 6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>Exam board</div>
                                {boards.map(b => (
                                  <button key={b} onClick={() => selectBoard(subject, b)}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.83rem', background: 'none', border: 'none', color: b === "I'm not sure" ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer', fontStyle: b === "I'm not sure" ? 'italic' : 'normal' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                  >{b}</button>
                                ))}
                                <button onClick={() => setHoveredSubject(null)}
                                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: '0.78rem', background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >✕ Cancel</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Other subjects */}
                <div style={{ marginBottom: 20 }}>
                  <div className="form-label" style={{ marginBottom: 10 }}>Other / not listed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {otherInputs.map((val, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={val} onChange={e => { const u = [...otherInputs]; u[i] = e.target.value; setOtherInputs(u); }} placeholder="Type a subject name…" style={{ flex: 1 }} />
                        {otherInputs.length > 1 && (
                          <button onClick={() => setOtherInputs(prev => prev.filter((_, j) => j !== i))} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0 12px', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setOtherInputs(prev => [...prev, ''])}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', width: 'fit-content', transition: 'all var(--transition)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >+ Add another subject</button>
                  </div>
                </div>

                {/* Save / cancel */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', fontSize: '0.88rem' }}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setEditing(false); initEditState(profile); }} style={{ padding: '10px 18px', fontSize: '0.88rem' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="alert alert-info" style={{ marginTop: 20 }}>
            Password changes and account deletion can be added in a future update.
          </div>
        </div>
      </div>
    </div>
  );
}
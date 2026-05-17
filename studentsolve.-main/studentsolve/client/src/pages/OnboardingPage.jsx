import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { saveUserProfile } from '../firebase/firestore.js';
import ReactDOM from 'react-dom';

// ── GCSE boards per subject ────────────────────────────────────────────────
const GCSE_SUBJECT_BOARDS = {
  'Maths':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Further Maths':                ['AQA', 'CCEA', "I'm not sure"],
  'Statistics':                   ['AQA', 'Edexcel', 'CCEA', "I'm not sure"],
  'English Language':             ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'English Literature':           ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Biology':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Chemistry':                    ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Physics':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Combined Science':             ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Environmental Science':        ['AQA', 'OCR', "I'm not sure"],
  'Geology':                      ['WJEC / Eduqas', "I'm not sure"],
  'Astronomy':                    ['Edexcel', "I'm not sure"],
  'Applied Science':              ['BTEC / Pearson', 'OCR', "I'm not sure"],
  'History':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Geography':                    ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Religious Studies':            ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Philosophy':                   ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Classical Civilisation':       ['OCR', 'Edexcel', "I'm not sure"],
  'Ancient History':              ['OCR', 'Edexcel', "I'm not sure"],
  'Archaeology':                  ['OCR', "I'm not sure"],
  'History of Art':               ['AQA', 'OCR', "I'm not sure"],
  'Economics':                    ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Business':                     ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Accounting':                   ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Politics':                     ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Government & Politics':        ['AQA', 'Edexcel', "I'm not sure"],
  'Law':                          ['AQA', 'OCR', "I'm not sure"],
  'Sociology':                    ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Psychology':                   ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Citizenship':                  ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Health & Social Care':         ['BTEC / Pearson', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'French':                       ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Spanish':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'German':                       ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Italian':                      ['AQA', 'Edexcel', "I'm not sure"],
  'Mandarin Chinese':             ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Arabic':                       ['AQA', 'Edexcel', "I'm not sure"],
  'Japanese':                     ['AQA', 'Edexcel', "I'm not sure"],
  'Russian':                      ['AQA', 'Edexcel', "I'm not sure"],
  'Polish':                       ['AQA', "I'm not sure"],
  'Portuguese':                   ['Edexcel', "I'm not sure"],
  'Persian':                      ['AQA', 'Edexcel', "I'm not sure"],
  'Modern Greek':                 ['AQA', 'Edexcel', "I'm not sure"],
  'Urdu':                         ['AQA', 'Edexcel', "I'm not sure"],
  'Bengali':                      ['AQA', "I'm not sure"],
  'Gujarati':                     ['AQA', "I'm not sure"],
  'Hindi':                        ['AQA', "I'm not sure"],
  'Panjabi':                      ['AQA', "I'm not sure"],
  'Latin':                        ['OCR', 'Edexcel', "I'm not sure"],
  'Classical Greek':              ['OCR', "I'm not sure"],
  'Computer Science':             ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'ICT':                          ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Design & Technology':          ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Product Design':               ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Engineering':                  ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Electronics':                  ['WJEC / Eduqas', "I'm not sure"],
  'Electronic Products':          ['AQA', "I'm not sure"],
  'Food Preparation & Nutrition': ['AQA', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Food Technology':              ['AQA', 'OCR', "I'm not sure"],
  'Nutrition & Food Science':     ['AQA', 'OCR', "I'm not sure"],
  'Art & Design':                 ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Fine Art':                     ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Design':               ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Communication':        ['AQA', "I'm not sure"],
  'Photography':                  ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Textile Design':               ['AQA', 'Edexcel', "I'm not sure"],
  'Textiles':                     ['AQA', 'OCR', "I'm not sure"],
  '3D Design':                    ['AQA', "I'm not sure"],
  'Architecture':                 ['AQA', 'Edexcel', "I'm not sure"],
  'Music':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Music Technology':             ['AQA', 'Edexcel', "I'm not sure"],
  'Drama':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Drama & Theatre':              ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Dance':                        ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Film Studies':                 ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Media Studies':                ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Physical Education':           ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Sport Science':                ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
};

const IGCSE_SUBJECT_BOARDS = {
  'Maths':                        ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Additional Maths':             ['Cambridge International (CIE)', "I'm not sure"],
  'Maths B':                      ['Edexcel', "I'm not sure"],
  'English Language':             ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'English Language B':           ['Edexcel', "I'm not sure"],
  'English Literature':           ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'First Language English':       ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Chinese':       ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Spanish':       ['Cambridge International (CIE)', "I'm not sure"],
  'First Language French':        ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Arabic':        ['Cambridge International (CIE)', "I'm not sure"],
  'First Language German':        ['Cambridge International (CIE)', "I'm not sure"],
  'First Language Portuguese':    ['Cambridge International (CIE)', "I'm not sure"],
  'Biology':                      ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Chemistry':                    ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Physics':                      ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Combined Science':             ['Cambridge International (CIE)', "I'm not sure"],
  'Double Award Science':         ['Edexcel', "I'm not sure"],
  'Human Biology':                ['Edexcel', "I'm not sure"],
  'Environmental Management':     ['Cambridge International (CIE)', "I'm not sure"],
  'History':                      ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Geography':                    ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Business Studies':             ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Economics':                    ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Accounting':                   ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Religious Studies':            ['Cambridge International (CIE)', "I'm not sure"],
  'Sociology':                    ['Cambridge International (CIE)', "I'm not sure"],
  'Travel & Tourism':             ['Cambridge International (CIE)', "I'm not sure"],
  'Global Perspectives':          ['Cambridge International (CIE)', "I'm not sure"],
  'Computer Science':             ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'ICT':                          ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Design & Technology':          ['Cambridge International (CIE)', "I'm not sure"],
  'Food & Nutrition':             ['Cambridge International (CIE)', "I'm not sure"],
  'Art & Design':                 ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Music':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Drama':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Physical Education':           ['Cambridge International (CIE)', "I'm not sure"],
  'French':                       ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Spanish':                      ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'German':                       ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Italian':                      ['Cambridge International (CIE)', "I'm not sure"],
  'Dutch':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Greek':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Latin':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Russian':                      ['Cambridge International (CIE)', "I'm not sure"],
  'Turkish':                      ['Cambridge International (CIE)', "I'm not sure"],
  'Portuguese':                   ['Cambridge International (CIE)', "I'm not sure"],
  'Arabic':                       ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Chinese (Mandarin)':           ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Japanese':                     ['Cambridge International (CIE)', "I'm not sure"],
  'Urdu':                         ['Cambridge International (CIE)', "I'm not sure"],
  'Hindi':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Malay':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Indonesian':                   ['Cambridge International (CIE)', "I'm not sure"],
  'Afrikaans':                    ['Cambridge International (CIE)', "I'm not sure"],
  'Bengali':                      ['Cambridge International (CIE)', 'Edexcel', "I'm not sure"],
  'Gujarati':                     ['Cambridge International (CIE)', "I'm not sure"],
  'Panjabi':                      ['Cambridge International (CIE)', "I'm not sure"],
  'Tamil':                        ['Cambridge International (CIE)', "I'm not sure"],
  'Swahili':                      ['Cambridge International (CIE)', "I'm not sure"],
};

const ALEVEL_SUBJECT_BOARDS = {
  'Maths':                          ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Further Maths':                  ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Statistics':                     ['Edexcel', "I'm not sure"],
  'Biology':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Chemistry':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Physics':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Environmental Science':          ['AQA', "I'm not sure"],
  'Geology':                        ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'English Language':               ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'English Literature':             ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'English Language & Literature':  ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'History':                        ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Geography':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Religious Studies':              ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Philosophy':                     ['AQA', "I'm not sure"],
  'Classical Civilisation':         ['OCR', "I'm not sure"],
  'Ancient History':                ['OCR', "I'm not sure"],
  'History of Art':                 ['Edexcel', "I'm not sure"],
  'Economics':                      ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Business':                       ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Accounting':                     ['AQA', "I'm not sure"],
  'Politics':                       ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Government & Politics':          ['AQA', 'Edexcel', 'WJEC / Eduqas', "I'm not sure"],
  'Law':                            ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Sociology':                      ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Psychology':                     ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Computer Science':               ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'ICT':                            ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Design & Technology':            ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Product Design':                 ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Electronics':                    ['WJEC / Eduqas', "I'm not sure"],
  'Engineering':                    ['AQA', "I'm not sure"],
  'Nutrition & Food Science':       ['CCEA', "I'm not sure"],
  'Digital Technology':             ['CCEA', "I'm not sure"],
  'Software Systems Development':   ['CCEA', "I'm not sure"],
  'Art & Design':                   ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Fine Art':                       ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Design':                 ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Graphic Communication':          ['AQA', "I'm not sure"],
  'Photography':                    ['AQA', 'Edexcel', 'OCR', "I'm not sure"],
  'Textile Design':                 ['AQA', "I'm not sure"],
  'Textiles':                       ['AQA', 'OCR', "I'm not sure"],
  '3D Design':                      ['AQA', "I'm not sure"],
  'Architecture':                   ['AQA', 'Edexcel', "I'm not sure"],
  'Music':                          ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Music Technology':               ['Edexcel', "I'm not sure"],
  'Drama & Theatre':                ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Dance':                          ['AQA', "I'm not sure"],
  'Film Studies':                   ['OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Media Studies':                  ['AQA', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Moving Image Arts':              ['CCEA', "I'm not sure"],
  'Performing Arts':                ['CCEA', "I'm not sure"],
  'Physical Education':             ['AQA', 'Edexcel', 'OCR', 'WJEC / Eduqas', "I'm not sure"],
  'Sport Science':                  ['CCEA', "I'm not sure"],
  'French':                         ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Spanish':                        ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'German':                         ['AQA', 'Edexcel', 'WJEC / Eduqas', 'CCEA', "I'm not sure"],
  'Italian':                        ['Edexcel', "I'm not sure"],
  'Mandarin Chinese':               ['Edexcel', "I'm not sure"],
  'Arabic':                         ['Edexcel', "I'm not sure"],
  'Japanese':                       ['Edexcel', "I'm not sure"],
  'Russian':                        ['Edexcel', "I'm not sure"],
  'Portuguese':                     ['Edexcel', "I'm not sure"],
  'Polish':                         ['AQA', "I'm not sure"],
  'Persian':                        ['Edexcel', "I'm not sure"],
  'Modern Greek':                   ['Edexcel', "I'm not sure"],
  'Urdu':                           ['Edexcel', "I'm not sure"],
  'Bengali':                        ['AQA', "I'm not sure"],
  'Gujarati':                       ['Edexcel', "I'm not sure"],
  'Panjabi':                        ['AQA', "I'm not sure"],
  'Turkish':                        ['Edexcel', "I'm not sure"],
  'Hebrew (Modern)':                ['AQA', "I'm not sure"],
  'Latin':                          ['OCR', "I'm not sure"],
  'Classical Greek':                ['OCR', "I'm not sure"],
  'Health and Social Care':         ['CCEA', "I'm not sure"],
};

const GCSE_SUBJECTS = [
  'Maths', 'Further Maths', 'Statistics',
  'English Language', 'English Literature',
  'Biology', 'Chemistry', 'Physics', 'Combined Science',
  'Environmental Science', 'Geology', 'Astronomy', 'Applied Science',
  'History', 'Geography', 'Religious Studies', 'Philosophy',
  'Classical Civilisation', 'Ancient History', 'Archaeology', 'History of Art',
  'Economics', 'Business', 'Accounting', 'Politics', 'Government & Politics',
  'Law', 'Sociology', 'Psychology', 'Citizenship', 'Health & Social Care',
  'French', 'Spanish', 'German', 'Italian', 'Mandarin Chinese',
  'Arabic', 'Japanese', 'Russian', 'Polish', 'Portuguese',
  'Persian', 'Modern Greek', 'Urdu', 'Bengali', 'Gujarati', 'Hindi', 'Panjabi',
  'Latin', 'Classical Greek',
  'Computer Science', 'ICT', 'Design & Technology', 'Product Design',
  'Engineering', 'Electronics', 'Electronic Products',
  'Food Preparation & Nutrition', 'Food Technology', 'Nutrition & Food Science',
  'Art & Design', 'Fine Art', 'Graphic Design', 'Graphic Communication',
  'Photography', 'Textile Design', 'Textiles', '3D Design', 'Architecture',
  'Music', 'Music Technology', 'Drama', 'Drama & Theatre', 'Dance',
  'Film Studies', 'Media Studies',
  'Physical Education', 'Sport Science',
];

const IGCSE_SUBJECTS = Object.keys(IGCSE_SUBJECT_BOARDS);

const ALEVEL_SUBJECTS = [
  'Maths', 'Further Maths', 'Statistics',
  'Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Geology',
  'English Language', 'English Literature', 'English Language & Literature',
  'History', 'Geography', 'Religious Studies', 'Philosophy',
  'Classical Civilisation', 'Ancient History', 'History of Art',
  'Economics', 'Business', 'Accounting', 'Politics', 'Government & Politics',
  'Law', 'Sociology', 'Psychology',
  'Computer Science', 'ICT', 'Design & Technology', 'Product Design',
  'Electronics', 'Engineering', 'Nutrition & Food Science',
  'Digital Technology', 'Software Systems Development',
  'Art & Design', 'Fine Art', 'Graphic Design', 'Graphic Communication',
  'Photography', 'Textile Design', 'Textiles', '3D Design', 'Architecture',
  'Music', 'Music Technology', 'Drama & Theatre', 'Dance',
  'Film Studies', 'Media Studies', 'Moving Image Arts', 'Performing Arts',
  'Physical Education', 'Sport Science',
  'French', 'Spanish', 'German', 'Italian', 'Mandarin Chinese',
  'Arabic', 'Japanese', 'Russian', 'Portuguese', 'Polish',
  'Persian', 'Modern Greek', 'Urdu', 'Bengali', 'Gujarati', 'Panjabi',
  'Turkish', 'Hebrew (Modern)',
  'Latin', 'Classical Greek',
  'Health and Social Care',
];

const YEAR_OPTIONS = [
  { value: 'year9',  label: 'Year 9'  },
  { value: 'year10', label: 'Year 10' },
  { value: 'year11', label: 'Year 11' },
  { value: 'year12', label: 'Year 12' },
  { value: 'year13', label: 'Year 13' },
  { value: 'other',  label: 'Other'   },
];

const QUALIFICATION_OPTIONS = [
  'GCSE', 'IGCSE', 'A-Level', 'AS-Level',
  'IB (International Baccalaureate)', 'BTEC', 'Cambridge Pre-U',
  'Scottish Highers', 'Other',
];

function getSubjectData(quals) {
  if (quals.includes('IGCSE')) return { subjects: IGCSE_SUBJECTS, boards: IGCSE_SUBJECT_BOARDS };
  if (quals.includes('A-Level') || quals.includes('AS-Level')) return { subjects: ALEVEL_SUBJECTS, boards: ALEVEL_SUBJECT_BOARDS };
  return { subjects: GCSE_SUBJECTS, boards: GCSE_SUBJECT_BOARDS };
}

// ── Portal-based BoardPicker ───────────────────────────────────────────────
// Uses position:fixed so it never gets clipped by overflow:auto scroll containers
function BoardPicker({ subject, boards, anchorEl, onSelect, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const dropdownHeight = Math.min(boards.length * 40 + 60, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > dropdownHeight
      ? rect.bottom + 4
      : rect.top - dropdownHeight - 4;
    setPos({ top, left: rect.left, width: rect.width });
  }, [anchorEl, boards.length]);

  useEffect(() => {
    function handleClick(e) {
      if (anchorEl && !anchorEl.contains(e.target)) onClose();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [anchorEl, onClose]);

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: pos.top,
      left: pos.left,
      width: Math.max(pos.width, 200),
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      zIndex: 9999,
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      maxHeight: 320,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '8px 12px 6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
        Exam board
      </div>
      {boards.map(b => (
        <button key={b} onClick={e => { e.stopPropagation(); onSelect(b); }}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.83rem', background: 'none', border: 'none', color: b === "I'm not sure" ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer', fontStyle: b === "I'm not sure" ? 'italic' : 'normal' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{b}</button>
      ))}
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: '0.78rem', background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
      >✕ Cancel</button>
    </div>,
    document.body
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [yearGroup, setYearGroup] = useState('');
  const [selectedQuals, setSelectedQuals] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [search, setSearch] = useState('');
  const [pickerSubject, setPickerSubject] = useState(null); // subject name
  const [pickerAnchor, setPickerAnchor] = useState(null);  // DOM element ref
  const [otherInputs, setOtherInputs] = useState(['']);
  const [loading, setLoading] = useState(false);

  const { subjects: subjectList, boards: boardMap } = getSubjectData(selectedQuals);

  const filteredSubjects = search.trim()
    ? subjectList.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : subjectList;

  function toggleQual(q) {
    setSelectedQuals(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
    setSelectedSubjects({});
    setSearch('');
  }

  function handleSubjectClick(subject, el) {
    if (selectedSubjects[subject] !== undefined) {
      // Already selected — deselect
      setSelectedSubjects(prev => { const c = { ...prev }; delete c[subject]; return c; });
    } else {
      // Open board picker
      setPickerSubject(subject);
      setPickerAnchor(el);
    }
  }

  function selectBoard(board) {
    if (!pickerSubject) return;
    setSelectedSubjects(prev => ({ ...prev, [pickerSubject]: board }));
    setPickerSubject(null);
    setPickerAnchor(null);
  }

  function closePicker() {
    setPickerSubject(null);
    setPickerAnchor(null);
  }

  async function handleFinish() {
    setLoading(true);
    const extras = otherInputs.map(s => s.trim()).filter(Boolean);
    const subjectNames = [...Object.keys(selectedSubjects), ...extras];
    const folders = {};
    subjectNames.forEach(s => { folders[s] = []; });

    const primaryQual = selectedQuals.includes('IGCSE') ? 'IGCSE'
      : (selectedQuals.includes('A-Level') || selectedQuals.includes('AS-Level')) ? 'A-Level'
      : 'GCSE';

    const profileData = {
      yearGroup,
      qualifications: selectedQuals,
      primaryQualification: primaryQual,
      subjects: subjectNames,
      subjectBoards: selectedSubjects,
      onboardingComplete: true,
    };

    await saveUserProfile(user.uid, profileData);
    localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
    localStorage.setItem(`folders_${user.uid}`, JSON.stringify(folders));
    navigate('/dashboard');
  }

  const subjectCount = Object.keys(selectedSubjects).length + otherInputs.filter(s => s.trim()).length;
  const primaryQualLabel = selectedQuals.includes('IGCSE') ? 'IGCSE'
    : (selectedQuals.includes('A-Level') || selectedQuals.includes('AS-Level')) ? 'A-Level'
    : 'GCSE';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: step === 3 ? 720 : 560 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: 20 }}>StudentSolve</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: n === step ? 28 : 8, height: 8, borderRadius: 99, background: n <= step ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
          <h1 style={{ fontSize: '1.7rem', marginBottom: 8 }}>
            {step === 1 ? 'Welcome to StudentSolve' : step === 2 ? 'What are you studying?' : 'Pick your subjects'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {step === 1 ? "Let's personalise your workspace"
              : step === 2 ? 'Select all that apply'
              : `Click a subject to pick your exam board — showing ${primaryQualLabel} subjects`}
          </p>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {YEAR_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setYearGroup(opt.value)}
                  style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: `2px solid ${yearGroup === opt.value ? 'var(--accent)' : 'var(--border-subtle)'}`, background: yearGroup === opt.value ? 'var(--accent-dim)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${yearGroup === opt.value ? 'var(--accent)' : 'var(--border)'}`, background: yearGroup === opt.value ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {yearGroup === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d0d0f' }} />}
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: yearGroup === opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" disabled={!yearGroup} onClick={() => setStep(2)} style={{ marginTop: 12, padding: 13, justifyContent: 'center', fontSize: '0.95rem' }}>Continue →</button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {QUALIFICATION_OPTIONS.map(q => {
                const selected = selectedQuals.includes(q);
                return (
                  <button key={q} onClick={() => toggleQual(q)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`, background: selected ? 'var(--accent-dim)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, background: selected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected && <span style={{ fontSize: '0.6rem', color: '#0d0d0f', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>{q}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ fontSize: '0.88rem' }}>← Back</button>
              <button className="btn btn-primary" disabled={selectedQuals.length === 0} onClick={() => setStep(3)} style={{ flex: 1, justifyContent: 'center', padding: 13, fontSize: '0.95rem' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a subject…" style={{ paddingLeft: 40 }} autoFocus />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
            </div>

            {/* Subject grid — no overflow:hidden, just scroll with padding at bottom */}
            <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 20, paddingBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 8 }}>
                {filteredSubjects.map(subject => {
                  const isSelected = subject in selectedSubjects;
                  const board = selectedSubjects[subject];

                  return (
                    <button
                      key={subject}
                      onClick={e => handleSubjectClick(subject, e.currentTarget)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius)',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--accent-dim)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    >
                      <div style={{ width: 15, height: 15, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <span style={{ fontSize: '0.55rem', color: '#0d0d0f', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</div>
                        {isSelected && board && board !== "I'm not sure" && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>{board}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Portal board picker */}
            {pickerSubject && pickerAnchor && (
              <BoardPicker
                subject={pickerSubject}
                boards={boardMap[pickerSubject] || ["I'm not sure"]}
                anchorEl={pickerAnchor}
                onSelect={selectBoard}
                onClose={closePicker}
              />
            )}

            {/* Other subjects */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Other / not listed</div>
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ fontSize: '0.88rem' }}>← Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={loading || subjectCount === 0}
                style={{ flex: 1, justifyContent: 'center', padding: 13, fontSize: '0.95rem' }}
              >
                {loading ? 'Setting up your workspace…' : `Create ${subjectCount} folder${subjectCount !== 1 ? 's' : ''} and go to dashboard`}
              </button>
            </div>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.76rem', color: 'var(--text-muted)' }}>You can edit your subjects anytime in Settings</p>
          </div>
        )}
      </div>
    </div>
  );
}
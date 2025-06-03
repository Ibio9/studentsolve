import React, { useState } from 'react';

export default function EssayFeedback() {
  const [essayText, setEssayText] = useState('');
  const [board, setBoard] = useState('edexcel-igcse');
  const [questionType, setQuestionType] = useState('modern-prose');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const questionOptions = {
    'edexcel-igcse': [
      { value: 'modern-prose', label: 'Modern Prose (AO1 20 / AO4 20)' },
      { value: 'unseen-poetry', label: 'Unseen Poetry (AO2 20)' },
      { value: 'anthology-poetry', label: 'Anthology Poetry (AO2 15 / AO3 15)' },
      { value: 'modern-drama', label: 'Modern Drama (AO1 15 / AO2 15)' },
      { value: 'literary-heritage', label: 'Lit Heritage Texts (AO1/2/4 x10)' }
    ],
    'aqa': [
      { value: 'drama', label: 'Post-1914 Drama (AO1 12 / AO2 12 / AO3 6 / AO4 4)' },
      { value: 'prose', label: 'Post-1914 Prose (same AO breakdown)' },
      { value: 'shakespeare', label: 'Shakespeare Plays (AO1-4)' },
      { value: 'nineteenth', label: '19th Century Novels (AO1/AO2/AO3)' },
      { value: 'unseen-poetry', label: 'Unseen Poetry (AO1 12 / AO2 12)' },
      { value: 'power-conflict', label: 'Power & Conflict (AO1/AO2/AO3)' }
    ],
    'edexcel-gcse': [
      { value: 'shakespeare-extract', label: 'Shakespeare Extract (AO2 20)' },
      { value: 'shakespeare-nonextract', label: 'Shakespeare Non-Extract (AO1 15 / AO3 5)' },
      { value: 'modern-extract', label: 'Modern Play/Novel Extract (AO1 16 / AO3 16 / AO4 8)' },
      { value: 'nineteenth-extract', label: '19th C Extract (AO2 20)' },
      { value: 'nineteenth-nonextract', label: '19th C Non-Extract (AO1 20)' },
      { value: 'anthology-poetry', label: 'Anthology Poetry (AO2 15 / AO3 5)' },
      { value: 'unseen-poetry', label: 'Unseen Poetry (AO1 8 / AO2 12)' }
    ]
  };

  const handleSubmit = async () => {
    if (!essayText.trim()) return;

    setLoading(true);
    setFeedback('');

    try {
      const res = await fetch('http://localhost:5000/api/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: essayText,
          board,
          type: questionType
        })
      });

      const data = await res.json();
      setFeedback(data.result || 'No feedback returned.'); // ✅ FIXED LINE
    } catch (err) {
      setFeedback('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-3xl font-semibold mb-6">Essay Feedback Tool</h2>

      <div className="space-y-4 mb-4">
        <div className="flex gap-4">
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="text-black p-2 rounded"
          >
            <option value="edexcel-igcse">Edexcel IGCSE</option>
            <option value="aqa">AQA</option>
            <option value="edexcel-gcse">Edexcel GCSE</option>
          </select>

          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="text-black p-2 rounded"
          >
            {questionOptions[board].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="w-full text-black p-4 rounded h-48"
          placeholder="Paste your essay here..."
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white transition"
        >
          {loading ? 'Marking...' : 'Get Feedback'}
        </button>
      </div>

      {feedback && (
        <div className="bg-gray-800 p-4 rounded mt-6">
          <h3 className="text-xl font-semibold mb-2">Feedback:</h3>
          <p className="whitespace-pre-line">{feedback}</p>
        </div>
      )}
    </div>
  );
}

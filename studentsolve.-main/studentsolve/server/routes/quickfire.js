import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST /api/quickfire/questions ─────────────────────────────────────────
router.post('/questions', async (req, res) => {
  const { subject, board, level, count, useAI, topics } = req.body;

  if (!subject || !board || !level) {
    return res.status(400).json({ error: 'subject, board and level are required.' });
  }

  const numQuestions = Math.min(Number(count) || 10, 100);
  const topicFilter = Array.isArray(topics) && topics.length > 0
    ? `You MUST only generate questions from these specific topics: ${topics.join(', ')}.`
    : `Cover a broad spread of topics from across the full ${board} ${level} ${subject} specification.`;

  const prompt = `You are an expert ${level} ${subject} examiner for ${board}.

Generate exactly ${numQuestions} exam-style questions for ${level} ${subject} (${board} specification).

Requirements:
- Mix of question types: roughly 40% multiple choice (MCQ) and 60% short answer
- ${topicFilter}
- Each question must be tagged to a real topic from the ${board} ${level} ${subject} specification
- Questions must be based on REAL past paper topics and mark scheme style for ${board} ${level} ${subject}
- MCQ questions must have exactly 4 options with one correct answer
- Short answer questions should be 1-6 marks
- Be specific and exam-authentic — use real terminology, units, concepts from the spec
- AVOID repetition — every question must test a different concept, fact or skill. Do not ask similar questions twice.
- Spread questions evenly across topics — do not cluster multiple questions on the same narrow point
${useAI ? '- Include some challenging application/analysis questions beyond basic recall' : '- Focus on core knowledge and recall questions from the specification'}

You must respond ONLY with a valid JSON array, no markdown, no backticks.

Each question object must follow this exact structure:

For MCQ:
{
  "id": "q1",
  "type": "mcq",
  "topic": "<real spec topic>",
  "question": "<question text>",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "explanation": "<why this is correct>",
  "marks": 1,
  "subject": "${subject}",
  "board": "${board}",
  "level": "${level}"
}

For short answer:
{
  "id": "q2",
  "type": "short",
  "topic": "<real spec topic>",
  "question": "<question text>",
  "markScheme": ["<mark point 1>", "<mark point 2>"],
  "marks": <integer 1-6>,
  "subject": "${subject}",
  "board": "${board}",
  "level": "${level}"
}

Generate exactly ${numQuestions} questions. Each question must test a unique concept — no repetition.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(raw);

    if (!Array.isArray(questions)) {
      return res.status(500).json({ error: 'Invalid response format from AI.' });
    }

    res.json(questions);
  } catch (err) {
    console.error('[Quickfire Questions Error]', err.message);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// ── POST /api/quickfire/mark ──────────────────────────────────────────────
router.post('/mark', async (req, res) => {
  const { question, markScheme, studentAnswer, marks, subject, board, type, correctAnswer, explanation } = req.body;

  if (type === 'mcq') {
    const correct = studentAnswer?.trim().toUpperCase() === correctAnswer?.trim().toUpperCase();
    return res.json({
      marksAwarded: correct ? 1 : 0,
      maxMarks: 1,
      correct,
      feedback: correct
        ? `Correct! ${explanation || ''}`
        : `Incorrect. The correct answer is ${correctAnswer}. ${explanation || ''}`,
      markSchemePoints: [],
    });
  }

  if (!question || !markScheme || !studentAnswer) {
    return res.status(400).json({ error: 'question, markScheme and studentAnswer are required.' });
  }

  const prompt = `You are an experienced ${subject} examiner marking a student's answer.

Question: ${question}

Mark scheme points (${marks} marks total):
${Array.isArray(markScheme) ? markScheme.map((p, i) => `${i + 1}. ${p}`).join('\n') : markScheme}

Student's answer: ${studentAnswer}

Mark this answer strictly according to the mark scheme. Award marks only for points that clearly match mark scheme criteria.

Respond ONLY with valid JSON, no markdown:
{
  "marksAwarded": <integer 0 to ${marks}>,
  "maxMarks": ${marks},
  "markSchemePoints": [
    { "point": "<mark scheme point>", "awarded": <true/false> }
  ],
  "feedback": "<2-3 sentences: what was good, what was missing, how to improve>"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error('[Quickfire Mark Error]', err.message);
    res.status(500).json({ error: 'Failed to mark answer.' });
  }
});

export default router;
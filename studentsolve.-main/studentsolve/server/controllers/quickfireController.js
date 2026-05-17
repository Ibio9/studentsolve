import Anthropic from '@anthropic-ai/sdk';
import { getQuestions } from '../utils/questionBank.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getQuestionsHandler(req, res) {
  const { subject, board, level, count, useAI } = req.body;

  let questions = getQuestions(subject, board, level);
  questions = questions.sort(() => Math.random() - 0.5);

  const requested = count === 'unlimited' ? questions.length : parseInt(count) || 10;
  const needed = Math.max(0, requested - questions.length);

  if (useAI || needed > 0) {
    const toGenerate = useAI ? Math.max(needed, 10) : needed;
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Generate ${toGenerate} authentic ${board} ${level} ${subject} past paper style exam questions for UK students. Return ONLY a valid JSON array. Each object must have these exact fields: id (string, unique like "ai-001"), subject (string), board (string), level (string), topic (string), question (string including [X marks] at end), marks (number), markScheme (array of strings, each ending with "(1)"), source (string). Use real exam command words: Describe, Explain, Calculate, State, Compare, Evaluate. Vary mark allocations 1-6. Make questions substantive and realistic.`
        }]
      });

      const text = msg.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiQuestions = JSON.parse(jsonMatch[0]);
        questions = [...questions, ...aiQuestions];
      }
    } catch (e) {
      console.error('AI question generation failed:', e.message);
    }
  }

  const final = count === 'unlimited' ? questions : questions.slice(0, requested);
  res.json(final);
}

export async function markAnswerHandler(req, res) {
  const { question, markScheme, studentAnswer, marks, subject, board } = req.body;

  if (!studentAnswer || !studentAnswer.trim()) {
    return res.json({
      marksAwarded: 0,
      maxMarks: marks,
      feedback: 'No answer provided.',
      markSchemePoints: (markScheme || []).map(p => ({ point: p, awarded: false }))
    });
  }

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a lenient but fair UK ${board} exam marker for ${subject}.

Question: ${question}
Mark scheme points: ${JSON.stringify(markScheme)}
Maximum marks: ${marks}
Student answer: ${studentAnswer}

Mark generously — credit correct ideas even if not worded exactly as the mark scheme. Award partial credit where deserved. Do not penalise for minor spelling errors.

Return ONLY valid JSON with no extra text:
{"marksAwarded": <number 0-${marks}>, "maxMarks": ${marks}, "feedback": "<1-2 sentence examiner feedback>", "markSchemePoints": [{"point": "<mark scheme point>", "awarded": <true or false>}]}`
      }]
    });

    const text = msg.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      result.marksAwarded = Math.max(0, Math.min(result.marksAwarded, marks));
      res.json(result);
    } else {
      res.json({ marksAwarded: 0, maxMarks: marks, feedback: 'Could not parse marking result.', markSchemePoints: [] });
    }
  } catch (e) {
    console.error('Marking failed:', e.message);
    res.status(500).json({ error: 'Marking failed' });
  }
}

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST /api/revision-timetable ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { subjects, hoursPerDay, studyDays, weakTopics, qualification } = req.body;

  if (!subjects || subjects.length === 0) {
    return res.status(400).json({ error: 'subjects required.' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const subjectSummary = subjects.map(s => {
    const parts = [`${s.subject}`];
    if (s.board) parts.push(`(${s.board})`);
    if (s.examDate) parts.push(`— exam: ${s.examDate} (${s.daysUntil} days away)`);
    else parts.push('— no exam date set');
    if (s.weakTopics?.length > 0) {
      parts.push(`\n    Weak topics: ${s.weakTopics.map(t => `${t.topic} (${t.percentage}%)`).join(', ')}`);
    }
    return parts.join(' ');
  }).join('\n');

  const prompt = `You are a smart revision planner for a UK ${qualification} student.

Today's date: ${todayStr}
Study days per week: ${studyDays.join(', ')}
Hours available per day: ${hoursPerDay}h

Student's subjects and exam dates:
${subjectSummary}

${weakTopics.length > 0 ? `Overall weak topics to prioritise:\n${weakTopics.map(t => `- ${t.subject}: ${t.topic} (${t.percentage}%)`).join('\n')}` : ''}

Generate a smart 4-week revision timetable. Rules:
- Prioritise subjects with the nearest exam dates — spend more time on them
- Spread weaker topics across more sessions
- Each study session should be 45-90 minutes (split the available hours into sessions)
- Include variety — don't study the same subject all day
- Use real spec topics as session content, not vague labels
- For subjects without exam dates, distribute evenly
- Weekend sessions can be slightly longer

Respond ONLY with valid JSON, no markdown, no backticks:

{
  "weeks": [
    {
      "dateRange": "13 Jan – 19 Jan",
      "days": [
        {
          "day": "Mon",
          "sessions": [
            {
              "subject": "Physics",
              "topic": "Newton's Laws of Motion",
              "duration": "1h"
            },
            {
              "subject": "Maths",
              "topic": "Integration by Parts",
              "duration": "45min"
            }
          ]
        }
      ]
    }
  ],
  "summary": "2-3 sentence AI recommendation about this student's revision strategy, referencing their specific weak topics and nearest exams."
}

Generate exactly 4 weeks. Only include the study days specified (${studyDays.join(', ')}). Other days should have an empty sessions array.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const timetable = JSON.parse(raw);

    res.json({ timetable });
  } catch (err) {
    console.error('[Revision Timetable Error]', err.message);
    res.status(500).json({ error: 'Failed to generate timetable.' });
  }
});

export default router;
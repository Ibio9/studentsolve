import openai from '../utils/openai.js';
import { db } from '../utils/firebase.js';

// ── Helper: fetch and summarise quickfire progress from Firestore ──────────
async function getProgressSummary(userId) {
  if (!userId) return null;
  try {
    const snapshot = await db
      .collection('quickfire_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    if (snapshot.empty) return null;

    // Aggregate per topic across all recent sessions
    const topicMap = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      (data.topicResults || []).forEach(({ topic, earned, total, subject }) => {
        const key = `${subject}::${topic}`;
        if (!topicMap[key]) topicMap[key] = { topic, subject, earned: 0, total: 0 };
        topicMap[key].earned += earned;
        topicMap[key].total += total;
      });
    });

    const entries = Object.values(topicMap).filter(t => t.total > 0);
    if (entries.length === 0) return null;

    const weak = entries
      .filter(t => (t.earned / t.total) < 0.6)
      .sort((a, b) => (a.earned / a.total) - (b.earned / b.total))
      .slice(0, 5);

    const strong = entries
      .filter(t => (t.earned / t.total) >= 0.75)
      .sort((a, b) => (b.earned / b.total) - (a.earned / a.total))
      .slice(0, 5);

    let summary = '\n\n--- STUDENT PROGRESS CONTEXT ---';
    summary += '\nUse this to personalise your tutoring. Reference specific weak topics proactively when relevant.\n';

    if (weak.length > 0) {
      summary += '\nWeak topics (needs focus):\n';
      weak.forEach(t => {
        const pct = Math.round((t.earned / t.total) * 100);
        summary += `  - ${t.subject} → ${t.topic}: ${pct}% (${t.earned}/${t.total} marks)\n`;
      });
    }

    if (strong.length > 0) {
      summary += '\nStrong topics:\n';
      strong.forEach(t => {
        const pct = Math.round((t.earned / t.total) * 100);
        summary += `  - ${t.subject} → ${t.topic}: ${pct}%\n`;
      });
    }

    summary += '--- END PROGRESS CONTEXT ---';
    return summary;
  } catch (err) {
    console.error('[Progress fetch error]', err.message);
    return null;
  }
}

// ── Helper: fetch user AI memory docs (Pro feature) ───────────────────────
async function getAIMemory(userId) {
  if (!userId) return null;
  try {
    const snapshot = await db
      .collection('ai_memory')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) return null;

    let memory = '\n\n--- STUDENT UPLOADED NOTES/CONTEXT ---\n';
    snapshot.forEach(doc => {
      const { fileName, content } = doc.data();
      // Truncate each doc to 3000 chars to keep context window manageable
      const truncated = content?.slice(0, 3000) || '';
      memory += `\n[${fileName}]\n${truncated}\n`;
    });
    memory += '--- END UPLOADED CONTEXT ---';
    return memory;
  } catch (err) {
    console.error('[AI memory fetch error]', err.message);
    return null;
  }
}

// ── Main chat handler ─────────────────────────────────────────────────────
export async function chat(req, res) {
  const { message, history = [], userId, isPro = false } = req.body;

  // Build dynamic system prompt
  let systemPrompt = `You are an expert AI tutor called StudentSolve Tutor. You help students of all levels — GCSE, A-Level, IB, and undergraduate — understand difficult concepts clearly and accurately.

Your approach:
- Break down complex topics into clear, logical explanations
- Use examples, analogies, and step-by-step reasoning where helpful
- Adapt your language to the student's apparent level
- Be encouraging but accurate — never give incorrect information to be nice
- If a question is ambiguous, ask a brief clarifying question
- Format answers clearly, using numbered steps or bullet points when it helps
- If the student's progress data shows weak topics, proactively weave in help for those areas when relevant — e.g. "I can see you've been finding Newton's Laws tricky — let's make sure this connects back to that."

You are knowledgeable across all school subjects: Maths, Sciences, Humanities, English, Economics, Computer Science, Languages, and more.`;

  // Inject progress context
  if (userId) {
    const [progressSummary, aiMemory] = await Promise.all([
      getProgressSummary(userId),
      isPro ? getAIMemory(userId) : Promise.resolve(null),
    ]);

    if (progressSummary) systemPrompt += progressSummary;
    if (aiMemory) systemPrompt += aiMemory;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1200,
      temperature: 0.6,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('[Tutor Error]', err.message);
    res.status(500).json({ error: 'Failed to get a response from the AI tutor. Please try again.' });
  }
}
import express from 'express';
import { db } from '../utils/firebase.js';
import admin from 'firebase-admin';

const router = express.Router();

// ── POST /api/quickfire-progress/save ─────────────────────────────────────
// Called from frontend when a Quickfire session ends
router.post('/save', async (req, res) => {
  const { userId, subject, board, level, questions, answers } = req.body;

  if (!userId || !subject || !Array.isArray(questions) || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'userId, subject, questions and answers are required.' });
  }

  try {
    // Build per-topic results
    const topicMap = {};
    questions.forEach((q, i) => {
      const topic = q.topic || 'General';
      if (!topicMap[topic]) topicMap[topic] = { topic, subject, earned: 0, total: 0 };
      topicMap[topic].total += q.marks || 0;
      topicMap[topic].earned += answers[i]?.result?.marksAwarded || 0;
    });

    const topicResults = Object.values(topicMap);
    const totalMarks = topicResults.reduce((s, t) => s + t.total, 0);
    const earnedMarks = topicResults.reduce((s, t) => s + t.earned, 0);

    await db.collection('quickfire_sessions').add({
      userId,
      subject,
      board: board || '',
      level: level || '',
      totalMarks,
      earnedMarks,
      percentage: totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0,
      topicResults,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Quickfire Save Error]', err.message);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

// ── GET /api/quickfire-progress/:userId ───────────────────────────────────
// Returns aggregated progress per topic for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId required.' });

  try {
    const snapshot = await db
      .collection('quickfire_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    if (snapshot.empty) return res.json({ sessions: [], topicProgress: {} });

    const sessions = [];
    const topicMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        subject: data.subject,
        board: data.board,
        level: data.level,
        totalMarks: data.totalMarks,
        earnedMarks: data.earnedMarks,
        percentage: data.percentage,
        createdAt: data.createdAt?.toDate?.() || null,
      });

      (data.topicResults || []).forEach(({ topic, subject, earned, total }) => {
        const key = `${subject}::${topic}`;
        if (!topicMap[key]) topicMap[key] = { topic, subject, earned: 0, total: 0, attempts: 0 };
        topicMap[key].earned += earned;
        topicMap[key].total += total;
        topicMap[key].attempts += 1;
      });
    });

    // Add percentage to each topic
    const topicProgress = {};
    Object.entries(topicMap).forEach(([key, val]) => {
      topicProgress[key] = {
        ...val,
        percentage: val.total > 0 ? Math.round((val.earned / val.total) * 100) : 0,
      };
    });

    res.json({ sessions, topicProgress });
  } catch (err) {
    console.error('[Quickfire Progress Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

export default router;
import express from 'express';
import { db } from '../utils/firebase.js';
import admin from 'firebase-admin';
import mammoth from 'mammoth';

const router = express.Router();

// ── POST /api/ai-memory/upload ────────────────────────────────────────────
// Pro feature: upload a file (docx or txt) to AI memory
router.post('/upload', async (req, res) => {
  const { userId, isPro, fileName, fileBase64, fileType } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId required.' });
  if (!isPro) return res.status(403).json({ error: 'This feature requires a Pro account.' });
  if (!fileName || !fileBase64) return res.status(400).json({ error: 'fileName and fileBase64 required.' });

  try {
    // Check limit — max 10 memory docs per user
    const existing = await db.collection('ai_memory').where('userId', '==', userId).get();
    if (existing.size >= 10) {
      return res.status(400).json({ error: 'Memory limit reached (10 documents). Delete one to add more.' });
    }

    let content = '';

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // .docx — extract with mammoth
      const buffer = Buffer.from(fileBase64, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else {
      // Plain text / other — decode directly
      content = Buffer.from(fileBase64, 'base64').toString('utf-8');
    }

    // Trim to 8000 chars max per doc
    content = content.slice(0, 8000);

    await db.collection('ai_memory').add({
      userId,
      fileName,
      fileType: fileType || 'text/plain',
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: `"${fileName}" added to your AI memory.` });
  } catch (err) {
    console.error('[AI Memory Upload Error]', err.message);
    res.status(500).json({ error: 'Failed to upload to AI memory.' });
  }
});

// ── GET /api/ai-memory/:userId ────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId required.' });

  try {
    const snapshot = await db
      .collection('ai_memory')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const docs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      docs.push({
        id: doc.id,
        fileName: data.fileName,
        fileType: data.fileType,
        contentPreview: data.content?.slice(0, 100) + '…',
        createdAt: data.createdAt?.toDate?.() || null,
      });
    });

    res.json({ docs });
  } catch (err) {
    console.error('[AI Memory Fetch Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch AI memory.' });
  }
});

// ── DELETE /api/ai-memory/:userId/:docId ─────────────────────────────────
router.delete('/:userId/:docId', async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const doc = await db.collection('ai_memory').doc(docId).get();
    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    await db.collection('ai_memory').doc(docId).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('[AI Memory Delete Error]', err.message);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export default router;
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  setDoc,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

// ── User Profile ───────────────────────────────────────────────────────────

export async function saveUserProfile(userId, data) {
  return setDoc(doc(db, 'users', userId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

// ── Save ──────────────────────────────────────────────────────────────────

export async function saveTutorSession(userId, messages, title) {
  return addDoc(collection(db, 'tutor_sessions'), {
    userId,
    title: title || 'Tutor Session',
    messages,
    createdAt: serverTimestamp(),
  });
}

export async function saveEssay(userId, essayText, examBoard, subject, feedback) {
  return addDoc(collection(db, 'essays'), {
    userId,
    essayText: essayText.substring(0, 2000),
    examBoard,
    subject,
    feedback,
    createdAt: serverTimestamp(),
  });
}

export async function saveNotes(userId, url, notes) {
  return addDoc(collection(db, 'notes'), {
    userId,
    url,
    notes,
    createdAt: serverTimestamp(),
  });
}

export async function saveFlashcards(userId, title, flashcards) {
  return addDoc(collection(db, 'flashcards'), {
    userId,
    title,
    flashcards,
    createdAt: serverTimestamp(),
  });
}

// ── Roadmaps ──────────────────────────────────────────────────────────────

export async function saveRoadmap(userId, title, formData, roadmapData) {
  return addDoc(collection(db, 'roadmaps'), {
    userId,
    title,
    formData,
    roadmapData,
    createdAt: serverTimestamp(),
  });
}

export async function getUserRoadmaps(userId) {
  const q = query(
    collection(db, 'roadmaps'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteRoadmap(roadmapId) {
  return deleteDoc(doc(db, 'roadmaps', roadmapId));
}

export async function renameRoadmap(roadmapId, newTitle) {
  return updateDoc(doc(db, 'roadmaps', roadmapId), { title: newTitle });
}

// ── Fetch ─────────────────────────────────────────────────────────────────

export async function getUserSaved(userId) {
  const results = { essays: [], notes: [], flashcards: [], tutor_sessions: [] };
  const cols = ['essays', 'notes', 'flashcards', 'tutor_sessions'];

  await Promise.all(
    cols.map(async (col) => {
      const q = query(
        collection(db, col),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      results[col] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    })
  );

  return results;
}

export async function getRecentSaved(userId) {
  const results = [];
  const cols = [
    { name: 'essays', label: 'Essay' },
    { name: 'notes', label: 'Notes' },
    { name: 'flashcards', label: 'Flashcards' },
    { name: 'tutor_sessions', label: 'Tutor Chat' },
  ];

  await Promise.all(
    cols.map(async ({ name, label }) => {
      const q = query(
        collection(db, name),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((doc) => {
        results.push({ id: doc.id, type: label, collection: name, ...doc.data() });
      });
    })
  );

  results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results.slice(0, 6);
}
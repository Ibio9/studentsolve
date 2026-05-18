import { saveUserProfile, getUserProfile } from '../firebase/firestore.js';

// ── Keys ──────────────────────────────────────────────────────────────────
const foldersKey = uid => `folders_${uid}`;
const folderOrderKey = uid => `folderOrder_${uid}`;
const profileKey = uid => `userProfile_${uid}`;
const subjectFolderTagKey = uid => `subjectFolderTags_${uid}`;

// ── Helpers ───────────────────────────────────────────────────────────────
function getFolders(uid) {
  try { return JSON.parse(localStorage.getItem(foldersKey(uid)) || '{}'); } catch { return {}; }
}
function getFolderOrder(uid) {
  try { return JSON.parse(localStorage.getItem(folderOrderKey(uid)) || '[]'); } catch { return []; }
}
function getProfile(uid) {
  try { return JSON.parse(localStorage.getItem(profileKey(uid)) || '{}'); } catch { return {}; }
}
function getSubjectTags(uid) {
  try { return JSON.parse(localStorage.getItem(subjectFolderTagKey(uid)) || '[]'); } catch { return []; }
}

function saveFoldersLocal(uid, folders, order) {
  localStorage.setItem(foldersKey(uid), JSON.stringify(folders));
  if (order) localStorage.setItem(folderOrderKey(uid), JSON.stringify(order));
}

function saveProfileLocal(uid, profile) {
  localStorage.setItem(profileKey(uid), JSON.stringify(profile));
}

function saveSubjectTags(uid, tags) {
  localStorage.setItem(subjectFolderTagKey(uid), JSON.stringify(tags));
}

// ── Check if a folder is a subject folder ─────────────────────────────────
export function isSubjectFolder(uid, folderName) {
  return getSubjectTags(uid).includes(folderName);
}

// ── Add a subject folder (from onboarding, settings, or recovery) ─────────
export async function addSubjectFolder(uid, subject, board) {
  // Folders
  const folders = getFolders(uid);
  if (!folders[subject]) folders[subject] = [];
  saveFoldersLocal(uid, folders);

  // Tag as subject folder
  const tags = getSubjectTags(uid);
  if (!tags.includes(subject)) saveSubjectTags(uid, [...tags, subject]);

  // Profile
  const profile = getProfile(uid);
  const subjects = profile.subjects || [];
  const boards = profile.subjectBoards || {};
  if (!subjects.includes(subject)) {
    const newSubjects = [...subjects, subject];
    const newBoards = { ...boards, [subject]: board || "I'm not sure" };
    const updated = { ...profile, subjects: newSubjects, subjectBoards: newBoards };
    saveProfileLocal(uid, updated);
    await saveUserProfile(uid, { subjects: newSubjects, subjectBoards: newBoards });
    return updated;
  }
  return profile;
}

// ── Remove a subject folder (bin from SavedPage or uncheck in Settings) ───
export async function removeSubjectFolder(uid, subject) {
  // Folders — remove from localStorage
  const folders = getFolders(uid);
  const items = folders[subject] || [];
  delete folders[subject];
  const order = getFolderOrder(uid).filter(f => f !== subject);
  saveFoldersLocal(uid, folders, order);

  // Profile — remove subject
  const profile = getProfile(uid);
  const newSubjects = (profile.subjects || []).filter(s => s !== subject);
  const newBoards = { ...profile.subjectBoards };
  delete newBoards[subject];
  const updated = { ...profile, subjects: newSubjects, subjectBoards: newBoards };
  saveProfileLocal(uid, updated);
  await saveUserProfile(uid, { subjects: newSubjects, subjectBoards: newBoards });

  return { updatedProfile: updated, removedItems: items };
}

// ── Bulk setup (onboarding) ───────────────────────────────────────────────
export async function setupSubjectFolders(uid, subjectBoardMap, extraSubjects, profileData) {
  const folders = getFolders(uid);
  const subjectNames = [...Object.keys(subjectBoardMap), ...extraSubjects];

  subjectNames.forEach(s => { if (!folders[s]) folders[s] = []; });
  saveFoldersLocal(uid, folders, subjectNames);

  // Tag all as subject folders
  saveSubjectTags(uid, subjectNames);

  // Save profile
  saveProfileLocal(uid, profileData);
  await saveUserProfile(uid, profileData);
}

// ── Fetch fresh profile from Firestore and sync to localStorage ───────────
export async function syncProfileFromFirestore(uid) {
  try {
    const profile = await getUserProfile(uid);
    if (profile) {
      saveProfileLocal(uid, profile);
      // Ensure subject folder tags are consistent with profile
      const currentTags = getSubjectTags(uid);
      const subjectNames = profile.subjects || [];
      // Add any profile subjects not yet tagged
      const merged = [...new Set([...currentTags, ...subjectNames])];
      saveSubjectTags(uid, merged);
      return profile;
    }
  } catch (e) {
    console.error('profileSync: failed to sync from Firestore', e);
  }
  return getProfile(uid);
}
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import app from './firebase.js';

export const storage = getStorage(app);

// Upload a file to a folder
export async function uploadFileToFolder(userId, folderName, file, onProgress) {
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path = `users/${userId}/folders/${folderName}/${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        // Save metadata to Firestore
        const docRef = await addDoc(collection(db, 'uploaded_files'), {
          userId,
          folderName,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storagePath: path,
          downloadURL,
          createdAt: serverTimestamp(),
        });
        resolve({ id: docRef.id, fileName: file.name, downloadURL, fileType: file.type, fileSize: file.size, storagePath: path });
      }
    );
  });
}

// Get all uploaded files for a user in a folder
export async function getFilesInFolder(userId, folderName) {
  const q = query(
    collection(db, 'uploaded_files'),
    where('userId', '==', userId),
    where('folderName', '==', folderName)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// Get all uploaded files for a user
export async function getAllUploadedFiles(userId) {
  const q = query(
    collection(db, 'uploaded_files'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// Soft-delete a file (removes Firestore doc only, keeps Storage file)
export async function softDeleteFile(fileId) {
  await deleteDoc(doc(db, 'uploaded_files', fileId));
}

// Restore a file (re-adds Firestore doc, storage file still exists)
export async function restoreFileDoc(userId, fileData) {
  const { id, createdAt, ...rest } = fileData;
  await addDoc(collection(db, 'uploaded_files'), {
    ...rest,
    userId,
    createdAt: serverTimestamp(),
  });
}

// Delete a file permanently (storage + firestore)
export async function deleteFile(fileId, storagePath) {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
  await deleteDoc(doc(db, 'uploaded_files', fileId));
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileType) {
  if (fileType?.includes('pdf')) return '📄';
  if (fileType?.includes('image')) return '🖼';
  if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
  if (fileType?.includes('text')) return '📃';
  return '📎';
}
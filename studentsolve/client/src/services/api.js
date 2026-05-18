const BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function sendTutorMessage(message, history = []) {
  const res = await fetch(`${BASE}/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return handleResponse(res);
}

export async function markEssay(essayText, examBoard, subject, question = '') {
  const res = await fetch(`${BASE}/essay-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essayText, examBoard, subject, question }),
  });
  return handleResponse(res);
}

export async function generateYoutubeNotes(url) {
  const res = await fetch(`${BASE}/youtube-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return handleResponse(res);
}

export async function generateFlashcards(text = '', pdfFile = null) {
  const formData = new FormData();
  if (pdfFile) {
    formData.append('pdf', pdfFile);
  } else {
    formData.append('text', text);
  }
  const res = await fetch(`${BASE}/flashcards`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function sendOtp(email) {
  const res = await fetch(`${BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return handleResponse(res);
}
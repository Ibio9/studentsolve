import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tutorRoutes from './routes/tutor.js';
import essayRoutes from './routes/essay.js';
import youtubeRoutes from './routes/youtube.js';
import flashcardsRoutes from './routes/flashcards.js';
import authRoutes from './routes/auth.js';
import roadmapRoutes from './routes/roadmap.js';
import quickfireRoutes from './routes/quickfire.js';
import quickfireProgressRoutes from './routes/quickfireProgress.js';
import aiMemoryRoutes from './routes/aiMemory.js';
import revisionTimetableRoutes from './routes/revisionTimetable.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Railway's proxy so req.ip etc work correctly
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://studentsolve.com',
      'https://www.studentsolve.com',
      'https://studentsolve.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Health checks (must come BEFORE the 404 fallback) ---
// Railway's default healthcheck hits "/". If "/" 404s, Railway kills the container.
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'studentsolve-backend' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'StudentSolve backend is running.' });
});

// --- API Routes ---
app.use('/api/tutor', tutorRoutes);
app.use('/api/essay-feedback', essayRoutes);
app.use('/api/youtube-notes', youtubeRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/quickfire', quickfireRoutes);
app.use('/api/quickfire-progress', quickfireProgressRoutes);
app.use('/api/ai-memory', aiMemoryRoutes);
app.use('/api/revision-timetable', revisionTimetableRoutes);
app.use('/api/auth', authRoutes);

// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.', path: req.originalUrl });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// --- Start server ---
// Binding to 0.0.0.0 (not localhost) is required for Railway to route traffic.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`StudentSolve backend running on port ${PORT}`);
});

// --- Crash protection ---
// Without these, an unhandled rejection in one route handler can take down the whole container.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
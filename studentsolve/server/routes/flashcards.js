import express from 'express';
import multer from 'multer';
import { generateFlashcards } from '../controllers/flashcardsController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for upload.'));
    }
  },
});

router.post('/', upload.single('pdf'), generateFlashcards);

export default router;

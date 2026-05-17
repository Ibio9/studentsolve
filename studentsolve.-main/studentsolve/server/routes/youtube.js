import express from 'express';
import { generateNotes } from '../controllers/youtubeController.js';
import { requireBody } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/', requireBody('url'), generateNotes);

export default router;

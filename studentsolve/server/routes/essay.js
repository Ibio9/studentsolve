import express from 'express';
import { markEssay } from '../controllers/essayController.js';
import { requireBody } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/', requireBody('essayText', 'examBoard', 'subject'), markEssay);

export default router;

import express from 'express';
import { chat } from '../controllers/tutorController.js';
import { requireBody } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/', requireBody('message'), chat);

export default router;

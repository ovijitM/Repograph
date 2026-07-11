import express from 'express';
import { register, login, me, buyCredits } from '../controllers/authController.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/buy-credits', requireAuth, buyCredits);

export default router;

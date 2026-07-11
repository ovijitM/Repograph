import express from 'express';
import { requireAuth } from '../utils/authMiddleware.js';
import { requireAdmin } from '../utils/adminMiddleware.js';
import { getStats, getUsers, adjustCredits, getPayments, getUsages } from '../controllers/adminController.js';

const router = express.Router();

// Mount authentication & administration checks on all endpoints
router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users/:id/credits', adjustCredits);
router.get('/payments', getPayments);
router.get('/usages', getUsages);

export default router;

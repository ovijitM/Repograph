import express from 'express';
import { analyzeRepo, getReposList, getRepoDetails, getRepoBranches, getJobStatus, deleteRepo } from '../controllers/repoController.js';
import { chatRepo } from '../controllers/chatController.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = express.Router();

// Secure all downstream repository and chatbot interaction endpoints
router.use(requireAuth);

// Repository Routes
router.post('/repos/analyze', analyzeRepo);
router.get('/repos', getReposList);
router.get('/repos/:id', getRepoDetails);
router.get('/repos/:id/branches', getRepoBranches);
router.delete('/repos/:id', deleteRepo);

// Job Routes
router.get('/jobs/:id', getJobStatus);

// Chat Routes
router.post('/repos/:id/chat', chatRepo);

export default router;

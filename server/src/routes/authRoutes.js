import express from 'express';
import { register, login, me, createCheckoutSession, stripeWebhook } from '../controllers/authController.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

// Stripe: webhook must use raw body (registered before express.json in index.js)
router.post('/stripe-webhook', stripeWebhook);

// Stripe: create checkout session (authenticated)
router.post('/create-checkout-session', requireAuth, createCheckoutSession);

export default router;

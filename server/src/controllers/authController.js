import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import User from '../models/User.js';
import { addCredits } from '../utils/creditHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'repograph-secret-key-123';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Register a new user account.
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
    });
    await user.save();

    // Sign JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Log in to an existing account.
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({
      id: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create a Stripe Checkout Session for credit top-up.
 * POST /api/auth/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is not configured on this server.' });
  }

  const { pack } = req.body; // 'starter' | 'popular' | 'pro'

  const packConfig = {
    starter: { credits: 1000,  priceId: process.env.STRIPE_PRICE_STARTER },
    popular: { credits: 3000,  priceId: process.env.STRIPE_PRICE_POPULAR },
    pro:     { credits: 10000, priceId: process.env.STRIPE_PRICE_PRO     },
  };

  const selected = packConfig[pack];
  if (!selected || !selected.priceId) {
    return res.status(400).json({ error: 'Invalid credit pack selected. Please configure Stripe Price IDs.' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const appUrl = process.env.APP_URL || 'https://repograph.ovijit.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: selected.priceId, quantity: 1 }],
      metadata: {
        userId: req.userId.toString(),
        creditsToAdd: selected.credits.toString(),
        pack,
      },
      success_url: `${appUrl}?payment=success`,
      cancel_url:  `${appUrl}?payment=cancelled`,
      customer_email: user.email,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Handle Stripe webhook events (raw body required).
 * POST /api/auth/stripe-webhook
 */
export const stripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service not configured.' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, creditsToAdd } = session.metadata;

    try {
      const newBalance = await addCredits(userId, parseInt(creditsToAdd, 10));
      console.log(`Stripe payment complete: +${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
    } catch (err) {
      console.error('Failed to add credits after payment:', err);
      return res.status(500).json({ error: 'Failed to update credits.' });
    }
  }

  return res.status(200).json({ received: true });
};

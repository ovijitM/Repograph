import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'repograph-secret-key-123';

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
 * Purchase credits (mock flow).
 * POST /api/auth/buy-credits
 */
export const buyCredits = async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount parameters.' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.credits = (user.credits || 0) + amount;
    await user.save();

    console.log(`Mock Transaction: User ${user.email} purchased ${amount} credits. New balance: ${user.credits}`);

    return res.status(200).json({
      message: `Successfully purchased ${amount} credits!`,
      credits: user.credits,
    });
  } catch (error) {
    console.error('Buy credits error:', error);
    return res.status(500).json({ error: error.message });
  }
};

import User from '../models/User.js';

/**
 * Middleware to verify that the logged-in user is an Administrator.
 * Must be mounted downstream of requireAuth.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator credentials required.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

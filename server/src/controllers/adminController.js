import User from '../models/User.js';
import Payment from '../models/Payment.js';
import UsageLog from '../models/UsageLog.js';
import Repository from '../models/Repository.js';

/**
 * Fetch aggregate metrics and graph statistics.
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const payments = await Payment.find();
    
    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalRepos = await Repository.countDocuments();
    const totalChats = await UsageLog.countDocuments({ type: 'chat' });

    // 1. Group package sales (Starter / Popular / Pro)
    const packsCount = { starter: 0, popular: 0, pro: 0 };
    payments.forEach(p => {
      if (packsCount[p.pack] !== undefined) {
        packsCount[p.pack]++;
      }
    });

    // 2. User signups over time (for growth graph)
    // Group users by signup day (YYYY-MM-DD) for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growthStats = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      summary: {
        totalUsers,
        totalRevenue,
        totalRepos,
        totalChats,
      },
      packageSales: packsCount,
      growth: growthStats,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * List all users.
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Modify user credit count.
 * POST /api/admin/users/:id/credits
 */
export const adjustCredits = async (req, res) => {
  const { id } = req.params;
  const { credits } = req.body;

  if (credits === undefined || typeof credits !== 'number' || credits < 0) {
    return res.status(400).json({ error: 'Valid positive credits number required.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const prevCredits = user.credits || 0;
    user.credits = credits;
    await user.save();

    console.log(`[Admin Action] Adjusted user ${user.email} credits from ${prevCredits} to ${credits}`);

    return res.status(200).json({
      message: 'Credits updated successfully.',
      credits: user.credits,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * List all payments.
 * GET /api/admin/payments
 */
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * List all usage logs.
 * GET /api/admin/usages
 */
export const getUsages = async (req, res) => {
  try {
    const usages = await UsageLog.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json(usages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

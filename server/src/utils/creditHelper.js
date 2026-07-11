import User from '../models/User.js';

/**
 * Calculate the credit cost of analyzing a repository
 * based on its total number of files.
 *
 * Tiers:
 *   < 50 files    →  50 credits  (small)
 *   50–200 files  → 150 credits  (medium)
 *   > 200 files   → 300 credits  (large)
 */
export const calcRepoCost = (totalFiles) => {
  if (totalFiles < 50)  return 50;
  if (totalFiles < 200) return 150;
  return 300;
};

/** Flat credit cost per AI chat message */
export const CHAT_COST = 5;

/**
 * Atomically deduct `amount` credits from a user.
 * Returns { ok: true, remaining } on success.
 * Returns { ok: false, remaining } when balance is insufficient.
 */
export const deductCredits = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) return { ok: false, remaining: 0 };

  if ((user.credits || 0) < amount) {
    return { ok: false, remaining: user.credits || 0 };
  }

  user.credits -= amount;
  await user.save();
  return { ok: true, remaining: user.credits };
};

/**
 * Add credits to a user (e.g. after successful Stripe payment).
 * Returns the new credit balance.
 */
export const addCredits = async (userId, amount) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: amount } },
    { new: true }
  );
  return user ? user.credits : 0;
};

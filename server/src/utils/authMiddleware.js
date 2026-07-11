import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'repograph-secret-key-123';

/**
 * Express middleware to authenticate requests using JWT tokens.
 * Injects req.userId upon successful verification.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Token is expired or invalid.' });
  }
};

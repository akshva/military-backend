import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load .env file only in development (in production, env vars come from platform)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

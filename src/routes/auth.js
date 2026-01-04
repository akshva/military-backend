import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../db.js';

// Load .env file only in development (in production, env vars come from platform)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const router = express.Router();


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const q = `
      SELECT u.id, u.username, u.password_hash, r.name as role, u.base_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
    `;
    
    const result = await pool.query(q, [username]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, base_id: user.base_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, username: user.username, role: user.role, base_id: user.base_id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;


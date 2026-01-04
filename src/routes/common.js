import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// all bases 
router.get('/bases', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, location FROM bases ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  all equipment types 
router.get('/equipment-types', authenticateToken, async (req, res) => {
  try {

    const result = await pool.query('SELECT id, name, category FROM equipment_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


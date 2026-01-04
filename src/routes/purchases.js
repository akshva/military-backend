import express from 'express';
import { pool } from '../db.js';
import { requireRole, requireBaseScope } from '../middleware/rbac.js';
const router = express.Router();

router.post('/', 
  requireRole(['ADMIN', 'LOGISTICS_OFFICER']), 
  requireBaseScope,
  async (req, res) => {
    const { base_id, equipment_type_id, quantity } = req.body;
    
    try {
      await pool.query('BEGIN');
      
  
      const movementRes = await pool.query(
        `INSERT INTO stock_movements (base_id, equipment_type_id, movement_type, quantity)
         VALUES ($1, $2, 'PURCHASE', $3) RETURNING id`,
        [base_id, equipment_type_id, quantity]
      );
      
      await pool.query('COMMIT');
      res.json({ success: true, movement_id: movementRes.rows[0].id });
    } catch (error) {
      await pool.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    }
  }
);

//purchases history
router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']), async (req, res) => {
  try {
    const { base_id, equipment_type_id, start_date, end_date } = req.query;
    

    let effectiveBaseId = base_id;
    if (req.user.role !== 'ADMIN' && !base_id) {
      effectiveBaseId = req.user.base_id;
    }
    
    let query = `
      SELECT sm.*, et.name as equipment_name, b.name as base_name
      FROM stock_movements sm
      JOIN equipment_types et ON sm.equipment_type_id = et.id
      JOIN bases b ON sm.base_id = b.id
      WHERE sm.movement_type = 'PURCHASE'
    `;
    let params = [];
    let paramIndex = 1;

    if (effectiveBaseId) {
      query += ` AND sm.base_id = $${paramIndex}`;
      params.push(effectiveBaseId);
      paramIndex++;
    }

    if (equipment_type_id) {
      query += ` AND sm.equipment_type_id = $${paramIndex}`;
      params.push(equipment_type_id);
      paramIndex++;
    }

    if (start_date && end_date) {
      query += ` AND sm.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    query += ' ORDER BY sm.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Purchases history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

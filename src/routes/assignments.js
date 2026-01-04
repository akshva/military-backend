import express from 'express';
import { pool } from '../db.js';
import { requireRole, requireBaseScope } from '../middleware/rbac.js';

const router = express.Router();


router.post('/', 
  requireRole(['ADMIN', 'BASE_COMMANDER']), 
  requireBaseScope,
  async (req, res) => {
    const { base_id, equipment_type_id, assigned_to, quantity, is_expended = false } = req.body;
    
    const result = await pool.query(
      `INSERT INTO assignments (base_id, equipment_type_id, assigned_to, quantity, is_expended, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [base_id, equipment_type_id, assigned_to, quantity, is_expended, req.user.id]
    );
    
    res.json({ success: true, assignment_id: result.rows[0].id });
  }
);


router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER']), async (req, res) => {
  try {
    const { base_id } = req.query;
    

    let effectiveBaseId = base_id;
    if (req.user.role !== 'ADMIN' && !base_id) {
      effectiveBaseId = req.user.base_id;
    }
    
    let query = `
      SELECT a.*, et.name as equipment_name, b.name as base_name
      FROM assignments a
      JOIN equipment_types et ON a.equipment_type_id = et.id
      JOIN bases b ON a.base_id = b.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (effectiveBaseId) {
      query += ` AND a.base_id = $${paramIndex}`;
      params.push(effectiveBaseId);
      paramIndex++;
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Assignments history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

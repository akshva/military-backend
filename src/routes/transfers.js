import express from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();  

// transfer
router.post('/', 
  requireRole(['ADMIN', 'LOGISTICS_OFFICER']), 
  async (req, res) => {
    const { from_base_id, to_base_id, equipment_type_id, quantity } = req.body;
    
    if (req.user.role !== 'ADMIN' && parseInt(from_base_id) !== req.user.base_id) {
      return res.status(403).json({ error: 'You can only transfer from your assigned base' });
    }
    
    if (from_base_id === to_base_id) {
      return res.status(400).json({ error: 'From base and To base cannot be the same' });
    }
    
    try {
      await pool.query('BEGIN');
      
      const transferRes = await pool.query(
        `INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [from_base_id, to_base_id, equipment_type_id, quantity, req.user.id]
      );
      
      const transferId = transferRes.rows[0].id;
      
      await pool.query(
        `INSERT INTO stock_movements (base_id, equipment_type_id, movement_type, quantity, ref_transfer_id)
         VALUES ($1, $2, 'TRANSFER_OUT', $3, $4)`,
        [from_base_id, equipment_type_id, quantity, transferId]
      );
      
      await pool.query(
        `INSERT INTO stock_movements (base_id, equipment_type_id, movement_type, quantity, ref_transfer_id)
         VALUES ($1, $2, 'TRANSFER_IN', $3, $4)`,
        [to_base_id, equipment_type_id, quantity, transferId]
      );
      
      await pool.query('COMMIT');
      res.json({ success: true, transfer_id: transferId });
    } catch (error) {
      await pool.query('ROLLBACK').catch(() => {});
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']), async (req, res) => {
  try {
    let query = `
      SELECT t.*, fb.name as from_base, tb.name as to_base, et.name as equipment
      FROM transfers t
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN equipment_types et ON t.equipment_type_id = et.id
      WHERE 1=1
    `;
    let params = [];
    

    if (req.user.role !== 'ADMIN') {
      query += ` AND (t.from_base_id = $1 OR t.to_base_id = $1)`;
      params.push(req.user.base_id);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Transfers history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;  

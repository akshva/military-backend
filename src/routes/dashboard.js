import express from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();


router.get('/metrics', requireRole(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']), async (req, res) => {
  try {
    const { base_id, equipment_type_id, start_date, end_date } = req.query;
    

    let effectiveBaseId = base_id;
    if (req.user.role !== 'ADMIN' && !base_id) {
      effectiveBaseId = req.user.base_id;
    }
    

    let baseFilter = '';
    let params = [];
    let paramIndex = 1;
    
    if (effectiveBaseId) {
      baseFilter = ` AND sm.base_id = $${paramIndex}`;
      params.push(effectiveBaseId);
      paramIndex++;
    }
    

    let equipmentFilter = '';
    if (equipment_type_id) {
      equipmentFilter = ` AND sm.equipment_type_id = $${paramIndex}`;
      params.push(equipment_type_id);
      paramIndex++;
    }
    
   
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = ` AND sm.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }
    
    // balance 
    let openingParams = [...params];
    let openingDateFilter = '';
    if (start_date) {
      openingDateFilter = ` AND sm.created_at < $${paramIndex}`;
      openingParams.push(start_date);
    }
    
    const openingQuery = `
      SELECT COALESCE(SUM(
        CASE 
          WHEN sm.movement_type = 'PURCHASE' THEN sm.quantity
          WHEN sm.movement_type = 'TRANSFER_IN' THEN sm.quantity
          WHEN sm.movement_type = 'TRANSFER_OUT' THEN -sm.quantity
        END
      ), 0) as opening_balance
      FROM stock_movements sm
      WHERE 1=1 ${baseFilter} ${equipmentFilter} ${openingDateFilter}
    `;
    const openingResult = await pool.query(openingQuery, openingParams);
    
   //movement
    const netMovementQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN sm.movement_type = 'PURCHASE' THEN sm.quantity END), 0) as purchases,
        COALESCE(SUM(CASE WHEN sm.movement_type = 'TRANSFER_IN' THEN sm.quantity END), 0) as transfer_in,
        COALESCE(SUM(CASE WHEN sm.movement_type = 'TRANSFER_OUT' THEN sm.quantity END), 0) as transfer_out,
        COALESCE(SUM(
          CASE 
            WHEN sm.movement_type = 'PURCHASE' THEN sm.quantity
            WHEN sm.movement_type = 'TRANSFER_IN' THEN sm.quantity
            WHEN sm.movement_type = 'TRANSFER_OUT' THEN -sm.quantity
          END
        ), 0) as net_movement
      FROM stock_movements sm
      WHERE 1=1 ${baseFilter} ${equipmentFilter} ${dateFilter}
    `;
    const netResult = await pool.query(netMovementQuery, params);
    
   
    let assignedParams = [];
    let assignedBaseFilter = '';
    let assignedEquipmentFilter = '';
    let assignedDateFilter = '';
    let assignedParamIndex = 1;
    
    if (effectiveBaseId) {
      assignedBaseFilter = ` AND a.base_id = $${assignedParamIndex}`;
      assignedParams.push(effectiveBaseId);
      assignedParamIndex++;
    }
    
    if (equipment_type_id) {
      assignedEquipmentFilter = ` AND a.equipment_type_id = $${assignedParamIndex}`;
      assignedParams.push(equipment_type_id);
      assignedParamIndex++;
    }
    
    if (start_date && end_date) {
      assignedDateFilter = ` AND a.created_at BETWEEN $${assignedParamIndex} AND $${assignedParamIndex + 1}`;
      assignedParams.push(start_date, end_date);
    }
    
    const assignedQuery = `
      SELECT 
        COALESCE(SUM(quantity), 0) as total_assigned,
        COALESCE(SUM(CASE WHEN is_expended THEN quantity ELSE 0 END), 0) as expended
      FROM assignments a
      WHERE 1=1 ${assignedBaseFilter} ${assignedEquipmentFilter} ${assignedDateFilter}
    `;
    const assignedResult = await pool.query(assignedQuery, assignedParams);
    

    const openingBalance = parseInt(openingResult.rows[0].opening_balance) || 0;
    const netMovement = parseInt(netResult.rows[0].net_movement) || 0;
    const totalAssigned = parseInt(assignedResult.rows[0].total_assigned) || 0;
    const closing_balance = openingBalance + netMovement - totalAssigned;
    
    res.json({
      opening_balance: openingBalance,
      purchases: parseInt(netResult.rows[0].purchases) || 0,
      transfer_in: parseInt(netResult.rows[0].transfer_in) || 0,
      transfer_out: parseInt(netResult.rows[0].transfer_out) || 0,
      net_movement: netMovement,
      closing_balance: closing_balance,
      assigned: totalAssigned,
      expended: parseInt(assignedResult.rows[0].expended) || 0
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

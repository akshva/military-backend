import { pool } from '../db.js';

export function apiLogger(req, res, next) {  
  const start = Date.now();
  const oldSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userId = req.user?.id || null;

    pool.query(
      'INSERT INTO api_logs (user_id, method, path, status_code, payload) VALUES ($1,$2,$3,$4,$5)',
      [userId, req.method, req.path, status, JSON.stringify(req.body || {})]
    ).catch(() => {});  

    return oldSend.call(this, data);
  };

  next();
}

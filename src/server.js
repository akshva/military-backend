import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authenticateToken } from './middleware/auth.js';
import { apiLogger } from './middleware/logger.js';

// Load .env file only in development (in production, env vars come from platform)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

// CORS configuration - use FRONTEND_URL if set, otherwise allow all origins
const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());


app.use(apiLogger);

// routes 
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import purchasesRoutes from './routes/purchases.js';
import transfersRoutes from './routes/transfers.js';
import assignmentsRoutes from './routes/assignments.js';
import commonRoutes from './routes/common.js';

app.use('/api/auth', authRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/purchases', authenticateToken, purchasesRoutes);
app.use('/api/transfers', authenticateToken, transfersRoutes);
app.use('/api/assignments', authenticateToken, assignmentsRoutes);


app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Test login: POST /api/auth/login {"username":"admin","password":"password"}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} is already in use.`);
    console.error(` Try one of these solutions:`);
    console.error(`   1. Kill the process using port ${PORT}:`);
    console.error(`      Windows: netstat -ano | findstr :${PORT} then taskkill /PID <PID> /F`);
    console.error(`      Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   2. Change the PORT in your .env file`);
    process.exit(1);
  } else {
    throw err;
  }
});

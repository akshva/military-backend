import pkg from 'pg';
import dotenv from 'dotenv';

// Load .env file only in development (in production, env vars come from platform)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/military_assets',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('✅ Connected to PostgreSQL');
});

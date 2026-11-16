import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const host = process.env.DB_HOST || '';
const explicitSsl = process.env.DB_SSL;
const shouldUseSsl = explicitSsl === undefined
  ? /render\.com|postgres|supabase|neon|railway/i.test(host)
  : explicitSsl.toLowerCase() === 'true';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false
});

export default pool;

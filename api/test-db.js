import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = '',
  DB_PASSWORD = '',
  DB_NAME = '',
} = process.env;

console.log('Connecting with:', { host: DB_HOST, port: DB_PORT, user: DB_USER, database: DB_NAME });

try {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  const conn = await pool.getConnection();
  console.log('✅ Database connection OK');
  conn.release();
  await pool.end();
  process.exit(0);
} catch (err) {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
}

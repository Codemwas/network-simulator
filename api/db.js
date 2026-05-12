import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('./.env', import.meta.url).pathname })

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = '',
  DB_PASSWORD = '',
  DB_NAME = '',
} = process.env;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

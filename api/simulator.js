import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('./.env', import.meta.url).pathname })

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = '',
  DB_PASSWORD = '',
  DB_NAME = '',
} = process.env

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 2,
})

// Simulate network fluctuations every 5 seconds
async function simulateNetwork() {
  while (true) {
    try {
      const conn = await pool.getConnection()
      
      // Randomly update a few connections
      const [rows] = await conn.query(
        `SELECT id FROM connections WHERE status = 'up' ORDER BY RAND() LIMIT 3`
      )
      
      for (const row of rows) {
        const newBw = Math.floor(Math.random() * 800) + 100   // 100-900 Mbps
        const newLat = Math.floor(Math.random() * 60) + 1     // 1-60 ms
        const newStatus = Math.random() < 0.1 ? 'down' : 'up' // 10% chance of downtime
        
        await conn.query(
          `UPDATE connections 
           SET bandwidth_mbps = ?, latency_ms = ?, status = ?
           WHERE id = ?`,
          [newBw, newLat, newStatus, row.id]
        )
      }
      
      // Occasionally flip a down connection to up
      const [downRows] = await conn.query(
        `SELECT id FROM connections WHERE status = 'down' ORDER by RAND() LIMIT 1`
      )
      if (downRows.length > 0 && Math.random() < 0.3) {
        await conn.query(
          `UPDATE connections SET status = 'up' WHERE id = ?`,
          [downRows[0].id]
        )
      }
      
      conn.release()
    } catch (err) {
      console.error('Simulation error:', err.message)
    }
    
    // Wait 5 seconds before next update
    await new Promise(r => setTimeout(r, 5000))
  }
}

console.log('Network simulator started (updates every 5s)...')
void simulateNetwork().catch(err => {
  console.error('Fatal simulation error:', err)
  process.exit(1)
})

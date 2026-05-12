import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/metrics', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         AVG(bandwidth_mbps) AS avg_bandwidth,
         AVG(latency_ms) AS avg_latency
       FROM connections
       WHERE status = 'up'`
    )

    const avgBandwidth = Number(rows?.[0]?.avg_bandwidth ?? 0)
    const avgLatency = Number(rows?.[0]?.avg_latency ?? 0)

    res.json({
      bandwidth: Math.round(avgBandwidth * 10) / 10,
      latency: Math.round(avgLatency),
      packetLoss: 0,
    })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load metrics',
      details: String(err?.message ?? err),
    })
  }
})

const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log('API server listening on http://localhost:' + PORT)
})

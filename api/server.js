import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

// GET /api/metrics - Aggregate network metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const [connRows] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
         AVG(bandwidth_mbps) AS avg_bandwidth,
         AVG(latency_ms) AS avg_latency
       FROM connections`
    )

    const stats = connRows?.[0] || {}
    const total = Number(stats.total) || 1
    const upCount = Number(stats.up_count) || 0

    res.json({
      bandwidth: Math.round(((Number(stats.avg_bandwidth) || 0) * 10) / 10),
      latency: Math.round(Number(stats.avg_latency) || 0),
      packetLoss: Math.round(((total - upCount) / total) * 100),
      totalConnections: total,
      activeConnections: upCount
    })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load metrics',
      details: String(err?.message ?? err),
    })
  }
})

// GET /api/bandwidth-history - Historical bandwidth (last 24h)
app.get('/api/bandwidth-history', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        HOUR(created_at) as hour,
        AVG(bandwidth_mbps) as avg_bandwidth
      FROM connections
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `)

    let history = []
    const now = new Date()
    const currentHour = now.getHours()

    if (rows && rows.length > 0) {
      const hourToBw = {}
      rows.forEach(r => {
        hourToBw[r.hour] = Math.round(r.avg_bandwidth)
      })
      const values = Object.values(hourToBw)
      const globalAvg = values.length > 0 
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 500

      for (let i = 0; i < 24; i++) {
        const hour = (currentHour - 23 + i + 24) % 24
        const bw = hourToBw[hour] !== undefined 
          ? hourToBw[hour] 
          : Math.round(globalAvg * (0.85 + Math.random() * 0.3))
        history.push({
          time: `${String(hour).padStart(2, '0')}:00`,
          bandwidth: bw
        })
      }
    } else {
      for (let i = 0; i < 24; i++) {
        history.push({
          time: `${String(i).padStart(2, '0')}:00`,
          bandwidth: 500
        })
      }
    }

    res.json({ history })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load bandwidth history',
      details: String(err?.message ?? err),
    })
  }
})

// GET /api/devices - Active devices with simulated Fing-like data
app.get('/api/devices', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        n.id,
        n.node_name,
        n.node_type,
        n.ip_address,
        n.mac_address,
        n.status,
        COUNT(c.id) as connection_count,
        MAX(c.bandwidth_mbps) as max_bandwidth,
        AVG(c.latency_ms) as avg_latency
      FROM nodes n
      LEFT JOIN connections c ON n.id = c.source_node OR n.id = c.target_node
      WHERE n.status = 'active'
      GROUP BY n.id
      ORDER BY n.node_type, n.node_name
    `)

    // Get blacklisted and whitelisted device IDs in parallel
    const [blacklistRows] = await pool.query('SELECT device_id FROM device_blacklist')
    const [whitelistRows] = await pool.query('SELECT device_id FROM device_whitelist')
    
    const blacklistedIds = new Set(blacklistRows.map(r => r.device_id))
    const whitelistedIds = new Set(whitelistRows.map(r => r.device_id))

    const deviceProfiles = {
      router: { vendor: 'Cisco', model: 'ISR 4321', os: 'IOS XE 17.9', openPorts: [22, 23, 80, 443, 161, 514], risk: 'low' },
      switch: { vendor: 'Cisco', model: 'Catalyst 2960', os: 'IOS 15.2', openPorts: [22, 80, 443, 161, 199], risk: 'low' },
      server: { vendor: 'Dell EMC', model: 'PowerEdge R740', os: 'Ubuntu 22.04 LTS', openPorts: [22, 25, 53, 80, 110, 143, 443, 3306, 8080, 9200], risk: 'medium' },
      client: { vendor: 'Apple', model: 'MacBook Pro', os: 'macOS 14.5', openPorts: [22, 80, 443, 5353, 7000], risk: 'low' },
      firewall: { vendor: 'Palo Alto', model: 'PA-3220', os: 'PAN-OS 11.0', openPorts: [22, 443, 444, 3978], risk: 'low' }
    }

    const devices = rows.map(row => {
      const profile = deviceProfiles[row.node_type] || { vendor: 'Unknown', model: 'Generic', os: 'Unknown', openPorts: [], risk: 'unknown' }
      const macOUI = { 'Cisco': '00:1A:2B', 'Dell EMC': '00:14:22', 'Apple': '00:1C:B3', 'Palo Alto': '00:0C:29', 'Unknown': 'FF:FF:FF' }[profile.vendor] || 'FF:FF:FF'
      const randomSuffix = Math.random().toString(16).substr(2, 6).match(/.{1,2}/g)?.join(':') || '00:00:00'
      const mac = row.mac_address || `${macOUI}:${randomSuffix}`.toUpperCase()

      return {
        id: row.id,
        name: row.node_name,
        type: row.node_type,
        ip: row.ip_address,
        mac,
        status: row.status,
        vendor: profile.vendor,
        model: profile.model,
        os: profile.os,
        openPorts: profile.openPorts,
        risk: profile.risk,
        connections: Number(row.connection_count) || 0,
        bandwidth: Math.round(Number(row.max_bandwidth) || 0),
        latency: Math.round(Number(row.avg_latency) || 0),
        isBlacklisted: blacklistedIds.has(row.id),
        isWhitelisted: whitelistedIds.has(row.id)
      }
    })

    res.json({ devices })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load devices',
      details: String(err?.message ?? err),
    })
  }
})

// DELETE /api/devices/:id - Remove/disconnect a device (set inactive and clear connections)
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId || deviceId <= 0) {
      return res.status(400).json({ error: 'Invalid device ID' })
    }

    // Check device exists
    const [deviceRows] = await pool.query('SELECT id, node_name FROM nodes WHERE id = ?', [deviceId])
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }
    const device = deviceRows[0]

    // Delete all connections involving this device
    await pool.query('DELETE FROM connections WHERE source_node = ? OR target_node = ?', [deviceId, deviceId])

    // Set device status to inactive
    await pool.query("UPDATE nodes SET status = 'inactive' WHERE id = ?", [deviceId])

    res.json({ success: true, message: `${device.node_name} has been disconnected and removed` })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to remove device',
      details: String(err?.message ?? err),
    })
  }
})

// POST /api/devices/:id/blacklist - Add device to blacklist
app.post('/api/devices/:id/blacklist', async (req, res) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId || deviceId <= 0) {
      return res.status(400).json({ error: 'Invalid device ID' })
    }

    // Get device details including node_type for MAC generation if needed
    const [deviceRows] = await pool.query('SELECT id, node_name, node_type, mac_address FROM nodes WHERE id = ?', [deviceId])
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }
    const device = deviceRows[0]

    // Generate/store MAC if missing
    let macAddress = device.mac_address
    if (!macAddress) {
      const vendorOUI = {
        router: '00:1A:2B',
        switch: '00:1A:2B',
        server: '00:14:22',
        client: '00:1C:B3',
        firewall: '00:0C:29'
      }[device.node_type] || 'FF:FF:FF'

      const randomSuffix = Math.random().toString(16).substr(2, 6).match(/.{1,2}/g)?.join(':') || '00:00:00'
      macAddress = `${vendorOUI}:${randomSuffix}`.toUpperCase()

      await pool.query('UPDATE nodes SET mac_address = ? WHERE id = ?', [macAddress, deviceId])
    }

    // Check if already blacklisted
    const [existing] = await pool.query('SELECT id FROM device_blacklist WHERE device_id = ?', [deviceId])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Device is already blacklisted' })
    }

     // Insert into blacklist
     const { reason } = req.body || {}
     await pool.query(
       'INSERT INTO device_blacklist (device_id, mac_address, reason) VALUES (?, ?, ?)',
       [deviceId, macAddress, reason || 'Blocked by admin']
     )

    res.json({ success: true, message: `${device.node_name} has been blacklisted` })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to blacklist device',
      details: String(err?.message ?? err),
    })
  }
})

// DELETE /api/devices/:id/blacklist - Remove device from blacklist
app.delete('/api/devices/:id/blacklist', async (req, res) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId || deviceId <= 0) {
      return res.status(400).json({ error: 'Invalid device ID' })
    }

    // Check device exists
    const [deviceRows] = await pool.query('SELECT node_name FROM nodes WHERE id = ?', [deviceId])
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }
    const device = deviceRows[0]

    const [result] = await pool.query('DELETE FROM device_blacklist WHERE device_id = ?', [deviceId])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Device is not in blacklist' })
    }

    res.json({ success: true, message: `${device.node_name} has been removed from blacklist` })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to remove from blacklist',
      details: String(err?.message ?? err),
    })
  }
})

// POST /api/devices/:id/whitelist - Add device to whitelist
app.post('/api/devices/:id/whitelist', async (req, res) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId || deviceId <= 0) {
      return res.status(400).json({ error: 'Invalid device ID' })
    }

    // Get device details including node_type for MAC generation if needed
    const [deviceRows] = await pool.query('SELECT id, node_name, node_type, mac_address FROM nodes WHERE id = ?', [deviceId])
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }
    const device = deviceRows[0]

    // Generate/store MAC if missing
    let macAddress = device.mac_address
    if (!macAddress) {
      const vendorOUI = {
        router: '00:1A:2B',
        switch: '00:1A:2B',
        server: '00:14:22',
        client: '00:1C:B3',
        firewall: '00:0C:29'
      }[device.node_type] || 'FF:FF:FF'

      const randomSuffix = Math.random().toString(16).substr(2, 6).match(/.{1,2}/g)?.join(':') || '00:00:00'
      macAddress = `${vendorOUI}:${randomSuffix}`.toUpperCase()

      await pool.query('UPDATE nodes SET mac_address = ? WHERE id = ?', [macAddress, deviceId])
    }

    // Check if already whitelisted
    const [existing] = await pool.query('SELECT id FROM device_whitelist WHERE device_id = ?', [deviceId])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Device is already whitelisted' })
    }

    // Insert into whitelist
    await pool.query(
      'INSERT INTO device_whitelist (device_id, mac_address) VALUES (?, ?)',
      [deviceId, macAddress]
    )

    // If device was blacklisted, remove from blacklist (whitelist overrides blacklist)
    await pool.query('DELETE FROM device_blacklist WHERE device_id = ?', [deviceId])

    res.json({ success: true, message: `${device.node_name} has been added to whitelist` })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to whitelist device',
      details: String(err?.message ?? err),
    })
  }
})

// DELETE /api/devices/:id/whitelist - Remove device from whitelist
app.delete('/api/devices/:id/whitelist', async (req, res) => {
  try {
    const deviceId = Number(req.params.id)
    if (!deviceId || deviceId <= 0) {
      return res.status(400).json({ error: 'Invalid device ID' })
    }

    // Check device exists
    const [deviceRows] = await pool.query('SELECT node_name FROM nodes WHERE id = ?', [deviceId])
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }
    const device = deviceRows[0]

    const [result] = await pool.query('DELETE FROM device_whitelist WHERE device_id = ?', [deviceId])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Device is not in whitelist' })
    }

    res.json({ success: true, message: `${device.node_name} has been removed from whitelist` })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to remove from whitelist',
      details: String(err?.message ?? err),
    })
  }
})

// GET /api/topology - Nodes and links for graph visualization
app.get('/api/topology', async (req, res) => {
  try {
    const [nodesRows] = await pool.query(`
      SELECT id, node_name, node_type, ip_address, status
      FROM nodes
      ORDER BY node_type, node_name
    `)

    const [linksRows] = await pool.query(`
      SELECT c.id, c.source_node, c.target_node, c.bandwidth_mbps, c.latency_ms, c.status,
             n1.node_name as source_name, n2.node_name as target_name
      FROM connections c
      JOIN nodes n1 ON c.source_node = n1.id
      JOIN nodes n2 ON c.target_node = n2.id
    `)

    const nodes = nodesRows.map(row => ({
      id: row.id,
      name: row.node_name,
      type: row.node_type,
      ip: row.ip_address,
      status: row.status
    }))

    const links = linksRows.map(row => ({
      id: row.id,
      source: row.source_node,
      target: row.target_node,
      sourceName: row.source_name,
      targetName: row.target_name,
      bandwidth: Number(row.bandwidth_mbps) || 0,
      latency: Number(row.latency_ms) || 0,
      status: row.status || 'up'
    }))

    res.json({ nodes, links })
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load topology',
      details: String(err?.message ?? err),
    })
  }
})

// GET /api/stream - Server-Sent Events for real-time metrics
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const sendMetrics = async () => {
    try {
      const [connRows] = await pool.query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
           AVG(bandwidth_mbps) AS avg_bandwidth,
           AVG(latency_ms) AS avg_latency
         FROM connections`
      )

      const stats = connRows?.[0] || {}
      const total = Number(stats.total) || 1
      const upCount = Number(stats.up_count) || 0

      const metrics = {
        bandwidth: Math.round(((Number(stats.avg_bandwidth) || 0) * 10) / 10),
        latency: Math.round(Number(stats.avg_latency) || 0),
        packetLoss: Math.round(((total - upCount) / total) * 100),
        totalConnections: total,
        activeConnections: upCount,
        timestamp: new Date().toISOString()
      }

      res.write(`data: ${JSON.stringify(metrics)}\n\n`)
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to fetch metrics' })}\n\n`)
    }
  }

  sendMetrics()
  const interval = setInterval(sendMetrics, 2000)

  req.on('close', () => {
    clearInterval(interval)
    res.end()
  })
})

const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => {
  console.log('API server listening on http://localhost:' + PORT)
})

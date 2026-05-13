#!/bin/bash
# Start the network simulator (both API, simulator and frontend)

echo "Starting Network Simulation Platform..."

# Check if API server is already running
if ! pgrep -f "node.*server.js" > /dev/null; then
  echo "Starting API server on port 3000..."
  node api/server.js > /tmp/network-sim-api.log 2>&1 &
  echo "API server started (PID: $!)"
  sleep 2
else
  echo "API server already running"
fi

# Check if simulator is already running
if ! pgrep -f "node.*simulator.js" > /dev/null; then
  echo "Starting network simulator (real-time updates)..."
  node api/simulator.js > /tmp/network-sim-sim.log 2>&1 &
  echo "Simulator started (PID: $!)"
  sleep 1
else
  echo "Network simulator already running"
fi

# Check if Vite dev server is already running
if ! pgrep -f "vite" > /dev/null; then
  echo "Starting frontend dev server on port 5173..."
  nohup npm run dev > /tmp/network-sim-vite.log 2>&1 &
  echo "Frontend dev server started"
  sleep 3
else
  echo "Frontend dev server already running"
fi

echo ""
echo "Network Simulator is running!"
echo "  Dashboard:    http://localhost:5173/dashboard"
echo "  Devices:      http://localhost:5173/devices"
echo "  Topology:     http://localhost:5173/topology"
echo "  Speed Test:   http://localhost:5173/speed-test"
echo "  Security:     http://localhost:5173/vulnerabilities"
echo ""
echo "Press Ctrl+C to stop (or run: ./stop.sh)"

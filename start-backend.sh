#!/bin/bash
# Start the Network Simulation API server and simulator

cd "$(dirname "$0")"

echo "Starting Network Simulation Backend..."

# Start API server
echo "  - API server (port 3000)"
node api/server.js &
API_PID=$!
echo "    PID: $API_PID"

# Wait for API to be ready
sleep 2

# Start simulator
echo "  - Network simulator (real-time updates)"
node api/simulator.js &
SIM_PID=$!
echo "    PID: $SIM_PID"

echo ""
echo "Backend services running:"
echo "  API:        http://localhost:3000"
echo "  Simulator:  PID $SIM_PID"

# Save PIDs for later stopping
echo "$API_PID" > .api.pid
echo "$SIM_PID" > .sim.pid

echo ""
echo "To stop: kill \$(cat .api.pid) \$(cat .sim.pid)"
echo "Or run: npm run stop-backend"

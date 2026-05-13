#!/bin/bash
# Stop all network simulator services

echo "Stopping Network Simulation Platform..."

pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*simulator.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "All services stopped."

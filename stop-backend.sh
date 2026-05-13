#!/bin/bash
# Stop the Network Simulation backend services

if [ -f .api.pid ]; then
  kill \$(cat .api.pid) 2>/dev/null && echo "API server stopped" || echo "API server not running"
  rm -f .api.pid
fi

if [ -f .sim.pid ]; then
  kill \$(cat .sim.pid) 2>/dev/null && echo "Simulator stopped" || echo "Simulator not running"
  rm -f .sim.pid
fi

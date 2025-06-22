#!/bin/bash

# Start All Services Script for MapExplorer Complete
# This script starts both the Vue.js frontend and Python backend services

echo "[START-ALL] MapExplorer Complete - Starting all services..."
echo "[START-ALL] =================================================="

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "[START-ALL] Shutting down all services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Xvfb for headless display (needed for Selenium)
echo "[START-ALL] Starting virtual display (Xvfb)..."

# Kill any existing Xvfb processes on display 99
pkill -f "Xvfb :99" 2>/dev/null || true
sleep 1

# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99
sleep 3

# Check installations
echo "[START-ALL] Verifying installations..."
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo "  npm: $(npm --version 2>/dev/null || echo 'Not found')"
echo "  Python: $(python3 --version 2>/dev/null || echo 'Not found')"
echo "  Chrome: $(google-chrome --version 2>/dev/null || echo 'Not found')"
echo "  ChromeDriver: $(chromedriver --version 2>/dev/null || echo 'Not found')"

# Install npm dependencies if node_modules doesn't exist (frontend already built)
echo "[START-ALL] Frontend dependencies already installed during build"
echo "[START-ALL] Frontend already built during Docker build stage"

# Start nginx (serves the built Vue.js app and proxies API calls)
echo "[START-ALL] Starting nginx web server..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Start backend Node.js server on port 3001 (internal)
if [ -f "./backend/package.json" ]; then
    echo "[START-ALL] Starting backend Node.js server on port 3001..."
    cd backend && PORT=3001 npm start &
    cd ..
    BACKEND_PID=$!
    sleep 3
fi

echo "[START-ALL] All services started successfully!"
echo "[START-ALL] =================================="
echo "[START-ALL] Application: http://*.lci9.com:3010 (all subdomains supported)"
echo "[START-ALL] Frontend: Served by nginx on port 3010"
echo "[START-ALL] Backend API: Proxied via nginx /api/ -> port 3001"
echo "[START-ALL] Python Scripts: Available for execution"
echo "[START-ALL] =================================="
echo "[START-ALL] Press Ctrl+C to stop all services"

# Keep container running and wait for all background processes
wait

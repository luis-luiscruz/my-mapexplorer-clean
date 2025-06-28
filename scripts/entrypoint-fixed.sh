#!/bin/bash

# Docker entrypoint script for MapExplorer (Vue.js + Python Selenium)

echo "[DOCKER] 🐳 MapExplorer Container Starting..."
echo "[DOCKER] Environment: $DOCKER_ENV"
echo "[DOCKER] User: $(whoami)"
echo "[DOCKER] Working directory: $(pwd)"

# Start Xvfb for headless display (virtual framebuffer)
echo "[DOCKER] 📺 Starting virtual display (Xvfb)..."
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait a moment for Xvfb to start
sleep 2

# Check if Chrome is available
echo "[DOCKER] 🔍 Checking Chrome installation..."
google-chrome --version
echo "[DOCKER] 🔍 Checking ChromeDriver installation..."
chromedriver --version

# Check Python and dependencies
echo "[DOCKER] 🐍 Python version:"
python3 --version
echo "[DOCKER] 🔍 Selenium version:"
python3 -c "import selenium; print(f'Selenium: {selenium.__version__}')" 2>/dev/null || echo "Selenium not found"

# Check Node.js for frontend/backend
echo "[DOCKER] 🟢 Node.js version:"
node --version 2>/dev/null || echo "Node.js not found"
echo "[DOCKER] 📦 NPM version:"
npm --version 2>/dev/null || echo "NPM not found"

echo "[DOCKER] ✅ Environment ready!"
echo "[DOCKER] 📊 Available services:"
echo "[DOCKER]    - Chrome + Selenium (headless)"
echo "[DOCKER]    - Python scripts in backend/scripts/"
echo "[DOCKER]    - Vue.js frontend support"
echo "[DOCKER]    - Node.js backend support"

# Execute the command passed to the container
echo "[DOCKER] 🚀 Executing command: $@"
exec "$@" 
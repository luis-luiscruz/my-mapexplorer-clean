#!/bin/bash
set -e

echo "Starting MapExplorer application (Slim)..."

# The frontend is already built during Docker build process
# No need to rebuild it at runtime since the dist folder is already copied

# Start the Node.js backend server (which now also serves the frontend)
echo "Starting backend server on port $PORT (serving frontend and API)..."
cd /app/backend && node database/server.js

echo "MapExplorer application started successfully!"

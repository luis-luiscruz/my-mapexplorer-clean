#!/bin/bash
set -e

echo "Starting MapExplorer application..."

# Start Selenium grid in background if not already running
if ! pgrep -f "selenium" > /dev/null; then
    echo "Starting Selenium Grid..."
    /opt/bin/entry_point.sh &
    sleep 5
fi

# Start the Node.js backend server in background
echo "Starting backend server on port $PORT..."
cd /app/backend && node database/server.js &

# Serve frontend static files using Node.js
echo "Starting frontend server on port $PORT..."
cd /app && node -e "
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3010;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Frontend server running on port \${PORT}\`);
});
"

# Wait for all background processes
wait

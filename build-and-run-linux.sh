#!/bin/bash

# Linux Server Build and Run Script for MapExplorer Complete
echo "🐧 Building MapExplorer for Linux Server..."
echo "================================================"

# Stop and remove any existing container
echo "🔄 Cleaning up existing containers..."
docker stop my-mapexplorer-app 2>/dev/null || true
docker rm my-mapexplorer-app 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t my-mapexplorer-complete:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully!"

# Run the container
echo "🚀 Starting container on port 3015..."
docker run -d \
    --name my-mapexplorer-app \
    -p 3015:3010 \
    --restart unless-stopped \
    my-mapexplorer-complete:latest

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

echo "✅ Container started successfully!"
echo "📡 Application running on: http://localhost:3015"
echo "🔍 Health check: http://localhost:3015/health"
echo "📊 API status: http://localhost:3015/api/connection-status"

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker logs my-mapexplorer-app --tail 20

echo ""
echo "🎉 Setup complete! Your application should be running on:"
echo "   🌐 http://your-server-ip:3015"
echo ""
echo "💡 To check logs: docker logs my-mapexplorer-app"
echo "💡 To stop: docker stop my-mapexplorer-app"

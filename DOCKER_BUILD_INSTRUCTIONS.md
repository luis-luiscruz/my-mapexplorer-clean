# Docker Build Instructions - MapExplorer

## Overview
This guide provides step-by-step instructions to build a production-ready Docker image for the MapExplorer project. The image includes:
- Vue.js frontend (built and optimized)
- Node.js backend with Express server
- Python environment with Selenium and Chrome
- All scripts configured to run with headless mode **DISABLED**

## Prerequisites
- Docker installed and running
- At least 2GB of available disk space
- Internet connection for downloading dependencies

## Current Configuration Notes

### Python Script Configuration
- **Headless Mode**: DISABLED by design
- The script `extrair_paineis_tarifario.py` runs Chrome in non-headless mode
- **No GUI/X11 required**: Chrome runs without visible windows but not in headless mode
- This allows full browser functionality while running in Docker containers

### Image Specifications
- Base: Alpine Linux (minimal size)
- Frontend: Vue.js built for production
- Backend: Node.js 18 with Express
- Python: 3.x with Selenium, Chrome, and all required packages
- Final image size: ~1.02GB (optimized)

## Build Process

### Step 1: Prepare the Environment
```powershell
# Navigate to project directory
cd "c:\Users\luis\Downloads\python\VUE\my-mapexplorer-clean"

# Clean up any existing containers/images (optional)
docker system prune -f
```

### Step 2: Build the Docker Image
```powershell
# Build using the optimized Dockerfile
docker build -t my-mapexplorer:latest -f Dockerfile.final .

# Alternative: Build with specific tag
docker build -t my-mapexplorer:production -f Dockerfile.final .
```

### Step 3: Verify the Build
```powershell
# Check image size and details
docker images | findstr my-mapexplorer

# Test the container (if port 3010 is available)
docker run --rm -d --name mapexplorer-test -p 3010:3010 my-mapexplorer:latest

# Check container logs
docker logs mapexplorer-test

# Stop test container
docker stop mapexplorer-test
```

## File Structure Overview

### Key Files Used in Build:
```
├── Dockerfile.final                 # Main optimized Dockerfile
├── package.json                     # Frontend dependencies
├── src/                            # Vue.js source code
├── public/                         # Static assets
├── backend/
│   ├── package.json                # Backend dependencies
│   ├── database/server.js          # Express server (fixed)
│   └── scripts/
│       ├── extrair_paineis_tarifario.py  # Main Python script (headless disabled)
│       ├── requirements-alpine.txt       # Python dependencies for Alpine
│       └── linux_adapter.py             # Linux compatibility helper
└── start-slim.sh                   # Container startup script
```

### Python Script Configuration Details:
The `extrair_paineis_tarifario.py` script is configured with:
- `options.add_argument('--no-sandbox')`
- `options.add_argument('--disable-dev-shm-usage')`
- `options.add_argument('--disable-gpu')`
- **NO** `--headless` argument (intentionally removed)
- Chrome runs in full mode but without visible windows in Docker

## Docker Image Details

### Multi-Stage Build Process:
1. **Stage 1**: Build Vue.js frontend using Node.js Alpine
2. **Stage 2**: Install backend Node.js dependencies
3. **Stage 3**: Create final runtime image with:
   - Alpine Linux base
   - Python 3 + pip
   - Chromium + chromedriver
   - Node.js runtime
   - All application code

### Environment Variables:
- `NODE_ENV=production`
- `PORT=3010`
- `PYTHONUNBUFFERED=1`

## Running the Container

### Basic Run Command:
```powershell
docker run -d --name mapexplorer -p 3010:3010 my-mapexplorer:latest
```

### With Environment Variables:
```powershell
docker run -d --name mapexplorer -p 3010:3010 \
  -e NODE_ENV=production \
  -e PORT=3010 \
  my-mapexplorer:latest
```

### With Volume Mounts (for data persistence):
```powershell
docker run -d --name mapexplorer -p 3010:3010 \
  -v mapexplorer-data:/app/data \
  my-mapexplorer:latest
```

## Export for Production Server

### Save Image as TAR File:
```powershell
# Export the built image
docker save my-mapexplorer:latest -o my-mapexplorer-production.tar

# Check file size
dir my-mapexplorer-production.tar
```

### Load on Production Server:
```bash
# On Linux production server
docker load -i my-mapexplorer-production.tar
docker run -d --name mapexplorer -p 3010:3010 --restart unless-stopped my-mapexplorer:latest
```

## Troubleshooting

### Common Issues:

1. **Port Already in Use**:
   ```powershell
   docker ps | findstr 3010
   docker stop <container_name>
   ```

2. **Python Script Issues**:
   - Check that Chrome is properly installed in container
   - Verify no headless mode conflicts
   - Check container logs: `docker logs <container_name>`

3. **Build Failures**:
   - Ensure all files are present
   - Check Docker has enough disk space
   - Verify internet connection for downloads

### Verification Commands:
```powershell
# Check if services are running inside container
docker exec -it <container_name> ps aux

# Check Python environment
docker exec -it <container_name> python3 --version
docker exec -it <container_name> pip3 list

# Check Chrome installation
docker exec -it <container_name> chromium-browser --version

# Test API endpoints
curl http://localhost:3010/api/health
```

## Performance Notes

- **Image Size**: ~1.02GB (optimized for functionality vs size)
- **Memory Usage**: ~200-500MB runtime (depends on active scripts)
- **CPU Usage**: Variable (depends on Chrome automation load)
- **Network**: Frontend + Backend on same port (3010) for simplicity

## Security Considerations

- Container runs as non-root user where possible
- Only necessary ports exposed (3010)
- No unnecessary packages in final image
- Production build with optimized frontend

## Additional Notes

- **Headless Mode**: Intentionally disabled for full browser compatibility
- **No GUI Dependencies**: Chrome runs without visible windows but maintains full functionality
- **Alpine Base**: Minimal Linux distribution for smaller image size
- **Multi-stage Build**: Optimized build process with separate stages for frontend/backend
- **Production Ready**: Includes error handling, health checks, and proper logging

## Quick Start Summary

```powershell
# 1. Build the image
docker build -t my-mapexplorer:latest -f Dockerfile.final .

# 2. Run the container
docker run -d --name mapexplorer -p 3010:3010 my-mapexplorer:latest

# 3. Verify it's working
docker logs mapexplorer
curl http://localhost:3010

# 4. Export for production
docker save my-mapexplorer:latest -o my-mapexplorer-production.tar
```

The application will be available at `http://localhost:3010` with both frontend and backend served from the same port.

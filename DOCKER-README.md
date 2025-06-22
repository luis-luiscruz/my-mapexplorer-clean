# 🐳 Docker Setup for MapExplorer

This project now includes a complete Docker setup that supports both:
- **Vue.js Frontend** (port 3010)
- **Node.js Backend** (port 3015) 
- **Python Selenium Scripts** (with Chrome + ChromeDriver)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3010
# Backend API: http://localhost:3015
```

### Option 2: Docker Build & Run
```bash
# Build the image
docker build -t mapexplorer .

# Run the container
docker run -p 3010:3010 -p 3015:3015 mapexplorer
```

## 🔧 Running Python Selenium Scripts

### Run the selenium script directly:
```bash
# Using docker-compose (recommended)
docker-compose --profile selenium up selenium-runner

# Or using docker run
docker run --rm mapexplorer python3 backend/scripts/extrair_paineis_tarifario.py BRR-00133
```

### Run with custom parameters:
```bash
docker run --rm mapexplorer python3 backend/scripts/extrair_paineis_tarifario.py YOUR-POSTO-ID
```

## 📁 Project Structure
```
my-mapexplorer-clean/
├── backend/
│   ├── scripts/
│   │   └── extrair_paineis_tarifario.py  # Python Selenium script
│   └── package.json                      # Backend dependencies
├── src/                                  # Frontend Vue.js source
├── dist/                                 # Built frontend files
├── scripts/
│   ├── entrypoint.sh                     # Docker entrypoint
│   └── start-all-services.sh             # Service startup script
├── Dockerfile                            # Multi-stage Docker build
├── docker-compose.yml                    # Docker Compose configuration
├── requirements.txt                      # Python dependencies
└── nginx.conf                            # Nginx configuration
```

## 🛠 Development

### Local Development with Docker:
```bash
# Start with file watching (if configured)
docker-compose up --build

# View logs
docker-compose logs -f

# Execute commands inside container
docker-compose exec mapexplorer bash
```

### Building for Production:
```bash
# Build optimized image
docker build -t mapexplorer:prod .

# Run production container
docker run -d -p 80:80 -p 3010:3010 -p 3015:3015 mapexplorer:prod
```

## 🔍 Available Services

### Frontend (Vue.js)
- **Port**: 3010
- **URL**: http://localhost:3010
- **Technology**: Vue.js + Vite + Tailwind CSS

### Backend API (Node.js)
- **Port**: 3015
- **URL**: http://localhost:3015
- **Technology**: Node.js + Express

### Python Selenium Scripts
- **Chrome**: Latest stable version
- **ChromeDriver**: Auto-matched version
- **Display**: Headless (Xvfb)
- **Scripts Location**: `backend/scripts/`

## 🐛 Troubleshooting

### Chrome/Selenium Issues:
```bash
# Check Chrome installation
docker run mapexplorer google-chrome --version

# Check ChromeDriver
docker run mapexplorer chromedriver --version

# Run with debug output
docker run -e DEBUG=true mapexplorer python3 backend/scripts/extrair_paineis_tarifario.py
```

### Port Conflicts:
If ports 3010 or 3015 are in use:
```bash
# Use different ports
docker run -p 8080:3010 -p 8081:3015 mapexplorer
```

### Container Access:
```bash
# Access container shell
docker run -it mapexplorer bash

# Or with docker-compose
docker-compose exec mapexplorer bash
```

## 📋 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_ENV` | `true` | Indicates Docker environment |
| `NODE_ENV` | `production` | Node.js environment |
| `DISPLAY` | `:99` | X11 display for headless Chrome |

## 🔧 Customization

### Adding New Python Scripts:
1. Place scripts in `backend/scripts/`
2. Install requirements in `requirements.txt`
3. Run with: `docker run mapexplorer python3 backend/scripts/your-script.py`

### Modifying Frontend:
1. Edit files in `src/`
2. Rebuild: `docker-compose up --build`

### Backend Changes:
1. Edit files in `backend/`
2. Rebuild: `docker-compose up --build`

## 📦 Dependencies

### Python:
- selenium
- webdriver-manager
- requests
- beautifulsoup4

### Node.js:
- Vue.js 3
- Vite
- Tailwind CSS
- Express (backend)

### System:
- Ubuntu 22.04
- Chrome (latest)
- ChromeDriver (auto-matched)
- Nginx
- Xvfb (virtual display)

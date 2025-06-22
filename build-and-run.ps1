# Build and Run Script for My MapExplorer Complete
# Combines Vue.js frontend with Python backend in Docker

Write-Host "My MapExplorer Complete - Docker Build & Run" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose version | Out-Null
    Write-Host "✓ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "! Docker Compose not found, using docker commands instead" -ForegroundColor Yellow
}

# Build the Docker image
Write-Host "`nBuilding Docker image (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "Installing Node.js, Python, Chrome, and all dependencies..." -ForegroundColor Gray

$buildStart = Get-Date
docker build -t mapexplorer-complete .
$buildEnd = Get-Date
$buildTime = ($buildEnd - $buildStart).TotalSeconds

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker image built successfully in $([math]::Round($buildTime, 1)) seconds" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to build Docker image" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}

# Show available options
Write-Host "`nWhat would you like to do?" -ForegroundColor Cyan
Write-Host "1. 🚀 Run the full application (Vue.js + Python backend)"
Write-Host "2. 🐍 Run Python script only (extrair_paineis_tarifario.py)"
Write-Host "3. 🐍 Run Python script with custom posto ID"
Write-Host "4. 🌐 Run Vue.js development server only"
Write-Host "5. 🛠️  Interactive debugging mode (bash shell)"
Write-Host "6. 🐳 Use Docker Compose (recommended for development)"
Write-Host "7. 📋 Show container logs"
Write-Host "8. 🧹 Clean up Docker images"
Write-Host "9. ❌ Exit"

$choice = Read-Host "`nEnter your choice (1-9)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting full application..." -ForegroundColor Yellow
        Write-Host "Vue.js will be available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Python backend will be available at: http://localhost:3010" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        docker run --rm -p 3000:3000 -p 3010:3010 mapexplorer-complete
    }
    "2" {
        Write-Host "`nRunning Python script with default settings..." -ForegroundColor Yellow
        docker run --rm mapexplorer-complete python3 backend/scripts/extrair_paineis_tarifario.py
    }
    "3" {
        $postoId = Read-Host "Enter posto ID (e.g., brr-00133)"
        if ([string]::IsNullOrWhiteSpace($postoId)) {
            Write-Host "Invalid posto ID. Using default." -ForegroundColor Yellow
            docker run --rm mapexplorer-complete python3 backend/scripts/extrair_paineis_tarifario.py
        } else {
            Write-Host "`nRunning Python script with posto ID: $postoId..." -ForegroundColor Yellow
            docker run --rm mapexplorer-complete python3 backend/scripts/extrair_paineis_tarifario.py $postoId
        }
    }
    "4" {
        Write-Host "`nStarting Vue.js development server..." -ForegroundColor Yellow
        Write-Host "Application will be available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        docker run --rm -p 3000:3000 mapexplorer-complete npm run dev
    }
    "5" {
        Write-Host "`nStarting interactive debugging mode..." -ForegroundColor Yellow
        Write-Host "Use 'exit' to quit the container" -ForegroundColor Gray
        Write-Host "Available commands:" -ForegroundColor Cyan
        Write-Host "  - npm run dev    (start Vue.js dev server)" -ForegroundColor Gray
        Write-Host "  - npm run build  (build Vue.js for production)" -ForegroundColor Gray
        Write-Host "  - python3 backend/scripts/extrair_paineis_tarifario.py" -ForegroundColor Gray
        Write-Host "  - google-chrome --version" -ForegroundColor Gray
        Write-Host "  - chromedriver --version" -ForegroundColor Gray
        docker run --rm -it -p 3000:3000 -p 3010:3010 mapexplorer-complete /bin/bash
    }
    "6" {
        if (Test-Path "docker-compose.yml") {
            Write-Host "`nUsing Docker Compose for development..." -ForegroundColor Yellow
            Write-Host "This will start all services with volume mounting for live development" -ForegroundColor Cyan
            Write-Host "Vue.js: http://localhost:3000" -ForegroundColor Cyan
            Write-Host "Python backend: http://localhost:3010" -ForegroundColor Cyan
            Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
            docker-compose up --build
        } else {
            Write-Host "`nDocker Compose file not found. Creating one..." -ForegroundColor Yellow
            # Create a basic docker-compose.yml if it doesn't exist
            Write-Host "Please run this script again and choose option 6" -ForegroundColor Cyan
        }
    }
    "7" {
        Write-Host "`nShowing recent container logs..." -ForegroundColor Yellow
        docker logs $(docker ps -q --filter ancestor=mapexplorer-complete) 2>/dev/null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "No running containers found for mapexplorer-complete" -ForegroundColor Yellow
        }
    }
    "8" {
        Write-Host "`nCleaning up Docker images..." -ForegroundColor Yellow
        docker image prune -f
        Write-Host "✓ Unused images removed" -ForegroundColor Green
        
        $removeImage = Read-Host "Remove mapexplorer-complete image? (y/N)"
        if ($removeImage -eq "y" -or $removeImage -eq "Y") {
            docker rmi mapexplorer-complete 2>/dev/null
            Write-Host "✓ mapexplorer-complete image removed" -ForegroundColor Green
        }
    }
    "9" {
        Write-Host "Goodbye! 👋" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Operation completed!" -ForegroundColor Green
Write-Host "Run this script again anytime to manage your application." -ForegroundColor Cyan

# Multi-stage Docker build for Vue.js + Python Selenium
# Stage 1: Build Vue.js frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Python + Selenium + Chrome runtime with optimized settings
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV DOCKER_ENV=true
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99
ENV NODE_ENV=production

# Install Node.js 18.x repository and curl
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install system dependencies with optimized Chrome dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    wget \
    curl \
    unzip \
    xvfb \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libgtk-4-1 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    nginx \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome with updated key handling
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver using Chrome for Testing API (optimized version)
RUN CHROME_VERSION=$(google-chrome --version | sed 's/Google Chrome //' | sed 's/ .*//' | cut -d'.' -f1-3) \
    && echo "Chrome version: $CHROME_VERSION" \
    && CHROMEDRIVER_URL="https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone-with-downloads.json" \
    && CHROME_MILESTONE=$(echo $CHROME_VERSION | cut -d'.' -f1) \
    && echo "Chrome milestone: $CHROME_MILESTONE" \
    && CHROMEDRIVER_VERSION=$(curl -s "$CHROMEDRIVER_URL" | grep -o "\"$CHROME_MILESTONE\":{[^}]*\"version\":\"[^\"]*" | sed 's/.*"version":"//' | head -1) \
    && echo "ChromeDriver version: $CHROMEDRIVER_VERSION" \
    && if [ -z "$CHROMEDRIVER_VERSION" ]; then \
        echo "Could not determine ChromeDriver version, using latest stable" \
        && CHROMEDRIVER_VERSION="119.0.6045.105"; \
    fi \
    && CHROMEDRIVER_DOWNLOAD_URL="https://storage.googleapis.com/chrome-for-testing-public/$CHROMEDRIVER_VERSION/linux64/chromedriver-linux64.zip" \
    && echo "Downloading from: $CHROMEDRIVER_DOWNLOAD_URL" \
    && wget -O /tmp/chromedriver.zip "$CHROMEDRIVER_DOWNLOAD_URL" \
    && unzip /tmp/chromedriver.zip -d /tmp/ \
    && mv /tmp/chromedriver-linux64/chromedriver /usr/local/bin/ \
    && rm -rf /tmp/chromedriver.zip /tmp/chromedriver-linux64 \
    && chmod +x /usr/local/bin/chromedriver

# Create app directory structure
WORKDIR /app

# Ensure we have the correct Node.js version
RUN node --version && npm --version

# Copy all source files first (this is needed for the frontend build)
COPY . .

# Copy frontend package.json and install dependencies in correct location  
RUN cd /app && npm install

# Install Vite globally for build commands
RUN npm install -g vite

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend package.json and install dependencies
RUN cd backend && npm install

# Copy frontend build from stage 1 (built frontend)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for nginx logs and set permissions
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chmod 777 /var/log/nginx /var/log/nginx/access.log /var/log/nginx/error.log

# Create .dockerenv file to indicate Docker environment
RUN touch /.dockerenv

# Make scripts executable
RUN chmod +x scripts/entrypoint.sh

# Create a non-root user for security (but don't switch to it yet)
RUN useradd -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# Don't switch to appuser here - nginx needs root to bind to ports
# USER appuser will be set in entrypoint after nginx starts

# Expose only port 3010 for both frontend and backend
EXPOSE 3010

# Set entrypoint
ENTRYPOINT ["./scripts/entrypoint.sh"]

# Default command - run both frontend (nginx) and backend services
CMD ["./scripts/start-all-services.sh"]

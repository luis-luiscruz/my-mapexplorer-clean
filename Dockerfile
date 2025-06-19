# Multi-stage Docker build for MapExplorer
# Supports Python, Selenium, Chrome, Node.js backend and Vue.js frontend

# Stage 1: Build Vue.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY package*.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

# Install frontend dependencies (including dev dependencies for build)
RUN npm ci --silent

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build frontend for production
RUN npm run build

# Stage 2: Install backend dependencies
FROM node:18-alpine AS backend-deps

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production --silent

# Stage 3: Final runtime image with Chrome and Python
FROM selenium/standalone-chrome:latest

# Switch to root for installation
USER root

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV PORT=3010

# Install Node.js 18.x and Python 3
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    software-properties-common \
    python3 \
    python3-pip \
    python3-venv \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./dist

# Copy backend source and dependencies from stage 2
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Create Python virtual environment and install Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python requirements
COPY backend/scripts/requirements.txt ./backend/scripts/
RUN pip install --no-cache-dir -r ./backend/scripts/requirements.txt

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Set ownership and permissions
RUN chown -R seluser:seluser /app
RUN chmod -R 755 /app

# Switch back to seluser for security
USER seluser

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3010 || exit 1

# Start the application
CMD ["/app/start.sh"]

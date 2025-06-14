# Multi-stage build for frontend
FROM node:18-alpine as build-stage

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine as production-stage

# Copy the built app from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S frontend -u 1001

# Expose port 3010
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Use Node.js 18 LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy backend source code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Expose the port the app runs on
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3015/health || exit 1

# Start the application
CMD ["npm", "start"]

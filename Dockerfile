# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create npm cache directory
RUN mkdir -p /tmp/.npm

# Copy package files
COPY package*.json ./

# Install dependencies with custom cache location
RUN npm ci --cache /tmp/.npm --prefer-offline --no-audit --no-fund --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads/videos

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
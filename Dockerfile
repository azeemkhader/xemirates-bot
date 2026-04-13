# Dockerfile for xemirates-bot (whatsapp-web.js on Render)
FROM node:18-bullseye-slim

# Install Chromium and required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium (skip downloading its own)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

# Create data directories
RUN mkdir -p /app/.wwebjs_auth /app/data

# Expose port for Render health check
EXPOSE 3000

# Start the bot via server.js (includes health check)
CMD ["node", "server.js"]

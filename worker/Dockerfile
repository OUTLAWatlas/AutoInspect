FROM node:20-bookworm

# Install Chrome and headless GL dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
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
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libxshmfence1 \
    libglu1-mesa \
    libgl1-mesa-dri \
    libgl1-mesa-glx \
    libegl1-mesa \
    libvulkan1 \
  && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Disable Chrome sandbox via env (fallback for --no-sandbox flag)
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV CHROME_FLAGS="--no-sandbox --disable-dev-shm-usage"

WORKDIR /app

# Copy shared prisma schema first for layer caching
COPY shared/prisma/schema.prisma ./shared/prisma/schema.prisma

# Copy worker package files and install dependencies
COPY worker/package.json worker/package-lock.json* ./worker/
WORKDIR /app/worker
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=../shared/prisma/schema.prisma

# Copy worker source
COPY worker/src ./src
COPY worker/tsconfig.json ./tsconfig.json

# Build TypeScript
RUN npx tsc

CMD ["node", "dist/index.js"]

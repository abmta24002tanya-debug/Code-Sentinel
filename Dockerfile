FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY next.config.js ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install Node.js for serving Next.js SSR
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Backend deps
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend build output
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY package.json next.config.js ./

# Backend source
COPY backend/ ./backend/

EXPOSE 3000

# Start script: run FastAPI on 8000, Next.js on 3000
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]

# Multi-Project Docker Template Files

## Template 1: Backend Dockerfile (Node.js/NestJS)

```dockerfile
# Stage 1: Development
FROM node:20-alpine AS development
WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (if using Prisma)
RUN npx prisma generate

# Stage 2: Build
FROM development AS build
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

# Install runtime dependencies only
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built artifacts from build stage
COPY --from=build /usr/src/app/dist ./dist

# Copy Prisma files (if using Prisma)
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Set ownership
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run application
ENTRYPOINT ["./docker-entrypoint.sh"]
```

---

## Template 2: Frontend Dockerfile (React/Vite)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on lock file
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci; \
    else \
        npm install; \
    fi

# Copy source code
COPY . .

# Fix pdf.js worker (if using PDF viewer)
RUN if [ -d node_modules/pdfjs-dist ]; then \
        mkdir -p public && \
        cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs; \
    fi

# Build application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config (for React Router SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -S nginx_group && adduser -S nginx_user -G nginx_group || true
RUN chown -R nginx_user:nginx_group /usr/share/nginx/html /var/cache/nginx

USER nginx_user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

## Template 3: docker-compose.local.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: myapp_frontend_local
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=development
    networks:
      - app_network

  backend:
    build:
      context: ./backend
      target: production
    container_name: myapp_backend_local
    restart: unless-stopped
    env_file:
      - .env.local
    environment:
      - NODE_ENV=development
      - PORT=4000
      - DATABASE_HOST=postgres
      - REDIS_HOST=redis
    ports:
      - "${BACKEND_PORT:-4000}:4000"
    volumes:
      - ./backend/src:/usr/src/app/src
      - myapp_uploads_local:/usr/src/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:14-alpine
    container_name: myapp_db_local
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-dev_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-myapp_dev}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - myapp_pgdata_local:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-dev_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    container_name: myapp_cache_local
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  myapp_pgdata_local:
  myapp_uploads_local:

networks:
  app_network:
    driver: bridge
```

---

## Template 4: docker-compose.prod.yml

```yaml
version: '3.8'

services:
  frontend:
    image: ${REGISTRY}/myapp/frontend:${VERSION:-latest}
    container_name: myapp_frontend_prod
    restart: always
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=production
    networks:
      - app_network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  backend:
    image: ${REGISTRY}/myapp/backend:${VERSION:-latest}
    container_name: myapp_backend_prod
    restart: always
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - myapp_uploads_prod:/usr/src/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1024M
        reservations:
          cpus: '1'
          memory: 512M

  postgres:
    image: postgres:14-alpine
    container_name: myapp_db_prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - myapp_pgdata_prod:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2048M
        reservations:
          cpus: '1'
          memory: 1024M

  redis:
    image: redis:7-alpine
    container_name: myapp_cache_prod
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - myapp_redis_data_prod:/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

volumes:
  myapp_pgdata_prod:
  myapp_uploads_prod:
  myapp_redis_data_prod:

networks:
  app_network:
    driver: bridge
```

---

## Template 5: .env.example

```bash
# ============================================
# Server Configuration
# ============================================
PORT=4000
NODE_ENV=production

# ============================================
# Database (PostgreSQL)
# ============================================
DATABASE_URL="postgresql://user:password@postgres:5432/myapp_db"
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=myapp_db

# ============================================
# Redis Cache
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password

# ============================================
# JWT & Authentication
# ============================================
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# ============================================
# CORS & Frontend
# ============================================
FRONTEND_URL=http://localhost

# ============================================
# External APIs (Optional)
# ============================================
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# ============================================
# Email Configuration (Optional)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ============================================
# AWS S3 / Cloud Storage (Optional)
# ============================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
```

---

## Template 6: docker-entrypoint.sh

```bash
#!/bin/sh
set -e

echo "🚀 Starting Backend..."

# 1. Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# 2. Generate Prisma Client (failsafe)
echo "📦 Generating Prisma client..."
npx prisma generate

# 3. Seed database (optional, comment if not needed)
echo "🌱 Seeding initial data..."
npm run seed 2>/dev/null || echo "Seed script not found, skipping..."

# 4. Start application
echo "🟢 Starting application..."
exec node dist/src/main
```

---

## Template 7: nginx.conf (React SPA)

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss;
    gzip_min_length 1000;

    # React Router: redirect all requests to index.html
    location / {
        try_files $uri /index.html;
    }

    # Static assets with cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## Template 8: .dockerignore

```
.git
.gitignore
.github
.dockerignore
node_modules
npm-debug.log
yarn-error.log
pnpm-debug.log
dist
build
.next
.env
.env.local
.env.*.local
docker-compose*.yml
.vscode
.idea
.DS_Store
coverage
test
jest.config.js
README.md
LICENSE
Dockerfile
docs
```

---

## 📋 Checklist ketika menggunakan template

- [ ] Replace `myapp` dengan nama project Anda
- [ ] Update `REGISTRY` dengan container registry URL
- [ ] Edit `.env.example` dengan variables yang sesuai
- [ ] Pastikan `docker-entrypoint.sh` sesuai dengan project Anda
- [ ] Customize `nginx.conf` untuk routing yang sesuai
- [ ] Test locally dengan `docker-compose.local.yml`
- [ ] Push images ke registry
- [ ] Deploy dengan `docker-compose.prod.yml`


# Docker Packaging Guide - Hướng dẫn Đóng gói Docker

## Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc Docker](#kiến-trúc-docker)
3. [Cấu trúc Dockerfile](#cấu-trúc-dockerfile)
4. [Docker Compose](#docker-compose)
5. [Quản lý Environment](#quản-lý-environment)
6. [Các lệnh thường dùng](#các-lệnh-thường-dùng)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 1. Tổng quan

### Docker là gì?
Docker là nền tảng containerization cho phép bạn:
- **Đóng gói** ứng dụng cùng với dependencies
- **Cô lập** môi trường giữa các container
- **Tái sử dụng** images trên các máy khác nhau
- **Đơn giản hóa** deployment process

### Docker Compose là gì?
Docker Compose cho phép định nghĩa và chạy **multi-container applications** bằng cách sử dụng file YAML.

---

## 2. Kiến trúc Docker

### Các thành phần chính

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host Environment                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Frontend    │  │   Backend    │  │   Database   │      │
│  │  (Nginx)     │  │  (Node.js)   │  │ (PostgreSQL) │      │
│  │  Container   │  │  Container   │  │  Container   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│              Docker Internal Network                        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    Redis     │  │   Volumes    │                        │
│  │  Container   │  │  (Data)      │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │
         └─────────────────── Port Mapping (80, 4000, 5432)
                              Host Machine
```

### Các loại Container

| Container | Base Image | Role | Port |
|-----------|-----------|------|------|
| Frontend | nginx:alpine | Web server, React SPA hosting | 80/443 |
| Backend | node:20-alpine | NestJS API server | 4000 |
| Database | postgres:14-alpine | PostgreSQL database | 5432 |
| Cache | redis:7-alpine | Redis cache & session store | 6379 |

---

## 3. Cấu trúc Dockerfile

### 3.1 Multi-Stage Build Pattern

Multi-stage build giảm kích thước image bằng cách:
- Sử dụng stage development để build
- Copy artifacts vào stage production
- Stage production chỉ chứa runtime dependencies

#### Ví dụ: Backend Dockerfile (Node.js + NestJS)

```dockerfile
# Stage 1: Development
FROM node:20-alpine AS development
WORKDIR /usr/src/app

# Cài đặt system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Build
FROM development AS build
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Cài đặt runtime dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
RUN npm install --only=production

# Copy built artifacts
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
```

**Lợi ích:**
- Development stage: ~500MB
- Production stage: ~150MB (không chứa dev dependencies)

#### Ví dụ: Frontend Dockerfile (React + Vite + Nginx)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files (hỗ trợ npm, pnpm, yarn)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; \
    fi

# Copy source code
COPY . .

# Fix: Copy PDF.js worker file
RUN cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs

# Build with Vite
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Dockerfile Best Practices

#### 1. **Sử dụng Alpine Linux**
```dockerfile
# ✅ Good - Alpine: ~150MB
FROM node:20-alpine

# ❌ Avoid - Full OS: ~900MB
FROM node:20
```

#### 2. **Layer Caching**
```dockerfile
# ✅ Good - dependencies cached, source changes rebuild quickly
COPY package*.json ./
RUN npm install
COPY . .

# ❌ Bad - every source change invalidates cache
COPY . .
RUN npm install
```

#### 3. **Health Check**
```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD node healthcheck.js
```

#### 4. **Reduce Layers**
```dockerfile
# ✅ Good - single RUN command
RUN apk add --no-cache python3 make g++ openssl

# ❌ Bad - multiple RUN commands
RUN apk add --no-cache python3
RUN apk add --no-cache make
RUN apk add --no-cache g++
RUN apk add --no-cache openssl
```

#### 5. **Non-Root User**
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Hoặc cho Node.js
USER node
```

---

## 4. Docker Compose

### 4.1 Cấu trúc cơ bản

```yaml
version: '3.8'

services:
  # Service definitions
  
volumes:
  # Named volumes

networks:
  # Custom networks
```

### 4.2 Các loại Docker Compose File

#### A. **docker-compose.local.yml** - Development/Local Testing

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: app_frontend_local
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=development

  backend:
    build:
      context: ./backend
      target: production
    container_name: app_backend_local
    restart: always
    env_file:
      - .env.local
    environment:
      - NODE_ENV=development
      - PORT=4000
    volumes:
      - ./backend/src:/usr/src/app/src      # Code reload
      - ./uploads:/usr/src/app/uploads       # Persistent uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:14-alpine
    container_name: app_db_local
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata_local:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: app_cache_local
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata_local:

networks:
  default:
    name: app_network_local
```

**Đặc điểm:**
- `build:` - Build từ Dockerfile locally
- `volumes:` - Mount source code để development
- `ports:` - Expose tất cả ports cho debug
- `healthcheck:` - Kiểm tra service availability

#### B. **docker-compose.prod.yml** - Production

```yaml
version: '3.8'

services:
  frontend:
    image: registry.company.com/app/frontend:latest
    container_name: app_frontend_prod
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=production

  backend:
    image: registry.company.com/app/backend:latest
    container_name: app_backend_prod
    restart: always
    env_file:
      - .env
    environment:
      - NODE_ENV=production
    volumes:
      - app_uploads_prod:/usr/src/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata_prod:
  app_uploads_prod:
```

**Đặc điểm:**
- `image:` - Sử dụng pre-built images
- Không có `volumes` source code (chỉ data)
- Không expose port database
- Health checks để auto-restart failed services

#### C. **docker-compose.db-only.yml** - Database Only

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always

volumes:
  pgdata:
```

**Sử dụng:** Khi frontend/backend chạy local, chỉ cần database remote

#### D. **docker-compose.clean.yml** - Pre-built Images

```yaml
version: '3.8'

services:
  frontend:
    image: app-frontend:latest
    container_name: app_frontend
    ports:
      - "80:80"

  backend:
    image: app-backend:latest
    container_name: app_backend
    env_file:
      - .env

  postgres:
    image: postgres:14-alpine

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

**Sử dụng:** Trong CI/CD hoặc production environments với internal image registry

### 4.3 Service Dependencies & Health Checks

```yaml
services:
  backend:
    depends_on:
      postgres:
        condition: service_healthy  # Wait cho health check
      redis:
        condition: service_started  # Chỉ chờ container started

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U username"]
      interval: 10s      # Kiểm tra mỗi 10 giây
      timeout: 5s        # Timeout 5 giây
      retries: 5         # Retry 5 lần trước khi mark unhealthy
      start_period: 40s  # Cho service 40s để start
```

---

## 5. Quản lý Environment

### 5.1 Environment Files Strategy

```
project/
├── .env                  # Production secrets (KHÔNG commit)
├── .env.local            # Local development (KHÔNG commit)
├── .env.example          # Template (COMMIT)
├── .env.staging          # Staging environment
└── .env.docker           # Docker-specific vars
```

### 5.2 Multi-level Environment Configuration

#### Level 1: Docker Compose env_file
```yaml
services:
  backend:
    env_file:
      - .env.local
```

#### Level 2: Override trong docker-compose
```yaml
services:
  backend:
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=4000
      - REDIS_HOST=redis    # Service name (DNS)
```

#### Level 3: Runtime Environment Variables
```bash
docker-compose -e DATABASE_URL=postgresql://... up
```

### 5.3 Ví dụ .env file

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@postgres:5432/dbname"
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=app_database

# Redis (Service name inside Docker network)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT & Security
JWT_SECRET=your_secret_key_123
JWT_EXPIRES_IN=7d

# CORS & Frontend
FRONTEND_URL=https://app.example.com

# API Keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx
THIRD_PARTY_API_KEY=xxxx
```

### 5.4 Environment trong Docker Network

```
┌─────────────────────────────────────────┐
│     Docker Compose Network              │
├─────────────────────────────────────────┤
│                                         │
│  Backend can access:                    │
│  - postgres:5432 (service name)         │
│  - redis:6379                           │
│  - frontend (internal)                  │
│                                         │
│  Database URL inside container:         │
│  postgresql://user:pass@postgres:5432   │
│  (NOT 127.0.0.1 or localhost)           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Các lệnh thường dùng

### 6.1 Build & Run

```bash
# Build images locally
docker-compose -f docker-compose.local.yml build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Run services
docker-compose -f docker-compose.local.yml up

# Run in background
docker-compose up -d

# Run specific service
docker-compose up backend postgres redis

# View logs
docker-compose logs

# Follow logs (tail -f)
docker-compose logs -f backend

# Logs for specific service
docker-compose logs backend

# Rebuild và run
docker-compose up --build

# Remove stopped containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove everything including images
docker-compose down --rmi all
```

### 6.2 Container Management

```bash
# List running containers
docker-compose ps

# Execute command in container
docker-compose exec backend npm run seed

# Enter container shell
docker-compose exec backend /bin/sh

# Restart service
docker-compose restart backend

# Stop service
docker-compose stop backend

# Start service
docker-compose start backend

# Kill service (force stop)
docker-compose kill backend

# View container resource usage
docker stats
```

### 6.3 Debugging

```bash
# Check service health
docker-compose ps
# Status: Up X minutes (healthy)

# View detailed logs with timestamp
docker-compose logs --timestamps backend

# Follow logs with grep filter
docker-compose logs -f backend | grep "ERROR\|ERROR"

# Inspect network
docker network ls
docker network inspect app_network_local

# Test service connectivity inside container
docker-compose exec backend ping redis

# Check database connection
docker-compose exec backend npx prisma db execute --stdin < test.sql

# View environment variables
docker-compose exec backend env | grep DATABASE
```

### 6.4 Database Operations

```bash
# Execute migration
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

# Reset database (⚠️ Destructive!)
docker-compose exec backend npx prisma migrate reset

# Connect to database
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# Backup database
docker-compose exec postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backup.sql

# Restore database
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

### 6.5 Image Management

```bash
# List images
docker images

# Tag image for registry
docker tag app-backend:latest registry.company.com/app/backend:v1.0.0

# Push to registry
docker push registry.company.com/app/backend:v1.0.0

# Pull image
docker pull registry.company.com/app/backend:latest

# Remove image
docker rmi image_name:tag

# View image history
docker history image_name

# Inspect image
docker inspect image_name
```

---

## 7. Best Practices

### 7.1 Dockerfile Best Practices

#### ✅ DO:

```dockerfile
# 1. Use specific base image version
FROM node:20-alpine

# 2. Set WORKDIR early
WORKDIR /usr/src/app

# 3. Copy package files first (cache layers)
COPY package*.json ./

# 4. Combine RUN commands
RUN apk add --no-cache python3 make g++ \
    && npm install

# 5. Copy source code after dependencies
COPY . .

# 6. Expose ports explicitly
EXPOSE 4000

# 7. Use HEALTHCHECK
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD node healthcheck.js

# 8. Set non-root user
USER node

# 9. Use exec form for ENTRYPOINT
ENTRYPOINT ["node", "dist/main.js"]
```

#### ❌ DON'T:

```dockerfile
# Don't use latest tag
FROM node:latest

# Don't mix build & production
FROM node:20
RUN npm install
RUN npm run build
RUN npm install --only=production

# Don't create unnecessary layers
RUN apk add git
RUN apk add curl
RUN apk add wget

# Don't run as root
USER root

# Don't use shell form
ENTRYPOINT node dist/main.js
```

### 7.2 Docker Compose Best Practices

#### ✅ DO:

```yaml
version: '3.8'

services:
  backend:
    # 1. Use specific image tags
    image: app/backend:v1.0.0
    
    # 2. Set container name
    container_name: app_backend
    
    # 3. Set restart policy
    restart: unless-stopped
    
    # 4. Define healthcheck
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    
    # 5. Limit resources
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    
    # 6. Set environment variables
    environment:
      NODE_ENV: production
    
    # 7. Use named volumes
    volumes:
      - app_data:/app/data
    
    # 8. Define dependencies properly
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  app_data:
```

#### ❌ DON'T:

```yaml
services:
  backend:
    # Don't hardcode image names
    image: app
    
    # Don't use random container names
    # (no container_name = random names)
    
    # Don't use localhost for service connections
    environment:
      DATABASE_URL: postgresql://localhost:5432
    
    # Don't mount without named volumes
    volumes:
      - /var/data:/app/data
    
    # Don't use service_started for critical services
    depends_on:
      postgres:
        condition: service_started
```

### 7.3 Security Best Practices

#### 1. **Don't commit secrets**
```bash
# .gitignore
.env
.env.local
.env.*.local
docker-compose.override.yml
```

#### 2. **Use .env.example**
```bash
# .env.example
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_secret_here
```

#### 3. **Scan images for vulnerabilities**
```bash
# Using Docker Scout (built-in)
docker scout cves image_name:tag

# Using Trivy
trivy image app/backend:latest
```

#### 4. **Run as non-root**
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

#### 5. **Limit container resources**
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1024M
```

### 7.4 Performance Best Practices

#### 1. **Multi-stage Builds**
- Development stage: Full toolchain
- Production stage: Only runtime

#### 2. **Layer Caching**
```dockerfile
# Order: dependencies → source code
COPY package*.json ./
RUN npm ci
COPY . .
```

#### 3. **Minimize Image Size**
```dockerfile
# Alpine Linux (5-50MB vs 900MB for full OS)
FROM node:20-alpine

# Remove unnecessary files
RUN npm ci --only=production \
    && rm -rf /tmp/*
```

#### 4. **Use .dockerignore**
```
.git
.gitignore
node_modules
npm-debug.log
.env
.env.local
test
docs
```

---

## 8. Troubleshooting

### 8.1 Common Issues & Solutions

#### ❌ Issue: "Cannot connect to database"

**Cause:** Using `localhost` or `127.0.0.1` inside container

```yaml
# ❌ Wrong
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# ✅ Correct
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

#### ❌ Issue: "Port already in use"

```bash
# Find process using port
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port in docker-compose
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead
```

#### ❌ Issue: "Out of disk space"

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything
docker system prune -a --volumes
```

#### ❌ Issue: "Service unhealthy / keeps restarting"

```bash
# Check logs
docker-compose logs backend

# Check service status
docker-compose ps

# Increase health check timeout
healthcheck:
  timeout: 10s  # Increase from 5s
  start_period: 60s  # Give more time to start
```

#### ❌ Issue: "Cannot write to volume"

```dockerfile
# Ensure correct permissions
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
```

### 8.2 Health Check Debugging

```bash
# Test health manually
docker-compose exec backend curl http://localhost:4000/health

# Add debug health check
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 40s
```

### 8.3 Network Debugging

```bash
# Inspect network
docker network inspect app_network_local

# Test DNS resolution inside container
docker-compose exec backend nslookup postgres

# Test port connectivity
docker-compose exec backend nc -zv redis 6379

# View all listening ports
docker-compose exec backend netstat -tlnp
```

### 8.4 Log Analysis

```bash
# Get last 50 lines
docker-compose logs --tail=50 backend

# Get logs since specific time
docker-compose logs --since 2024-01-15T10:30:00 backend

# Format with timestamps
docker-compose logs --timestamps --tail=100 backend

# Color output
docker-compose logs --no-log-prefix backend

# Search in logs
docker-compose logs backend | grep ERROR
```

### 8.5 Performance Debugging

```bash
# Monitor resource usage
docker stats

# Inspect image layers
docker history app/backend:latest

# Check disk space
docker system df

# Analyze image
docker inspect app/backend:latest

# Check container filesystem
docker-compose exec backend du -sh /usr/src/app
```

---

## 9. Advanced Topics

### 9.1 Multi-Host Deployment (Docker Swarm)

```bash
# Initialize swarm
docker swarm init

# Join worker node
docker swarm join --token <token> <manager-ip>:2377

# Deploy stack
docker stack deploy -c docker-compose.prod.yml app

# View services
docker service ls

# Scale service
docker service scale app_backend=3
```

### 9.2 Using Docker with CI/CD

```yaml
# GitHub Actions example
name: Docker Build & Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t app/backend:latest -f backend/Dockerfile ./backend
      
      - name: Push to registry
        run: |
          docker tag app/backend:latest registry.com/app/backend:${{ github.sha }}
          docker push registry.com/app/backend:${{ github.sha }}
```

### 9.3 Using Docker Secrets

```yaml
version: '3.8'

services:
  backend:
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 9.4 Custom Networks

```yaml
version: '3.8'

services:
  backend:
    networks:
      - app_network
      - monitoring_network

  database:
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
  monitoring_network:
    driver: bridge
```

---

## 10. Checklist Deployment

### Pre-Deployment

- [ ] Dockerfile tested locally
- [ ] All `docker build` commands work
- [ ] Images built and pushed to registry
- [ ] Environment files created (`.env`)
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` committed to git
- [ ] Health checks defined
- [ ] Resource limits set
- [ ] Volumes strategy defined
- [ ] Network ports documented

### Deployment

- [ ] `docker-compose pull` latest images
- [ ] `docker-compose up -d` starts services
- [ ] `docker-compose ps` shows all healthy
- [ ] Logs checked: `docker-compose logs`
- [ ] Database migration runs: `docker-compose exec backend npx prisma migrate deploy`
- [ ] Application responds: `curl http://localhost`

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Check resource usage: `docker stats`
- [ ] Verify data persistence (stop/start container)
- [ ] Test backup/restore procedures
- [ ] Document any customizations

---

## 11. Tham khảo

### Docker Documentation
- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### Tools
- [Docker Scout](https://docs.docker.com/scout/) - Security scanning
- [Trivy](https://aquasecurity.github.io/trivy/) - Vulnerability scanner
- [Dive](https://github.com/wagoodman/dive) - Analyze image layers

### Registry
- [Docker Hub](https://hub.docker.com/) - Public registry
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Azure Container Registry](https://azure.microsoft.com/en-us/services/container-registry/)

---

## Appendix: Template Files

### Dockerfile (Node.js Backend)
[Xem file: `backend/Dockerfile`]

### Dockerfile (React Frontend)
[Xem file: `frontend/Dockerfile`]

### docker-compose.local.yml
[Xem file: `docker-compose.local.yml`]

### docker-compose.prod.yml
[Xem file: `docker-compose.prod.yml`]

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Maintained By:** DevOps Team

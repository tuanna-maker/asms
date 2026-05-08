# Docker Implementation Checklist - Từng bước để containerize một project

## Phase 1: Planning & Assessment

### 1.1 Evaluate Project Structure
- [ ] Identify all components (frontend, backend, databases)
- [ ] List all dependencies and versions
- [ ] Document current deployment process
- [ ] Identify environment-specific configurations
- [ ] List external services/APIs required

### 1.2 Choose Base Images
```
Backend (Node.js/NestJS):    node:20-alpine
Frontend (React/Vue):         node:20-alpine (build) + nginx:alpine (serve)
Database:                     postgres:14-alpine or mysql:8-alpine
Cache:                        redis:7-alpine
```

### 1.3 Define Environments
- [ ] Development (local): `docker-compose.local.yml`
- [ ] Staging: `docker-compose.staging.yml`
- [ ] Production: `docker-compose.prod.yml`
- [ ] Database-only: `docker-compose.db-only.yml` (optional)

---

## Phase 2: Create Dockerfiles

### 2.1 Backend Dockerfile

**Checklist:**
- [ ] Use multi-stage build (development → build → production)
- [ ] Copy `package*.json` before source code (layer caching)
- [ ] Install build dependencies in development stage
- [ ] Install only production dependencies in production stage
- [ ] Generate language-specific artifacts (Prisma, TypeScript build)
- [ ] Create non-root user
- [ ] Set WORKDIR at the beginning
- [ ] Expose correct port
- [ ] Add HEALTHCHECK
- [ ] Include docker-entrypoint.sh if needed
- [ ] Verify size is reasonable (<200MB for Node)

**Validation:**
```bash
# Build locally
docker build -t myapp-backend:test -f backend/Dockerfile ./backend

# Check image size
docker images myapp-backend:test

# Test image
docker run -it --rm myapp-backend:test /bin/sh

# Check what's inside
docker history myapp-backend:test
```

### 2.2 Frontend Dockerfile

**Checklist:**
- [ ] Use multi-stage build (build → serve)
- [ ] Build stage: node image with all build tools
- [ ] Serve stage: lightweight nginx image
- [ ] Copy built artifacts from build stage
- [ ] Copy nginx.conf for SPA routing
- [ ] Expose port 80 (or 443 if HTTPS)
- [ ] Add HEALTHCHECK
- [ ] Verify size is reasonable (<50MB for nginx-based frontend)

**Validation:**
```bash
# Build
docker build -t myapp-frontend:test -f frontend/Dockerfile ./frontend

# Test
docker run -p 80:80 myapp-frontend:test

# Visit http://localhost in browser
curl http://localhost
```

### 2.3 Database Setup

**Checklist:**
- [ ] Use official database images only
- [ ] Configure environment variables correctly
- [ ] Add healthcheck to verify database is ready
- [ ] Plan volume mounting for data persistence
- [ ] Document initialization SQL if needed
- [ ] Test connection string format

---

## Phase 3: Create Docker Compose Files

### 3.1 docker-compose.local.yml (Development)

**Checklist:**
- [ ] All services use `build:` (not `image:`)
- [ ] Services expose all ports (for debugging)
- [ ] Mount source code volumes for code reload
- [ ] Mount data volumes for persistent storage
- [ ] Set `restart: unless-stopped`
- [ ] Define healthchecks with `start_period` (service startup time)
- [ ] Use `service_healthy` in `depends_on` for critical services
- [ ] Environment variables use service names (e.g., `postgres` not `localhost`)
- [ ] .env file referenced with `env_file:`

**Validation:**
```bash
# Build all images
docker-compose -f docker-compose.local.yml build

# Start services
docker-compose -f docker-compose.local.yml up

# Wait ~30 seconds for database
# Check status
docker-compose ps

# All should show "Up" and "(healthy)"
```

### 3.2 docker-compose.prod.yml (Production)

**Checklist:**
- [ ] All services use `image:` (pre-built images)
- [ ] Services do NOT expose database/cache ports
- [ ] Only expose frontend port (80/443) and backend API port
- [ ] Mount only data volumes (no source code)
- [ ] Set `restart: always`
- [ ] Define resource limits in `deploy.resources.limits`
- [ ] No hardcoded secrets (use environment variables)
- [ ] Use variables for image tags: `${REGISTRY}/app/backend:${VERSION}`

**Validation:**
```bash
# Validate syntax
docker-compose -f docker-compose.prod.yml config

# Test locally with prod file (requires images pulled)
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up
```

---

## Phase 4: Environment Configuration

### 4.1 Create .env.example

**Checklist:**
- [ ] Document all required variables
- [ ] Group variables by category (Database, Auth, APIs)
- [ ] Add comments explaining each variable
- [ ] Use placeholder values (NOT real secrets)
- [ ] Include all variables referenced in docker-compose and Dockerfile
- [ ] Include application-specific configurations

**Example:**
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/dbname
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb

# Application
NODE_ENV=production
JWT_SECRET=your_secret_here
```

### 4.2 Create Environment Files

```bash
# For development
cp .env.example .env.local
# Edit .env.local with local values

# For production
cp .env.example .env
# Edit .env with production values

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Phase 5: Database & Entry Point

### 5.1 Create docker-entrypoint.sh (if needed)

**For Backend:**
```bash
#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding data..."
npm run seed

echo "Starting application..."
exec node dist/src/main
```

**For Database Init:**
```bash
#!/bin/bash
set -e

# Run initialization SQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS uuid-ossp;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL
```

### 5.2 Verify Entrypoint

```bash
# Make executable
chmod +x docker-entrypoint.sh

# Test in container
docker build -t test . --target production
docker run -it test /bin/sh
```

---

## Phase 6: Build & Push to Registry

### 6.1 Build Images

```bash
# Build backend
docker build -t myregistry/myapp/backend:latest \
    -f backend/Dockerfile ./backend

# Build frontend
docker build -t myregistry/myapp/frontend:latest \
    -f frontend/Dockerfile ./frontend

# Tag with version
docker tag myregistry/myapp/backend:latest myregistry/myapp/backend:v1.0.0
docker tag myregistry/myapp/frontend:latest myregistry/myapp/frontend:v1.0.0
```

### 6.2 Scan for Vulnerabilities

```bash
# Using Docker Scout
docker scout cves myregistry/myapp/backend:latest
docker scout cves myregistry/myapp/frontend:latest

# Using Trivy
trivy image myregistry/myapp/backend:latest
trivy image myregistry/myapp/frontend:latest
```

### 6.3 Push to Registry

```bash
# Login to registry
docker login myregistry

# Push images
docker push myregistry/myapp/backend:latest
docker push myregistry/myapp/backend:v1.0.0
docker push myregistry/myapp/frontend:latest
docker push myregistry/myapp/frontend:v1.0.0

# Verify
docker pull myregistry/myapp/backend:latest
```

---

## Phase 7: Local Testing

### 7.1 Test Development Environment

```bash
# Start all services
docker-compose -f docker-compose.local.yml up -d

# Check all are healthy
docker-compose ps

# Test application
curl http://localhost:4000/health      # Backend
curl http://localhost/                 # Frontend

# Check logs
docker-compose logs backend
docker-compose logs postgres
```

### 7.2 Test Database Operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed data
docker-compose exec backend npm run seed

# Connect to database
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### 7.3 Test Persistence

```bash
# Verify volumes work
docker-compose exec backend touch /usr/src/app/uploads/test.txt

# Stop and remove containers
docker-compose down

# Start again
docker-compose up -d

# Verify file still exists
docker-compose exec backend test -f /usr/src/app/uploads/test.txt && echo "✓ Persistence OK"
```

### 7.4 Stress Test

```bash
# Generate some load
docker-compose exec backend npm run seed:batch

# Monitor resources
docker stats

# Check logs for errors
docker-compose logs -f backend | grep -i error
```

---

## Phase 8: Security Review

### 8.1 Dockerfile Security

**Checklist:**
- [ ] No secrets in Dockerfile (use build-time arguments for non-sensitive data)
- [ ] Running as non-root user (USER appuser)
- [ ] Not using `RUN` as root for application code
- [ ] Using specific base image versions (not `latest`)
- [ ] Minimal base image (alpine preferred)
- [ ] Only necessary packages installed

### 8.2 Docker Compose Security

**Checklist:**
- [ ] No hardcoded secrets in docker-compose.yml
- [ ] Sensitive data in .env (and .env in .gitignore)
- [ ] Restricted port exposure (not exposing database/cache publicly)
- [ ] Resource limits defined (prevent DoS)
- [ ] Health checks configured

### 8.3 Registry Security

**Checklist:**
- [ ] Container images scanned for vulnerabilities
- [ ] Registry credentials NOT in docker-compose.yml
- [ ] Use Docker credentials file (`~/.docker/config.json`)
- [ ] Private registry if sensitive applications
- [ ] Image signing/verification if required

---

## Phase 9: Documentation

### 9.1 Create README.docker.md

```markdown
# Docker Setup Guide

## Quick Start
\`\`\`bash
docker-compose -f docker-compose.local.yml up
\`\`\`

## Environment Variables
See `.env.example` for all configuration options.

## Services
- **Frontend**: http://localhost
- **Backend**: http://localhost:4000
- **Database**: localhost:5432

## Common Commands
- View logs: `docker-compose logs -f backend`
- Database shell: `docker-compose exec postgres psql ...`
- Stop all: `docker-compose down`

## Troubleshooting
[See DOCKER_PACKAGING_GUIDE.md]
```

### 9.2 Document Port Mapping

```
Service      Container  Host      Purpose
─────────────────────────────────────────
Frontend     80         80        Web UI
Backend      4000       4000      API
Database     5432       5432      Development only
Redis        6379       6379      Development only
```

### 9.3 Document Volume Mounting

```
Service      Path                   Volume Name        Purpose
────────────────────────────────────────────────────────────────
Backend      /usr/src/app/uploads   app_uploads       User uploads
Database     /var/lib/postgresql    app_pgdata        Database files
```

---

## Phase 10: Deployment

### 10.1 Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Images built and pushed to registry
- [ ] Images scanned for vulnerabilities
- [ ] Environment files created (.env)
- [ ] Database backup exists (if upgrading)
- [ ] Rollback plan documented

### 10.2 Deployment Steps

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify services are healthy
docker-compose ps

# Check logs
docker-compose logs

# Test application
curl https://your-domain/
```

### 10.3 Post-Deployment

- [ ] Verify all services are healthy
- [ ] Check application logs for errors
- [ ] Test critical user flows
- [ ] Monitor CPU/memory usage
- [ ] Set up log aggregation/alerting
- [ ] Document any issues encountered

---

## Troubleshooting Commands

```bash
# View detailed error
docker-compose logs --tail=100 backend

# Check service health
docker-compose ps

# Inspect service environment
docker-compose exec backend env | grep DATABASE

# Test network connectivity
docker-compose exec backend ping postgres

# Check database
docker-compose exec postgres psql -l

# Clean up
docker system prune -a --volumes
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Use service name (`postgres`) not `localhost` |
| "Port already in use" | Change port in docker-compose or kill process |
| "Service not healthy" | Check logs: `docker-compose logs service_name` |
| "Out of disk space" | Run `docker system prune -a` |
| "Permission denied" | Add user to docker group: `sudo usermod -aG docker $USER` |

---

## Success Criteria

✓ Project containerized and running locally
✓ All services healthy and inter-connected
✓ Database migrations run automatically
✓ Images pushed to registry successfully
✓ Security scanning completed
✓ Documentation complete
✓ Production deployment tested
✓ Team trained on docker commands

---

**Last Updated:** 2024-01-15
**Version:** 1.0

# Docker Command Reference & Real-world Scenarios

## Quick Command Reference

### Compose Operations

```bash
# Build
docker-compose build                    # Build all services
docker-compose build backend            # Build specific service
docker-compose build --no-cache         # Force rebuild

# Run
docker-compose up                       # Start in foreground
docker-compose up -d                    # Start in background
docker-compose up --build              # Build and start
docker-compose up service1 service2     # Start specific services

# Stop/Down
docker-compose stop                     # Stop services (containers remain)
docker-compose down                     # Stop and remove containers
docker-compose down -v                  # Remove containers AND volumes
docker-compose down --rmi all           # Remove containers and images

# Logs
docker-compose logs                     # Show all logs
docker-compose logs -f                  # Follow logs (tail -f)
docker-compose logs backend             # Logs for specific service
docker-compose logs --tail=50 backend   # Last 50 lines
docker-compose logs --since 1h          # Logs from last 1 hour
docker-compose logs --timestamps        # Include timestamps

# Status
docker-compose ps                       # List services and status
docker-compose top backend              # Show processes in container
docker-compose stats                    # Show resource usage
```

### Container Operations

```bash
# Execute commands
docker-compose exec backend npm run build       # Run command
docker-compose exec -T backend npm run build    # Without TTY (for scripts)
docker-compose exec backend /bin/sh             # Interactive shell
docker-compose exec postgres psql -l            # PostgreSQL shell

# View info
docker-compose ps -a                   # Include stopped containers
docker-compose images                  # Show images used by compose
docker-compose config                  # Show resolved compose file
docker-compose config > resolved.yml    # Save resolved config

# Manage services
docker-compose restart                 # Restart all services
docker-compose restart backend          # Restart specific service
docker-compose pause backend            # Pause (freeze) container
docker-compose unpause backend          # Resume paused container
docker-compose kill backend             # Force kill (SIGKILL)
docker-compose start backend            # Start stopped container
docker-compose run backend npm --version # Run one-off command
```

### Docker Image Commands

```bash
# List & Inspect
docker images                           # List all images
docker images --filter "dangling=true"  # Show unused images
docker image ls --format "table {{.Repository}}\t{{.Size}}"
docker history myimage:tag              # Show image layers
docker inspect myimage:tag              # Show detailed info

# Build
docker build -t myimage:tag .           # Build from current directory
docker build -t myimage:tag -f ./Dockerfile ./context
docker build --build-arg ARG=value .    # Pass build arguments
docker build --no-cache .               # Ignore cache

# Clean
docker rmi image_name                   # Remove image
docker image prune                      # Remove dangling images
docker image prune -a                   # Remove all unused images

# Registry
docker tag myimage:tag registry/myimage:tag    # Tag image
docker push registry/myimage:tag                # Push to registry
docker pull registry/myimage:tag                # Pull from registry
docker login registry                           # Login to registry
docker logout registry                          # Logout
```

### System Commands

```bash
# Cleanup
docker system df                        # Show disk usage
docker system prune                     # Remove unused containers/images
docker system prune -a                  # Remove all unused resources
docker system prune -a --volumes        # Also remove unused volumes

# Inspect
docker ps                               # List running containers
docker ps -a                            # List all containers
docker ps -a --format "table {{.ID}}\t{{.Image}}\t{{.Status}}"
docker logs container_id                # View container logs
docker logs -f container_id             # Follow logs
docker top container_id                 # Show processes
docker stats container_id               # Resource usage
docker inspect container_id             # Detailed info

# Network
docker network ls                       # List networks
docker network inspect network_name     # Show network details
docker network create my_network        # Create network
docker network rm my_network            # Remove network
```

---

## Real-world Scenarios

### Scenario 1: Local Development Setup

```bash
# Step 1: First time setup
cd my-project
cp .env.example .env.local
# Edit .env.local with local values

# Step 2: Build and start
docker-compose -f docker-compose.local.yml build
docker-compose -f docker-compose.local.yml up -d

# Step 3: Wait for database to be ready (watch the logs)
docker-compose logs -f postgres

# Step 4: Run migrations and seed
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

# Step 5: Verify everything works
docker-compose ps
# All should show "Up" and "(healthy)"

# Step 6: Access application
# Frontend: http://localhost
# Backend: http://localhost:4000
```

### Scenario 2: Debugging a Service

```bash
# Something is failing, let's investigate

# 1. Check service status
docker-compose ps
# Status might show: "Up 2 seconds (unhealthy)" or "Exited (1)"

# 2. View logs (lots of output expected)
docker-compose logs --tail=100 backend

# 3. Search for errors
docker-compose logs backend | grep -i error

# 4. Get more context
docker-compose logs --since 5m backend

# 5. Connect to container to debug manually
docker-compose exec backend /bin/sh
# Inside container:
ls -la dist/
npm run build
echo $DATABASE_URL

# 6. Try a command directly
docker-compose exec backend npx prisma migrate status

# 7. If database issue, check database
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
# Inside psql:
\dt           # List tables
\l            # List databases
SELECT * FROM public.User LIMIT 5;
\q            # Exit
```

### Scenario 3: Database Recovery

```bash
# Database corrupted or data wrong, need to reset

# Option 1: Reset via Prisma (DESTRUCTIVE!)
docker-compose exec backend npx prisma migrate reset
# This will:
# - Drop database
# - Create new database
# - Run migrations
# - Run seed

# Option 2: Manual reset
docker-compose down -v    # Remove all volumes
docker-compose up -d      # Start fresh
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

# Option 3: Backup before reset
docker-compose exec postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
# Then do reset...

# Option 4: Restore from backup
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

### Scenario 4: Performance Issues

```bash
# Application is slow, let's investigate

# 1. Check container resources
docker stats
# Look for high CPU or memory usage
# If memory near limit, you have a leak

# 2. Check database performance
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# 3. Check logs for slow queries
docker-compose logs backend | grep "slow\|took"

# 4. Monitor in real-time
watch -n 1 'docker stats --no-stream'

# 5. Profile application
docker-compose exec backend npm run profile

# 6. Increase resources temporarily
# Edit docker-compose.local.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '2'        # Increase from 1
#       memory: 2048M    # Increase from 1024M

docker-compose up -d
```

### Scenario 5: Update Application Code

```bash
# Code changed, need to rebuild

# Option 1: With volumes (development)
# Already mounted, just restart:
docker-compose restart backend
# Code reloads automatically if you have file watcher

# Option 2: Without volumes, need full rebuild
docker-compose rebuild backend
docker-compose up -d

# Option 3: Full clean rebuild
docker-compose down -v
docker-compose build --no-cache backend
docker-compose up -d

# Step 4: Run migrations if schema changed
docker-compose exec backend npx prisma migrate deploy
```

### Scenario 6: Deploy to Production

```bash
# Prerequisites:
# - Images built locally or in CI/CD pipeline
# - Images pushed to registry
# - Secrets prepared in .env file

# Step 1: Prepare environment
scp .env production-server:/app/.env

# Step 2: Pull latest images
ssh production-server "cd /app && docker-compose -f docker-compose.prod.yml pull"

# Step 3: Backup database (if upgrading existing)
ssh production-server "cd /app && docker-compose exec -T postgres pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB > backup_$(date +%Y%m%d).sql"

# Step 4: Start new services
ssh production-server "cd /app && docker-compose -f docker-compose.prod.yml up -d"

# Step 5: Verify
ssh production-server "cd /app && docker-compose ps"
ssh production-server "cd /app && docker-compose logs --tail=20"

# Step 6: Test application
curl https://production-server/health
```

### Scenario 7: Multi-environment Testing

```bash
# Test same code on multiple environments

# Local
docker-compose -f docker-compose.local.yml up -d
docker-compose logs -f backend

# Staging
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d
# Test...

# Production
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml config  # Verify config before starting
```

### Scenario 8: Handle Service Dependencies

```bash
# Backend depends on database, but database is slow to start

# Problem: Backend starts before database is ready
# Solution: Healthchecks in docker-compose.yml

# This ensures backend waits:
depends_on:
  postgres:
    condition: service_healthy

# Verify it's working:
docker-compose logs postgres
docker-compose logs backend
# Should show "database is now available"

# Test by restarting database
docker-compose restart postgres
# Backend should disconnect and reconnect automatically
```

### Scenario 9: Monitor Logs in Production

```bash
# Application running in production, need to monitor

# Follow real-time logs
docker-compose logs -f backend

# Search for errors
docker-compose logs backend | grep ERROR

# Get logs from last hour
docker-compose logs --since 1h backend

# Export logs to file
docker-compose logs backend > app_logs.txt

# Search with timestamps
docker-compose logs --timestamps backend | grep "2024-01-15"

# Limit output
docker-compose logs --tail=200 --timestamps backend | tee output.log
```

### Scenario 10: Cleanup & Troubleshoot Disk Space

```bash
# Disk is full, free up space

# 1. Check usage
docker system df
docker system df --verbose

# 2. Remove unused resources
docker system prune -a --volumes
# This removes:
# - Stopped containers
# - Dangling images
# - Unused volumes
# - Unused networks

# 3. Remove specific resources
docker image rm image_name
docker volume rm volume_name
docker container rm container_id

# 4. Deep clean
docker system prune -a --volumes --force
# WARNING: Removes all unused images, not just dangling

# 5. Check after
docker system df
```

---

## Useful Scripts

### Health Check Script

```bash
#!/bin/bash
# health_check.sh - Check all services are healthy

echo "Checking service health..."

STATUS=$(docker-compose ps --format json)

frontend=$(echo $STATUS | jq '.[] | select(.Service=="frontend") | .Status')
backend=$(echo $STATUS | jq '.[] | select(.Service=="backend") | .Status')
postgres=$(echo $STATUS | jq '.[] | select(.Service=="postgres") | .Status')

echo "Frontend: $frontend"
echo "Backend: $backend"
echo "Database: $postgres"

if [[ $frontend == *"healthy"* ]] && [[ $backend == *"healthy"* ]] && [[ $postgres == *"healthy"* ]]; then
  echo "✓ All services healthy"
  exit 0
else
  echo "✗ Some services unhealthy"
  docker-compose logs
  exit 1
fi
```

### Backup Script

```bash
#!/bin/bash
# backup.sh - Backup database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$TIMESTAMP.sql"

echo "Backing up database to $BACKUP_FILE..."
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✓ Backup successful: $BACKUP_FILE"
  gzip $BACKUP_FILE
  echo "✓ Compressed: ${BACKUP_FILE}.gz"
else
  echo "✗ Backup failed"
  exit 1
fi
```

### Log Analyzer Script

```bash
#!/bin/bash
# analyze_logs.sh - Analyze logs for errors

echo "=== Error Count ==="
docker-compose logs backend | grep -i "error" | wc -l

echo "=== Recent Errors ==="
docker-compose logs backend | grep -i "error" | tail -10

echo "=== Slow Queries ==="
docker-compose logs backend | grep "ms" | awk -F' ' '{print $NF}' | sort -rn | head -5

echo "=== Failed Requests ==="
docker-compose logs backend | grep "401\|403\|404\|500" | wc -l
```

---

## Cheat Sheet

```bash
# Quick start
docker-compose up -d && docker-compose exec backend npm run seed

# Kill and clean
docker-compose down -v && rm -rf volumes/*

# View everything
docker-compose ps && docker-compose logs --tail=20

# Shell access
docker-compose exec backend /bin/sh

# Database access
docker-compose exec postgres psql -U user -d dbname

# Full rebuild
docker-compose down -v && docker-compose build --no-cache && docker-compose up -d
```

---

## Common Errors & Quick Fixes

| Error | Fix |
|-------|-----|
| `Cannot connect to Docker daemon` | Start Docker daemon |
| `Port 5432 already in use` | `docker-compose down` or `lsof -i :5432` |
| `ENOSPC: no space left on device` | `docker system prune -a` |
| `Service unhealthy` | `docker-compose logs service_name` |
| `Cannot find module X` | `docker-compose exec backend npm install` |
| `psql: FATAL: database "mydb" does not exist` | `docker-compose exec backend npx prisma migrate deploy` |
| `Connection refused` | Check `DATABASE_URL` has correct host (use service name) |

---

**Version:** 1.0
**Last Updated:** 2024-01-15

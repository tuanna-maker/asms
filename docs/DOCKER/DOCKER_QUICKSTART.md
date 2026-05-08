# Docker Setup - Quick Start Guide

## 5 Phút Setup - Local Development

### 1. Chuẩn bị
```bash
# Clone repository
git clone <your-repo>
cd your-project

# Tạo .env.local file
cp .env.example .env.local

# Edit .env.local với local values
# Database: user/password
# Ports: 80, 4000, 5432
```

### 2. Khởi chạy Services
```bash
# Build images lần đầu
docker-compose -f docker-compose.local.yml build

# Khởi chạy tất cả services
docker-compose -f docker-compose.local.yml up

# Hoặc background
docker-compose -f docker-compose.local.yml up -d
```

### 3. Chạy Migrations & Seed
```bash
# Trong terminal khác
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

### 4. Kiểm tra
```bash
# Xem status
docker-compose ps

# Truy cập
# Frontend: http://localhost
# Backend: http://localhost:4000
# Database: localhost:5432
```

---

## Common Commands

```bash
# View logs
docker-compose logs -f backend

# Shell into container
docker-compose exec backend /bin/sh

# Restart service
docker-compose restart backend

# Stop all
docker-compose stop

# Clean up
docker-compose down -v
```

---

## Troubleshooting

### "Cannot connect to database"
- Check `.env.local` has correct values
- Database host should be `postgres` (not localhost)
- Wait 30s for database to start

### "Port already in use"
```bash
docker-compose down
docker ps -a  # Check for hanging containers
docker rm <container_id>
```

### "Out of memory"
```bash
docker system prune -a
```

---

## 📚 Full Documentation
See `DOCKER_PACKAGING_GUIDE.md` for comprehensive documentation

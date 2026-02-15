# LytheraHub Deployment Guide

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for full stack)

### Quick Start (Dev Mode)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set DEMO_MODE=true for local dev without API keys
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Quick Start (Docker)

```bash
# Demo mode — no API keys needed
docker-compose -f docker-compose.yml -f docker-compose.demo.yml up --build

# Full mode — requires API keys in backend/.env
docker-compose up --build
```

---

## Docker Compose Services

| Service | Image | Port | Notes |
|---|---|---|---|
| `frontend` | Node 20 + Nginx | 3000 | Serves React SPA, proxies /api |
| `backend` | Python 3.11 | 8000 | FastAPI application |
| `postgres` | PostgreSQL 15 | 5432 | Main database |
| `redis` | Redis 7 | 6379 | Cache + Celery broker |
| `celery-worker` | Python 3.11 | — | Background task processing |
| `celery-beat` | Python 3.11 | — | Scheduled task scheduler |
| `n8n` | n8n latest | 5678 | Workflow automation engine |

---

## Environment Variables

All configuration is via environment variables. See `backend/.env.example` for the full list.

### Required (Production)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/lytherahub

# Security
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Redis
REDIS_URL=redis://redis:6379/0
```

### Optional

```env
# Stripe billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# n8n
N8N_HOST=http://n8n:5678
N8N_API_KEY=...

# App settings
DEMO_MODE=false
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-domain.com
```

---

## Production Deployment

### Option 1: Docker on VPS (Recommended)

1. **Provision a VPS** (e.g., Hetzner, DigitalOcean, AWS EC2)
   - Minimum: 2 vCPU, 4 GB RAM, 40 GB SSD
   - Recommended: 4 vCPU, 8 GB RAM for production load

2. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

3. **Clone and configure**
   ```bash
   git clone https://github.com/your-username/lytherahub.git
   cd lytherahub
   cp backend/.env.example backend/.env
   # Edit backend/.env with production values
   ```

4. **Start services**
   ```bash
   docker-compose up -d --build
   ```

5. **Set up reverse proxy** (Nginx or Caddy) with SSL
   ```nginx
   server {
       listen 443 ssl;
       server_name lytherahub.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/lytherahub.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/lytherahub.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /ws/ {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

### Option 2: Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add PostgreSQL and Redis services
3. Set environment variables in Railway dashboard
4. Deploy — Railway handles Docker builds automatically

### Option 3: AWS (ECS + RDS)

1. Push Docker images to ECR
2. Create RDS PostgreSQL instance
3. Create ElastiCache Redis instance
4. Deploy to ECS Fargate with task definitions for each service
5. Use ALB for load balancing and SSL termination

---

## Database Migrations

Tables are auto-created on startup via SQLAlchemy `create_all()`. For production schema changes:

1. Add/modify models in `backend/app/models/database.py`
2. Tables are created on next startup
3. For column additions, the app handles missing columns gracefully

For more complex migrations, consider adding Alembic:
```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker
```

### Celery Monitoring
```bash
# Check worker status
docker-compose exec celery-worker celery -A app.tasks.worker inspect active
```

---

## Backup

### Database
```bash
# Backup
docker-compose exec postgres pg_dump -U lytherahub lytherahub > backup.sql

# Restore
docker-compose exec -T postgres psql -U lytherahub lytherahub < backup.sql
```

### n8n Workflows
Workflow JSON files are stored in the `n8n/docker-data/` volume. Back up this directory regularly.

---

## Scaling

For higher traffic:

1. **Backend**: Run multiple FastAPI instances behind a load balancer
2. **Celery**: Add more worker containers (`docker-compose up --scale celery-worker=3`)
3. **Database**: Switch to managed PostgreSQL (RDS, Cloud SQL)
4. **Redis**: Switch to managed Redis (ElastiCache, Upstash)
5. **Frontend**: Serve via CDN (CloudFront, Cloudflare)

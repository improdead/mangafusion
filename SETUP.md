# MangaFusion Setup Guide

Quick setup guide to get MangaFusion running locally.

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (local or Supabase)
- **Redis** 6+ (local or cloud)
- **Supabase account** (for image storage)
- **OpenAI API key** or **Gemini API key** (for AI generation)
- **Segmind API key** (for canvas refinement)

## 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/your-org/mangafusion.git
cd mangafusion

# Install dependencies
npm install
cd backend && npm install && cd ..
```

## 2. Database Setup

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (if not installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Create database
createdb mangafusion

# Your DATABASE_URL:
# postgresql://postgres:password@localhost:5432/mangafusion
```

### Option B: Supabase PostgreSQL

1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy connection string from Settings > Database
4. Use in DATABASE_URL

## 3. Redis Setup

### Option A: Local Redis

```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt install redis

# Start Redis
redis-server

# Your REDIS_URL:
# redis://localhost:6379
```

### Option B: Redis Cloud

1. Go to https://redis.com/try-free/
2. Create free database
3. Copy connection string
4. Use in REDIS_URL

## 4. Supabase Storage

1. Go to https://supabase.com/dashboard
2. Select your project (or create one)
3. Go to Storage > Create Bucket
4. Create bucket named: `manga-images`
5. Set to **Public** (for image access)
6. Copy these from Settings > API:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: Anon/Public key

## 5. AI Provider Setup

### OpenAI (Recommended)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `OPENAI_API_KEY`
4. Estimated cost: $0.40 per episode (10 pages)

### Gemini (Alternative - Cheaper)

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy to `GEMINI_API_KEY`
4. Estimated cost: $0.02 per episode (50x cheaper)

## 6. Canvas AI Refinement

### Segmind (Recommended)

1. Go to https://www.segmind.com/
2. Sign up and get API key
3. Copy to `SEGMIND_API_KEY`
4. Cost: $0.002-0.005 per refinement

## 7. Environment Configuration

```bash
# Copy root .env.example
cp .env.example .env

# Copy backend .env.example
cp backend/.env.example backend/.env

# Copy frontend .env.local.example
cp .env.local.example .env.local

# Edit .env and fill in your API keys
nano .env  # or vim, code, etc.
```

### Minimum Required Variables

```bash
# In root .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/mangafusion
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=manga-images
OPENAI_API_KEY=sk-your-key-here
SEGMIND_API_KEY=your-segmind-key
```

```bash
# In .env.local:
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## 8. Database Migration

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
```

## 9. Start Services

### Development Mode (Recommended)

```bash
# Starts both frontend and backend
./dev.sh
```

This will:
- Start backend on http://localhost:4000
- Start frontend on http://localhost:3000
- Auto-reload on file changes

### Manual Start (Alternative)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

## 10. Verify Setup

1. Open http://localhost:3000
2. Click "Create New Episode"
3. Enter a story idea (e.g., "A ninja cat saves Tokyo")
4. Watch as it generates a 10-page manga!

## Optional Features

### Text-to-Speech (Audiobooks)

1. Get ElevenLabs API key: https://elevenlabs.io/
2. Add to .env:
   ```bash
   ELEVENLABS_API_KEY=your-key
   ```
3. Cost: ~$3 per episode audio

### Observability (Sentry + OpenTelemetry)

1. Create Sentry project: https://sentry.io/
2. Add to .env:
   ```bash
   ENABLE_OBSERVABILITY=true
   SENTRY_DSN=your-sentry-dsn
   ```
3. For tracing, run Jaeger:
   ```bash
   docker run -d -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
   ```

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `psql $DATABASE_URL`
- Verify DATABASE_URL format
- Check firewall/network settings

### "Cannot connect to Redis"
- Check Redis is running: `redis-cli ping`
- Should respond with `PONG`
- Verify REDIS_URL format

### "OpenAI API error"
- Verify API key is valid
- Check you have credits: https://platform.openai.com/account/usage
- Check rate limits

### "Supabase storage error"
- Verify bucket exists and is public
- Check SUPABASE_URL and SUPABASE_ANON_KEY
- Ensure bucket name matches SUPABASE_BUCKET

### "Canvas refinement fails"
- Verify SEGMIND_API_KEY is set
- Check API credits at https://www.segmind.com/

## Development Tips

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

### View Database
```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Clear Redis Queue
```bash
redis-cli FLUSHALL
```

### Check Logs
- Backend logs: `backend/logs/`
- Frontend logs: Browser console
- Sentry dashboard (if enabled)

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup with:
- Docker containers
- Environment-specific configs
- SSL/TLS setup
- Horizontal scaling
- CDN configuration

## Cost Breakdown (Per Episode)

| Feature | Provider | Cost |
|---------|----------|------|
| Planning | OpenAI gpt-5-mini | $0.01 |
| 10 Images | OpenAI gpt-image-1 | $0.40 |
| OR 10 Images | Gemini Flash Image | $0.02 |
| Canvas Refinement | Segmind (optional) | $0.02 |
| TTS Audio | ElevenLabs (optional) | $3.00 |
| **Total** | OpenAI stack | **$3.43** |
| **Total** | Gemini stack | **$3.05** |

### Free Tier Options

- **Supabase**: 500MB storage + 2GB bandwidth/month free
- **Redis Cloud**: 30MB free
- **Sentry**: 5K errors/month free
- **OpenAI**: $5 free credits (new users)
- **Gemini**: 1,500 requests/day free

## Next Steps

- Read [CANVAS_FEATURE_README.md](./CANVAS_FEATURE_README.md) for canvas drawing
- See [agent.md](./agent.md) for architecture overview
- Check [API documentation](./API.md) for endpoints
- Join Discord for support (link)

---

**Need help?** Open an issue at https://github.com/your-org/mangafusion/issues

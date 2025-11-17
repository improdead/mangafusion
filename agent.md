# MangaFusion - Complete Developer Guide

**Last Updated:** 2025-11-17
**Version:** 1.0.0
**Status:** Production Ready (Internal Testing)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Database Schema](#database-schema)
6. [Features Deep Dive](#features-deep-dive)
7. [API Reference](#api-reference)
8. [Code Structure](#code-structure)
9. [Development Workflow](#development-workflow)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Security Notes](#security-notes)

---

## Project Overview

### What is MangaFusion?

MangaFusion is an **AI-powered manga creation platform** that transforms user ideas into complete 10-page manga episodes with:
- AI story planning and character design
- Real-time image generation (B/W manga style)
- Text-to-speech audiobook mode
- Professional export formats (PDF/CBZ)
- Background job processing with queues
- Production-grade observability

### Tech Stack

**Frontend:**
- Next.js 15 (React framework)
- TypeScript
- Server-Sent Events (SSE) for real-time updates
- Sentry (error tracking)

**Backend:**
- NestJS (Node.js framework)
- TypeScript
- Prisma ORM + PostgreSQL (persistence)
- BullMQ + Redis (job queue)
- Pino (structured logging)
- OpenTelemetry (distributed tracing)

**AI Services:**
- **OpenAI**: gpt-5-mini (planning), gpt-image-1 (image generation)
- **Gemini**: gemini-2.5-flash (planning), gemini-2.5-flash-image-preview (images)
- **ElevenLabs**: eleven_flash_v2_5 (text-to-speech)

**Storage:**
- Supabase Storage (images and audio files)

**Infrastructure:**
- Docker (PostgreSQL, Redis, Jaeger)
- Git (version control)

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                      (Next.js 15)                           │
│                                                             │
│  Pages:                    Components:                      │
│  • /                       • EpisodeCard                    │
│  • /episodes/[id]          • ReaderMode                     │
│  • /studio/[id]            • ExportModal                    │
│                            • ProgressTracker                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST + SSE
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                        Backend API                          │
│                       (NestJS)                              │
│                                                             │
│  Modules:                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Episodes │  │ Planner  │  │ Renderer │  │   TTS    │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │            │              │              │         │
│        ▼            ▼              ▼              ▼         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Queue   │  │  Export  │  │ Storage  │  │  Events  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └─────┬────┘  └──────────┘  └────┬─────┘  └────┬─────┘   │
│        │                           │              │         │
└────────┼───────────────────────────┼──────────────┼─────────┘
         │                           │              │
         │                           │              │
    ┌────▼─────┐              ┌─────▼──────┐  ┌───▼─────┐
    │  Redis   │              │  Supabase  │  │   SSE   │
    │  Queue   │              │  Storage   │  │ Clients │
    └────┬─────┘              └────────────┘  └─────────┘
         │
    ┌────▼─────────────┐
    │ Background Worker│
    │                  │
    │  • Page Jobs     │
    │  • Character Jobs│
    └──────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│                                                              │
│  ┌─────────────────┐         ┌──────────────────┐           │
│  │   PostgreSQL    │         │   Observability  │           │
│  │                 │         │                  │           │
│  │  • Episodes     │         │  • Sentry        │           │
│  │  • Pages        │         │  • Jaeger/OTLP   │           │
│  │  • Characters   │         │  • Pino Logs     │           │
│  └─────────────────┘         └──────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

**Episode Creation:**
1. User submits form → Frontend POST /api/episodes
2. Backend validates input (Zod schema)
3. Planner service generates outline (AI call with retries)
4. Queue service creates character + page jobs
5. Worker processes jobs in background
6. Real-time progress streamed via SSE
7. Results saved to database + Supabase storage

**Export Flow:**
1. User clicks Export → POST /api/episodes/:id/export
2. Export service downloads all page images (parallel)
3. Generates PDF or CBZ with metadata
4. Returns file buffer to client
5. Browser downloads file

---

## Quick Start

### Prerequisites

```bash
# Required
- Node.js 18+
- npm or yarn

# Optional (for full features)
- PostgreSQL 12+ (persistence)
- Redis 6+ (background jobs)
- Docker (easiest way to run PostgreSQL + Redis + Jaeger)
```

### Installation

```bash
# 1. Clone repository
git clone <your-repo>
cd mangafusion

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp .env.local.example .env.local

# Edit backend/.env with your API keys (see Environment Configuration section)

# 4. (Optional) Start infrastructure services
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password --name postgres postgres:14
docker run -d -p 6379:6379 --name redis redis:alpine
docker run -d -p 16686:16686 -p 4318:4318 --name jaeger jaegertracing/all-in-one

# 5. (Optional) Set up database
cd backend
npm run prisma:migrate:deploy
npm run prisma:seed  # Adds 2 test episodes
cd ..

# 6. Start development servers
./dev.sh  # Starts both frontend and backend

# Or manually:
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
npm run dev

# Terminal 3 (optional): Worker
cd backend && npm run worker:generate
```

### Verify Setup

```bash
# 1. Frontend should be running at http://localhost:3000
# 2. Backend should be running at http://localhost:4000
# 3. Test API: curl http://localhost:4000/api/health

# 4. Create a test episode:
# - Go to http://localhost:3000
# - Fill out the form
# - Click "Generate Manga Episode"
# - Watch real-time progress
```

---

## Environment Configuration

### Backend (`backend/.env`)

```bash
# ========================================
# AI Provider Configuration
# ========================================
# Choose 'openai' or 'gemini'
PLANNER_PROVIDER=openai
RENDERER_PROVIDER=openai

# ========================================
# OpenAI (Recommended)
# ========================================
OPENAI_API_KEY=sk-...
OPENAI_PLANNER_MODEL=gpt-5-mini
OPENAI_IMAGE_MODEL=gpt-image-1

# ========================================
# Gemini (Alternative)
# ========================================
GEMINI_API_KEY=...
PLANNER_MODEL=gemini-2.5-flash
RENDERER_IMAGE_MODEL=gemini-2.5-flash-image-preview

# ========================================
# Supabase Storage (Required)
# ========================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=manga-images

# For worker (needs admin access):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ========================================
# Database (Optional - for persistence)
# ========================================
DATABASE_URL=postgresql://user:password@localhost:5432/mangafusion

# ========================================
# Redis Queue (Optional - for background jobs)
# ========================================
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY_PAGES=2
WORKER_CONCURRENCY_CHARACTERS=1

# ========================================
# Planner Hardening
# ========================================
PLANNER_MAX_RETRIES=3
PLANNER_INITIAL_DELAY_MS=1000
PLANNER_MAX_DELAY_MS=10000
PLANNER_ENABLE_STUB_FALLBACK=true
PLANNER_ENABLE_PARTIAL_MERGE=true

# ========================================
# ElevenLabs TTS (Optional - for audiobook)
# ========================================
ELEVENLABS_API_KEY=...
ELEVENLABS_DEFAULT_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL=eleven_flash_v2_5

# ========================================
# Observability (Optional)
# ========================================
ENABLE_OBSERVABILITY=true
SENTRY_DSN=https://...@sentry.io/...
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
LOG_LEVEL=debug

# ========================================
# Server
# ========================================
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
NEXT_PUBLIC_ENABLE_OBSERVABILITY=true
```

### Supabase Setup

1. Create project at https://supabase.com
2. Go to **Storage** → Create new bucket: `manga-images`
3. Make bucket **public**
4. Set allowed MIME types: `image/png`, `image/jpeg`, `image/webp`, `audio/mpeg`
5. Copy **URL** and **anon key** from Settings → API
6. For worker, copy **service_role key** (DO NOT expose publicly)

---

## Database Schema

### Overview

```sql
Episode (1) ───< Pages (10)
Episode (1) ───< Characters (N)
```

### Episode Table

Stores manga episode metadata.

```prisma
model Episode {
  id            String   @id @default(uuid())
  seedInput     Json     // Original form input
  outline       Json?    // AI-generated story outline
  rendererModel String?  // Model used (e.g., "gpt-image-1")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  pages         Page[]
  characters    Character[]

  @@index([createdAt])
  @@index([updatedAt])
}
```

**Fields:**
- `seedInput`: User's original input (title, genre, characters, etc.)
- `outline`: AI-generated outline with 10 pages, panels, prompts, dialogue
- `rendererModel`: AI model used for image generation

### Page Table

Stores individual manga pages.

```prisma
model Page {
  id         String     @id @default(uuid())
  episodeId  String
  pageNumber Int        // 1-10
  status     PageStatus // queued | in_progress | done | failed
  imageUrl   String?    // Supabase storage URL
  audioUrl   String?    // TTS audio URL
  seed       Int?       // Random seed for generation
  version    Int?       @default(0)
  error      String?    // Error message if failed
  overlays   Json?      // Dialogue bubbles and overlays

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, pageNumber])
  @@index([episodeId])
  @@index([status])
  @@index([episodeId, status])
}
```

**Status Flow:**
```
queued → in_progress → done
                    ↘ failed
```

### Character Table

Stores character reference images for consistency.

```prisma
model Character {
  id            String   @id @default(uuid())
  episodeId     String
  name          String
  description   String?
  assetFilename String   // e.g., "rei.png"
  imageUrl      String?  // Supabase storage URL
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, assetFilename])
  @@index([episodeId])
}
```

### Database Operations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate:dev

# Run migrations (production)
npm run prisma:migrate:deploy

# Seed test data
npm run prisma:seed

# Open Prisma Studio (GUI)
npm run prisma:studio  # http://localhost:5555

# Reset database (⚠️ deletes all data)
npm run prisma:migrate:reset
```

### Fallback Behavior

If `DATABASE_URL` is not set:
- App runs in **in-memory mode**
- All data stored in memory (Map objects)
- Data lost on server restart
- Read operations try database first, fallback to memory
- Write operations save to both (if database available)

---

## Features Deep Dive

### Feature 1: Prisma + PostgreSQL Persistence

**Status:** ✅ Production Ready

**What it does:**
- Persists all episodes, pages, and characters to PostgreSQL
- Atomic transactions for data integrity
- Graceful fallback to in-memory mode
- Strategic indexes for performance

**Files:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/migrations/` - Migration history
- `backend/src/episodes/episodes.service.ts` - Integrated Prisma operations

**Usage:**
```typescript
// Create episode with transaction
await this.prisma.$transaction(async (tx) => {
  const episode = await tx.episode.create({ data: {...} });
  await tx.page.createMany({ data: pages });
  await tx.character.createMany({ data: characters });
});

// Query with relations
const episode = await this.prisma.episode.findUnique({
  where: { id },
  include: { pages: true, characters: true }
});
```

### Feature 2: BullMQ + Redis Queueing

**Status:** ✅ Production Ready

**What it does:**
- Background job processing for page/character generation
- Parallel processing with configurable concurrency
- Priority-based queuing (characters before pages)
- Real-time progress via SSE
- Horizontal scalability (multiple workers)

**Files:**
- `backend/src/queue/queue.service.ts` - Job creation
- `backend/src/queue/queue-events-bridge.service.ts` - Redis pub/sub bridge
- `backend/src/worker/generate.worker.ts` - Worker process

**Job Types:**
1. **Character Jobs**: Generate character reference images (priority: 1)
2. **Page Jobs**: Generate manga pages (priority: 2)

**Usage:**
```bash
# Start worker
cd backend
npm run worker:generate

# Monitor queue
curl http://localhost:4000/admin/queue/stats

# Check job status
curl http://localhost:4000/admin/queue/jobs/page
```

**Fallback:**
If `REDIS_URL` not set, jobs run in-process (synchronous).

### Feature 3: Planner Hardening

**Status:** ✅ Production Ready

**What it does:**
- Strict JSON schema validation (Zod)
- Retry logic with exponential backoff (3 attempts)
- 6 JSON extraction strategies
- JSON repair functionality
- Partial merge fallback
- Stub outline generation as last resort

**Files:**
- `backend/src/planner/schemas.ts` - Zod schemas
- `backend/src/planner/planner.utils.ts` - Retry + extraction
- `backend/src/planner/planner.service.ts` - Main service

**Validation Rules:**
- Title: 1-200 characters
- Genre: 1-10 tags
- Setting: 1-500 characters
- Characters: 0-10, each with name (1-100 chars) and description (1-500 chars)
- Outline: Exactly 10 pages, 3-6 panels each

**Retry Strategy:**
```
Attempt 1: 0ms delay
Attempt 2: 1000ms delay
Attempt 3: 2000ms delay
Final: Stub fallback if enabled
```

### Feature 4: PDF/CBZ Export

**Status:** ✅ Production Ready

**What it does:**
- Export episodes as PDF or CBZ (comic book archive)
- Parallel image downloads for performance
- Full metadata embedding
- Optional audio file inclusion

**Files:**
- `backend/src/export/export.service.ts` - Export logic
- `pages/episodes/[id].tsx` - Export UI modal

**API:**
```bash
# PDF export
curl -X POST "http://localhost:4000/api/episodes/:id/export?format=pdf" \
  --output episode.pdf

# CBZ with audio
curl -X POST "http://localhost:4000/api/episodes/:id/export?format=cbz&includeAudio=true" \
  --output episode.cbz
```

**Features:**
- **PDF**: Full-page images, embedded metadata, compatible with all readers
- **CBZ**: ZIP archive with images + ComicInfo.xml, compatible with comic readers
- **Performance**: ~5s for 10 pages (parallel downloads)

### Feature 5: Sentry + OpenTelemetry Observability

**Status:** ✅ Production Ready

**What it does:**
- Error tracking with Sentry
- Distributed tracing with OpenTelemetry
- Structured logging with Pino
- Request correlation (trace IDs)
- AI token usage tracking

**Files:**
- `backend/src/instrumentation.ts` - OTEL + Sentry init
- `backend/src/observability/` - Logger, tracing, correlation
- `sentry.client.config.ts` - Frontend Sentry

**Usage:**
```typescript
// Logging
this.logger.info('Episode created', { episodeId });

// Tracing
const span = this.tracingService.startSpan('generate-page');
try {
  // ... work
  this.tracingService.setSpanAttributes(span, { pageNumber });
  this.tracingService.endSpan(span);
} catch (error) {
  this.tracingService.recordException(span, error);
  throw error;
}
```

**Dashboards:**
- **Sentry**: https://sentry.io (errors, performance, session replay)
- **Jaeger**: http://localhost:16686 (distributed traces)

---

## API Reference

### Episodes

#### Create Episode
```http
POST /api/episodes
Content-Type: application/json

{
  "title": "My Manga Story",
  "genre": ["action", "adventure"],
  "tone": "exciting",
  "setting": "A futuristic city",
  "characters": [
    {
      "name": "Rei",
      "description": "A brave warrior with silver hair"
    }
  ],
  "visualStyle": "black and white manga",
  "styleReferenceUrls": []
}

Response: 200 OK
{
  "id": "uuid",
  "status": "planning",
  "progress": 0
}
```

#### Get Episode
```http
GET /api/episodes/:id

Response: 200 OK
{
  "id": "uuid",
  "seedInput": {...},
  "outline": {...},
  "pages": [...],
  "characters": [...]
}
```

#### List Episodes
```http
GET /api/episodes

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "...",
    "createdAt": "2025-11-17T..."
  }
]
```

#### Delete Episode
```http
DELETE /api/episodes/:id

Response: 204 No Content
```

### Pages

#### Get Page
```http
GET /api/episodes/:id/pages/:pageNumber

Response: 200 OK
{
  "id": "uuid",
  "pageNumber": 1,
  "status": "done",
  "imageUrl": "https://...",
  "audioUrl": "https://...",
  "overlays": {...}
}
```

#### Regenerate Page
```http
POST /api/episodes/:id/pages/:pageNumber/regenerate
Content-Type: application/json

{
  "customPrompt": "Make it more dramatic"
}

Response: 200 OK
{
  "status": "queued",
  "version": 2
}
```

### Export

#### Export Episode
```http
POST /api/episodes/:id/export?format=pdf&includeAudio=false

Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="My_Manga_Story_manga.pdf"

[binary PDF data]
```

### TTS

#### Generate Audio
```http
POST /api/tts/generate
Content-Type: application/json

{
  "text": "Rei: Let's go!",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}

Response: 200 OK
{
  "audioUrl": "https://...",
  "characterCount": 12
}
```

### SSE Events

#### Subscribe to Episode Events
```http
GET /api/events/:episodeId

Response: text/event-stream

data: {"type":"planning_start","episodeId":"uuid"}

data: {"type":"planning_done","episodeId":"uuid"}

data: {"type":"page_start","episodeId":"uuid","pageNumber":1}

data: {"type":"page_done","episodeId":"uuid","pageNumber":1,"imageUrl":"https://..."}

data: {"type":"character_done","episodeId":"uuid","characterId":"uuid","imageUrl":"https://..."}
```

### Admin

#### Queue Stats
```http
GET /admin/queue/stats

Response: 200 OK
{
  "page": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3
  },
  "character": {
    "waiting": 1,
    "active": 1,
    "completed": 50,
    "failed": 0
  }
}
```

---

## Code Structure

### Backend (`backend/src/`)

```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Entry point
├── instrumentation.ts         # OTEL + Sentry init
│
├── episodes/                  # Episode management
│   ├── episodes.controller.ts # API routes
│   ├── episodes.service.ts    # Business logic
│   └── episodes.module.ts     # Module definition
│
├── planner/                   # AI story planning
│   ├── planner.service.ts     # Main service
│   ├── schemas.ts             # Zod validation
│   ├── planner.utils.ts       # Retry + extraction
│   └── planner.fallback.ts    # Fallback strategies
│
├── renderer/                  # Image generation
│   ├── renderer.service.ts    # Main service
│   ├── openai-renderer.ts     # OpenAI implementation
│   └── gemini-renderer.ts     # Gemini implementation
│
├── tts/                       # Text-to-speech
│   ├── tts.controller.ts      # API routes
│   └── tts.service.ts         # ElevenLabs integration
│
├── storage/                   # Supabase storage
│   └── storage.service.ts     # Upload/download
│
├── queue/                     # Background jobs
│   ├── queue.service.ts       # Job creation
│   ├── queue.controller.ts    # Admin API
│   ├── queue.module.ts        # Module
│   └── queue-events-bridge.service.ts  # Redis pub/sub
│
├── export/                    # PDF/CBZ export
│   ├── export.service.ts      # Export logic
│   └── export.module.ts       # Module
│
├── events/                    # Server-Sent Events
│   ├── events.controller.ts   # SSE endpoint
│   └── events.service.ts      # Event streaming
│
├── observability/             # Logging + Tracing
│   ├── logger.service.ts      # Pino logger
│   ├── tracing.service.ts     # OTEL tracing
│   └── correlation.interceptor.ts  # Request IDs
│
├── prisma/                    # Database
│   └── prisma-error-handler.ts  # Error handling
│
└── worker/                    # Background worker
    └── generate.worker.ts     # BullMQ worker process
```

### Frontend

```
pages/
├── index.tsx                  # Home page (creation form)
├── episodes/
│   └── [id].tsx               # Episode viewer + reader mode
├── studio/
│   └── [id].tsx               # Studio editor
└── api/
    └── observability-test.ts  # Test endpoint

components/
├── EpisodeCard.tsx            # Episode list item
├── ReaderMode.tsx             # Full-screen reader
├── ExportModal.tsx            # Export format selector
└── ProgressTracker.tsx        # Real-time progress bar

lib/
└── observability/
    └── api-wrapper.ts         # API correlation IDs

sentry.client.config.ts        # Sentry frontend
sentry.server.config.ts        # Sentry server
```

---

## Development Workflow

### Making Code Changes

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Make changes
# Edit files...

# 3. Test locally
npm run dev  # Frontend
cd backend && npm run start:dev  # Backend

# 4. Build to verify no TypeScript errors
cd backend && npm run build
cd .. && npm run build

# 5. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

### Adding a New API Endpoint

```typescript
// 1. Add route to controller (backend/src/episodes/episodes.controller.ts)
@Get(':id/custom')
async customEndpoint(@Param('id') id: string) {
  return this.episodesService.customMethod(id);
}

// 2. Add method to service (backend/src/episodes/episodes.service.ts)
async customMethod(id: string) {
  // Your logic here
  return { result: 'success' };
}

// 3. Test
curl http://localhost:4000/api/episodes/abc123/custom
```

### Adding a New Database Field

```bash
# 1. Edit schema
# backend/prisma/schema.prisma
model Page {
  # ... existing fields
  newField String?  # Add this
}

# 2. Create migration
cd backend
npm run prisma:migrate:dev
# Enter migration name: "add_new_field"

# 3. Update code to use new field
# backend/src/episodes/episodes.service.ts

# 4. Restart server
npm run start:dev
```

### Testing Changes

```bash
# Backend TypeScript build
cd backend && npm run build

# Frontend build
npm run build

# Run Prisma tests
cd backend && npm run prisma:test

# Manual testing
# 1. Start services
# 2. Create episode via UI
# 3. Check logs for errors
# 4. Verify database in Prisma Studio
# 5. Test export functionality
```

---

## Deployment

### Production Checklist

**Backend:**
- [ ] Set all environment variables
- [ ] `ENABLE_OBSERVABILITY=true`
- [ ] `NODE_ENV=production`
- [ ] Run database migrations: `npm run prisma:migrate:deploy`
- [ ] Start Redis server
- [ ] Start worker process: `npm run worker:generate`
- [ ] Start backend: `npm run build && npm start`

**Frontend:**
- [ ] Set `NEXT_PUBLIC_API_BASE` to production URL
- [ ] `NEXT_PUBLIC_ENABLE_OBSERVABILITY=true`
- [ ] Build: `npm run build`
- [ ] Start: `npm start`

**Infrastructure:**
- [ ] PostgreSQL (Supabase, Railway, Neon, etc.)
- [ ] Redis (Upstash, Railway, etc.)
- [ ] Jaeger/Honeycomb (optional)
- [ ] Sentry project created

### Docker Deployment

```bash
# PostgreSQL
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mangafusion \
  -v pgdata:/var/lib/postgresql/data \
  postgres:14

# Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redisdata:/data \
  redis:alpine

# Jaeger (optional)
docker run -d \
  --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one
```

### Performance Considerations

**Memory Usage:**
- Base: ~100 MB
- With observability: +20 MB
- Per worker: +50 MB
- Total (1 worker): ~170 MB

**Request Latency:**
- Observability overhead: 5-10ms
- Queue enqueue: <5ms
- Database query: 10-50ms (with indexes)

**Scaling:**
- **Horizontal**: Run multiple worker processes
- **Vertical**: Increase `WORKER_CONCURRENCY_PAGES`

---

## Troubleshooting

### Backend won't start

**Error:** `Error: Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
npm run prisma:generate
```

---

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps  # or sudo systemctl status postgresql

# Start PostgreSQL
docker start postgres  # or sudo systemctl start postgresql

# Or run without database (in-memory mode)
# Remove DATABASE_URL from .env
```

---

**Error:** `PrismaClientInitializationError: Invalid DATABASE_URL`

**Solution:**
- Check connection string format: `postgresql://user:password@host:port/database`
- Verify credentials are correct
- Test connection: `psql -h localhost -U user -d database`

---

### Frontend can't connect to backend

**Error:** Network error when creating episode

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:4000/api/health

# 2. Check CORS configuration
# backend/.env should have:
CORS_ORIGIN=http://localhost:3000

# 3. Check frontend API base
# .env.local should have:
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

---

### Worker not processing jobs

**Error:** Jobs stuck in "queued" status

**Solution:**
```bash
# 1. Check if worker is running
ps aux | grep worker

# 2. Start worker
cd backend
npm run worker:generate

# 3. Check Redis connection
redis-cli ping  # Should return PONG

# 4. Check worker logs for errors
# Look for "Workers started successfully"
```

---

### Image generation fails

**Error:** `Storage upload failed: Invalid credentials`

**Solution:**
```bash
# For worker, you need SUPABASE_SERVICE_ROLE_KEY
# Get it from Supabase dashboard: Settings → API → service_role key

# Add to backend/.env:
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Restart worker
```

---

**Error:** `Failed to download image: 403 Forbidden`

**Solution:**
- Check Supabase bucket is **public**
- Go to Storage → manga-images → Settings → Public bucket: ON

---

### Export fails

**Error:** `Failed to download image for page X`

**Solution:**
- Check page has `imageUrl` in database
- Verify URL is accessible: `curl <imageUrl>`
- Check Supabase storage permissions

---

### Observability not working

**Error:** No traces in Jaeger

**Solution:**
```bash
# 1. Check ENABLE_OBSERVABILITY=true
grep ENABLE_OBSERVABILITY backend/.env

# 2. Check Jaeger is running
curl http://localhost:16686

# 3. Check OTLP endpoint
# backend/.env:
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# 4. Check backend logs for "✅ OpenTelemetry initialized"
```

---

## Security Notes

### Current Status: Internal Testing Only

**⚠️ IMPORTANT:** This application is NOT production-ready for public deployment.

**Missing Security Features:**
- ❌ No authentication/authorization
- ❌ No rate limiting
- ❌ No input sanitization beyond basic validation
- ❌ Admin endpoints are unprotected (`/admin/queue/*`)
- ❌ No CSRF protection
- ❌ No API key management

### Security Recommendations for Production

**1. Authentication:**
```typescript
// Use NestJS Guards
@UseGuards(JwtAuthGuard)
@Controller('episodes')
export class EpisodesController { ... }
```

**2. Rate Limiting:**
```typescript
// Install: npm install @nestjs/throttler
@Throttle(10, 60)  // 10 requests per 60 seconds
```

**3. Input Validation:**
```typescript
// Already using Zod schemas
// Add sanitization for user input
import sanitize from 'sanitize-html';
```

**4. Environment Variables:**
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly

**5. CORS:**
```typescript
// Restrict origins in production
app.enableCors({
  origin: ['https://yourdomain.com'],
  credentials: true
});
```

**6. HTTPS:**
- Always use HTTPS in production
- Redirect HTTP → HTTPS

**7. Content Security Policy:**
```typescript
// Install: npm install helmet
app.use(helmet());
```

---

## Additional Resources

### Documentation
- Prisma Docs: https://www.prisma.io/docs
- NestJS Docs: https://docs.nestjs.com
- Next.js Docs: https://nextjs.org/docs
- BullMQ Docs: https://docs.bullmq.io
- Sentry Docs: https://docs.sentry.io
- OpenTelemetry Docs: https://opentelemetry.io/docs

### AI Providers
- OpenAI API: https://platform.openai.com/docs
- Google Gemini: https://ai.google.dev/docs
- ElevenLabs API: https://elevenlabs.io/docs

### Tools
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Redis Docs: https://redis.io/docs

---

## Contact & Support

For questions or issues:
1. Check this documentation
2. Review error logs (backend console, Sentry)
3. Check Prisma Studio for data issues
4. Review Jaeger traces for request flow
5. Consult relevant documentation links above

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
**Contributors:** Parallel agent implementation (5 agents + integration)

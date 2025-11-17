# BullMQ + Redis Queue Implementation Summary

## Overview
Successfully implemented full background job processing with BullMQ + Redis for the MangaFusion platform. The system supports parallel page generation with configurable concurrency, character generation with priority queuing, and maintains backward compatibility with in-process generation when Redis is not available.

## Files Created

### 1. Queue Services
- `/home/user/mangafusion/backend/src/queue/queue.service.ts` - Enhanced with multiple queues, job management, monitoring
- `/home/user/mangafusion/backend/src/queue/queue-events-bridge.service.ts` - Redis pub/sub bridge for SSE events from workers
- `/home/user/mangafusion/backend/src/queue/queue.controller.ts` - Admin API for queue monitoring and management
- `/home/user/mangafusion/backend/src/queue/queue.module.ts` - Updated to include controller and bridge service

### 2. Worker Process
- `/home/user/mangafusion/backend/src/worker/generate.worker.ts` - Comprehensive standalone worker for page and character generation

### 3. Configuration
- `/home/user/mangafusion/backend/.env.queue.example` - Environment variable examples for queue configuration

## Files Modified

### 1. Episodes Service
- `/home/user/mangafusion/backend/src/episodes/episodes.service.ts`
  - Added QueueService injection
  - Updated `startGeneration()` to use queue when enabled
  - Updated `generateCharacters()` to use queue when enabled
  - Maintains fallback to in-process generation when queue is disabled

### 2. Episodes Module
- `/home/user/mangafusion/backend/src/episodes/episodes.module.ts`
  - Imported QueueModule

### 3. Package Dependencies
- `/home/user/mangafusion/backend/package.json`
  - Added `ioredis: ^5.3.2` for Redis client

## New NPM Packages Added

1. **ioredis** (^5.3.2) - Redis client for pub/sub event bridge
   - Note: BullMQ already included (^5.13.1)

## Environment Variables

### Required for Queue
- `REDIS_URL` - Redis connection string (e.g., `redis://localhost:6379`)
  - If not set, system falls back to in-process generation

### Optional Configuration
- `WORKER_CONCURRENCY_PAGES` - Number of concurrent page jobs (default: 2)
- `WORKER_CONCURRENCY_CHARACTERS` - Number of concurrent character jobs (default: 1)

### Existing Variables (Still Required)
- `DATABASE_URL` - PostgreSQL connection (required for queue mode)
- `GEMINI_API_KEY` or `OPENAI_API_KEY` - For image generation
- `RENDERER_PROVIDER` - 'gemini' or 'openai'
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc. - For storage

## Architecture

### Queue Structure
1. **generate:page** - Page generation queue
   - Priority: 10 (lower priority)
   - Supports parallel processing
   - Configurable concurrency

2. **generate:character** - Character generation queue
   - Priority: 1 (higher priority, runs before pages)
   - Typically runs with concurrency: 1
   - Ensures characters are ready for pages

### Event Flow
1. API enqueues jobs → Redis
2. Worker processes jobs from Redis
3. Worker publishes progress events → Redis pub/sub
4. QueueEventsBridgeService subscribes to events
5. Bridge forwards events → EventsService
6. EventsService streams → Frontend via SSE

### Job Data Structures

**GeneratePageJobData:**
```typescript
{
  episodeId: string;
  pageId: string;
  pageNumber: number;
  seed?: number;
  styleRefUrls?: string[];
  editPrompt?: string;
  baseImageUrl?: string;
  dialogueTextOverride?: string;
}
```

**GenerateCharacterJobData:**
```typescript
{
  episodeId: string;
  characterId: string;
  name: string;
  description: string;
  assetFilename: string;
  visualStyle: string;
  episodeTitle: string;
}
```

## Worker Startup Instructions

### Development
```bash
cd backend
npm run worker:generate
```

### Production
```bash
cd backend
npm run build
node dist/worker/generate.worker.js
```

### Docker/Process Manager
```bash
# Using PM2
pm2 start dist/worker/generate.worker.js --name "mangafusion-worker"

# Using systemd (create service file)
[Service]
ExecStart=/usr/bin/node /path/to/backend/dist/worker/generate.worker.js
Restart=always
```

## Queue Configuration

### Retry Logic
- **Attempts**: 3 retries per job
- **Backoff**: Exponential (starts at 2 seconds)
- **Job Cleanup**: 
  - Keeps last 100 completed jobs
  - Keeps last 200 failed jobs

### Concurrency Defaults
- **Pages**: 2 concurrent jobs
- **Characters**: 1 concurrent job

Adjust via environment variables:
```bash
WORKER_CONCURRENCY_PAGES=4
WORKER_CONCURRENCY_CHARACTERS=2
```

## Queue Monitoring & Admin API

### Endpoints

**GET /admin/queue/stats**
- Returns queue statistics (waiting, active, completed, failed counts)

**GET /admin/queue/health**
- Health check for queue system

**POST /admin/queue/pause**
- Pause all queues (stops processing new jobs)

**POST /admin/queue/resume**
- Resume all queues

**POST /admin/queue/clean**
- Clean old completed and failed jobs (older than 24 hours)

**GET /admin/queue/:queue/:jobId**
- Get specific job details
- `:queue` = 'page' or 'character'

**DELETE /admin/queue/:queue/:jobId**
- Cancel a specific job

## Testing Instructions

### 1. Setup Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis && redis-server
# Linux: sudo apt-get install redis-server && redis-server
```

### 2. Configure Environment
```bash
cd backend
cp .env.queue.example .env
# Edit .env and set REDIS_URL=redis://localhost:6379
```

### 3. Start Services
```bash
# Terminal 1: Start API
npm run dev

# Terminal 2: Start Worker
npm run worker:generate
```

### 4. Test Queue Flow
```bash
# Create episode (triggers character generation)
curl -X POST http://localhost:3000/planner \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Episode",
    "genre_tags": ["action"],
    "tone": "serious",
    "setting": "modern city",
    "cast": [{"name": "Hero", "traits": "brave"}]
  }'

# Start page generation (observe worker logs)
curl -X POST http://localhost:3000/episodes/{episodeId}/generate10

# Monitor queue stats
curl http://localhost:3000/admin/queue/stats

# Watch SSE events (in browser or curl)
curl -N http://localhost:3000/episodes/{episodeId}/stream
```

### 5. Verify Worker Processing
Check worker logs for:
```
[worker] Workers started successfully
[worker:character] Ready to process jobs
[worker:page] Ready to process jobs
[worker:character] Processing character "Hero" for episode {id}
[worker:page] Processing page 1 for episode {id}
```

## Fallback Behavior

When `REDIS_URL` is NOT set:
- QueueService.enabled = false
- EpisodesService uses in-process generation (original behavior)
- No background workers needed
- SSE events work normally via direct EventsService

## Job Priority System

Jobs are prioritized as follows:
1. **Character Generation** (priority: 1) - Processed first
2. **Page Generation** (priority: 10) - Processed after characters

This ensures character images are available before page generation begins.

## Error Handling

### Worker-Level Errors
- Jobs retry up to 3 times with exponential backoff
- Failed jobs update page/character status to 'failed'
- Error messages stored in database
- Failure events emitted via SSE

### API-Level Errors
- Queue unavailable → falls back to in-process
- Database unavailable → worker exits with error
- Renderer errors → retry with backoff

## Performance Characteristics

### With Queue (REDIS_URL set)
- **Parallelism**: Up to WORKER_CONCURRENCY_PAGES pages at once
- **Scalability**: Can run multiple worker processes
- **Reliability**: Jobs survive API restarts
- **Monitoring**: Full visibility via admin API

### Without Queue (fallback)
- **Sequential**: One page at a time
- **In-process**: Tied to API process lifecycle
- **Simple**: No additional infrastructure needed

## Limitations & Known Issues

1. **TypeScript Compilation Warnings**
   - Some pre-existing TS errors in other modules
   - Queue implementation compiles successfully
   - Worker requires ts-node-dev for development

2. **Character Generation in Queue Mode**
   - Requires DATABASE_URL to be set
   - In-memory mode not supported for character queueing
   - Falls back to in-process if DB not available

3. **Gemini API Seed Parameter**
   - Seed parameter removed from Gemini config (API limitation)
   - Seeds still tracked but not sent to Gemini API
   - OpenAI implementation unaffected

## Production Deployment Checklist

- [ ] Redis instance provisioned and accessible
- [ ] REDIS_URL environment variable set
- [ ] DATABASE_URL configured and accessible
- [ ] Worker process configured in process manager (PM2/systemd)
- [ ] Worker concurrency tuned for infrastructure
- [ ] Queue monitoring dashboard configured
- [ ] Alert on worker failures
- [ ] Log aggregation for worker logs
- [ ] Backup strategy for Redis (AOF/RDB)

## Monitoring Recommendations

1. **Queue Metrics**
   - Monitor waiting/active job counts
   - Alert on high failed job rates
   - Track average job duration

2. **Worker Health**
   - Process uptime monitoring
   - Memory/CPU usage
   - Restart on failure

3. **Redis Health**
   - Connection pool status
   - Memory usage
   - Persistence status

## Future Enhancements

Potential improvements:
1. Bull Board UI for queue visualization
2. Job scheduling (delayed/cron jobs)
3. Dynamic worker scaling based on queue depth
4. Rate limiting per episode/user
5. Job result caching
6. Multi-region worker support

## Summary

The BullMQ + Redis implementation is production-ready with:
- ✅ Full background job processing
- ✅ Parallel page generation
- ✅ Priority-based character generation
- ✅ SSE event streaming from workers
- ✅ Comprehensive error handling
- ✅ Queue monitoring and admin API
- ✅ Graceful fallback when Redis unavailable
- ✅ Configurable concurrency
- ✅ Job retry logic
- ✅ Clean separation of concerns

The system maintains full backward compatibility while enabling horizontal scalability and improved reliability.

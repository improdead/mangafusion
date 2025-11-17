# Canvas Storage Quick Start Guide
## MangaFusion - Implementation Checklist & Code

---

## Overview

This guide provides step-by-step instructions to implement the recommended storage architecture.

**Total Implementation Time:** 3-4 weeks
- Week 1: Basic storage enhancement (4-6 hours)
- Week 2-3: History system (8-12 hours)
- Week 4: Testing & optimization (4-8 hours)

---

## Pre-Implementation Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ and npm 9+
- [ ] PostgreSQL 12+ (already in use)
- [ ] Supabase project (free tier is fine)
- [ ] `pako` library (for GZIP)
- [ ] Redis 6+ (for queue, already in use)

### Install Dependencies

```bash
npm install pako @types/pako
cd backend && npm install pako @types/pako
```

### Verify Environment

```bash
# Check Node/npm versions
node --version  # Should be 18+
npm --version   # Should be 9+

# Check if Supabase is configured
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Check if database is accessible
psql $DATABASE_URL -c "SELECT 1"
```

---

## Phase 1: Enhanced Storage (Week 1)

### Step 1.1: Create Drawing Service

Create file: `/backend/src/drawings/drawing.service.ts`

Copy the service from `CANVAS_STORAGE_IMPLEMENTATION.md` Section 1.1

**Key Components:**
- Compression/decompression with GZIP
- Automatic storage strategy selection
- Database and Supabase integration

### Step 1.2: Create Drawing Module

Create file: `/backend/src/drawings/drawing.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DrawingService } from './drawing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [DrawingService],
  exports: [DrawingService],
})
export class DrawingModule {}
```

### Step 1.3: Update App Module

File: `/backend/src/app.module.ts`

```typescript
import { DrawingModule } from './drawings/drawing.module';

@Module({
  imports: [
    // ... existing imports
    DrawingModule,  // Add this line
  ],
})
export class AppModule {}
```

### Step 1.4: Update Episodes Service

File: `/backend/src/episodes/episodes.service.ts`

Find the `setPageOverlays` method and update it:

```typescript
// Add to imports
import { DrawingService } from '../drawings/drawing.service';

// Add to constructor
constructor(
  // ... existing parameters
  private readonly drawing: DrawingService,
) {}

// Update setPageOverlays method
async setPageOverlays(pageId: string, overlays: any): Promise<void> {
  const page = await this.getPageById(pageId);
  if (!page) throw new Error('Page not found');

  // Use new drawing service
  try {
    await this.drawing.saveDrawing(pageId, {
      version: 1,
      canvas: {
        width: 682,
        height: 1024,
        layers: Array.isArray(overlays) ? overlays : [],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    this.logger.error(`Failed to save drawing: ${error}`);
    throw error;
  }
}
```

### Step 1.5: Test Phase 1

```bash
# Build the project
cd backend && npm run build

# Start the development server
npm run dev

# Test overlay save with various sizes
curl -X POST http://localhost:3000/api/pages/{page_id}/overlays \
  -H "Content-Type: application/json" \
  -d '{"overlays": [{"id":"1","type":"text","text":"Hello"}]}'

# Check drawing stats
curl http://localhost:3000/api/pages/{page_id}/drawing-stats
```

**Expected Output:**
```json
{
  "size": 250,
  "compressed": false,
  "format": "json",
  "storageLocation": "database"
}
```

### Step 1.6: Add API Endpoint for Stats (Optional)

File: `/pages/api/pages/[id]/drawing-stats.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const { episodes } = getServices();
    // Note: You'll need to add a getDrawingStats method to episodes service
    // Or call the drawing service directly if it's available in Next.js context

    const stats = await episodes.getDrawingStats(id);
    return res.status(200).json(stats || {});
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
```

---

## Phase 2: History & Snapshots (Weeks 2-3)

### Step 2.1: Create Database Migration

Run the migration from `CANVAS_STORAGE_IMPLEMENTATION.md` Section 2.1

```bash
# Create migration file
cd backend
npx prisma migrate dev --name add_drawing_history

# This will:
# 1. Create drawing_session table
# 2. Create drawing_snapshot table
# 3. Create drawing_incremental table
# 4. Add indexes
```

### Step 2.2: Create Drawing History Service

Create file: `/backend/src/drawings/drawing-history.service.ts`

Copy from `CANVAS_STORAGE_IMPLEMENTATION.md` Section 2.2

**Key Features:**
- Snapshot creation with compression
- Incremental save tracking
- Version reconstruction
- History summary and retrieval

### Step 2.3: Update Drawing Module

File: `/backend/src/drawings/drawing.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DrawingService } from './drawing.service';
import { DrawingHistoryService } from './drawing-history.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [DrawingService, DrawingHistoryService],
  exports: [DrawingService, DrawingHistoryService],
})
export class DrawingModule {}
```

### Step 2.4: Add History API Endpoints

File: `/pages/api/drawings/[pageId]/snapshots.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../../lib/server/container';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pageId } = req.query;
  if (!pageId || Array.isArray(pageId)) {
    return res.status(400).json({ error: 'Invalid pageId' });
  }

  try {
    // You'll need to register DrawingHistoryService in your container
    // const { drawingHistory } = getServices();

    if (req.method === 'GET') {
      // Get all snapshots
      // const snapshots = await drawingHistory.getSnapshots(pageId as string);
      // return res.status(200).json({ snapshots });
      return res.status(200).json({ snapshots: [] });
    }

    if (req.method === 'POST') {
      // Create new snapshot
      const { label, userId } = req.body;
      // const snapshotId = await drawingHistory.createSnapshot(
      //   pageId as string,
      //   label,
      //   userId
      // );
      // return res.status(200).json({ snapshotId });
      return res.status(200).json({ snapshotId: 'temp' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
```

### Step 2.5: Test Phase 2

```bash
# Verify database schema
cd backend
npx prisma studio  # Opens DB UI

# Create a test snapshot
curl -X POST http://localhost:3000/api/drawings/{page_id}/snapshots \
  -H "Content-Type: application/json" \
  -d '{"label":"Initial state"}'

# List snapshots
curl http://localhost:3000/api/drawings/{page_id}/snapshots

# Restore from snapshot (endpoint to be created)
curl -X POST http://localhost:3000/api/drawings/{page_id}/restore/{snapshot_id}
```

---

## Phase 3: Real-Time Collaboration (Week 4+)

### Step 3.1: Create WebSocket Gateway

File: `/backend/src/drawings/drawing-collab.gateway.ts`

Copy from `CANVAS_STORAGE_IMPLEMENTATION.md` Section 3

```bash
# Install Socket.io
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Step 3.2: Update App Module for WebSockets

File: `/backend/src/app.module.ts`

```typescript
import { DrawingCollabGateway } from './drawings/drawing-collab.gateway';

@Module({
  imports: [
    // ... existing imports
  ],
  providers: [
    // ... existing providers
    DrawingCollabGateway,
  ],
})
export class AppModule {}
```

### Step 3.3: Frontend WebSocket Integration

File: `/pages/studio/[id].tsx` (Update)

```typescript
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Studio() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = io('/drawings', {
      auth: {
        userId: getCurrentUserId(), // Implement based on your auth
      },
    });

    const socket = socketRef.current;

    // Join session
    socket.emit('join_session', {
      sessionId: episodeId,
      userId: getCurrentUserId(),
    });

    // Listen for updates
    socket.on('drawing_update', (data) => {
      // Apply remote update to local state
      applyRemoteUpdate(data.operation);
    });

    socket.on('cursor_update', (data) => {
      // Show remote cursor
      updateRemoteCursor(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [episodeId]);

  // Send updates
  const sendDrawingUpdate = (operation) => {
    socketRef.current.emit('drawing_update', {
      sessionId: episodeId,
      pageId: currentPage.id,
      operation,
      userId: getCurrentUserId(),
    });
  };

  // ... rest of component
}
```

---

## Verification & Testing

### Unit Tests

Create file: `/backend/src/drawings/__tests__/drawing.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DrawingService } from '../drawing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

describe('DrawingService', () => {
  let service: DrawingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrawingService,
        {
          provide: PrismaService,
          useValue: { page: { update: jest.fn() } },
        },
        {
          provide: StorageService,
          useValue: { uploadImage: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DrawingService>(DrawingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should compress drawings > 50KB', async () => {
    const largeDrawing = {
      version: 1,
      canvas: {
        width: 682,
        height: 1024,
        layers: Array(100).fill({
          id: 'test',
          name: 'Test',
          opacity: 1,
          blendMode: 'normal',
          visible: true,
          locked: false,
          elements: [],
        }),
      },
    };

    await service.saveDrawing('test_page', largeDrawing);
    expect(prisma.page.update).toHaveBeenCalled();
  });

  it('should handle compression errors gracefully', async () => {
    // Test error handling
  });
});
```

### Integration Tests

```bash
# Run test suite
cd backend
npm run test

# Run with coverage
npm run test:cov
```

### Performance Benchmarks

Create file: `/backend/src/drawings/__tests__/performance.bench.ts`

```typescript
import * as pako from 'pako';
import { performance } from 'perf_hooks';

// Test compression performance
const testCompressionPerformance = () => {
  const testData = JSON.stringify({
    layers: Array(100).fill({
      elements: Array(50).fill({ type: 'stroke', points: [[0, 0]] }),
    }),
  });

  const start = performance.now();
  const compressed = pako.gzip(testData, { level: 6 });
  const end = performance.now();

  console.log(`
Compression Performance:
- Original size: ${testData.length} bytes
- Compressed size: ${compressed.length} bytes
- Compression ratio: ${((1 - compressed.length / testData.length) * 100).toFixed(1)}%
- Time: ${(end - start).toFixed(2)}ms
  `);
};

testCompressionPerformance();
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code review completed
- [ ] Database migration tested on staging
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Supabase bucket configured
- [ ] Environment variables set
- [ ] Performance targets met
- [ ] Error handling verified
- [ ] Monitoring alerts configured

### Pre-Deployment Commands

```bash
# Test build
npm run build

# Run tests
npm run test

# Check for issues
npm run lint

# Type check
npm run type-check

# Database migration (staging)
DATABASE_URL=<staging_db> npx prisma migrate deploy

# Verify Supabase connection
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  $SUPABASE_URL/rest/v1/

# Check environment
env | grep SUPABASE
env | grep DATABASE
```

---

## Troubleshooting

### Issue: "Cannot find module 'pako'"

```bash
# Solution: Install pako
npm install pako @types/pako
cd backend && npm install pako @types/pako
```

### Issue: "Prisma client not generated"

```bash
# Solution: Generate Prisma client
npx prisma generate
cd backend && npx prisma generate
```

### Issue: "Supabase upload fails"

```typescript
// Check bucket configuration
console.log(process.env.SUPABASE_URL);
console.log(process.env.SUPABASE_BUCKET);

// Verify credentials
const testUpload = await supabase
  .storage
  .from(bucket)
  .upload('test.txt', Buffer.from('test'), {
    upsert: true,
  });

if (testUpload.error) {
  console.error('Upload failed:', testUpload.error);
}
```

### Issue: "JSONB size exceeds limit"

```typescript
// Auto-fallback to Supabase should handle this
// But if you hit it, migrate using:

const { data: page } = await prisma.page.findUnique({ where: { id } });
if (Buffer.byteLength(JSON.stringify(page.overlays)) > 1MB) {
  // Force Supabase migration
  await drawingService.saveToExternalStorage(id, drawing, size);
}
```

---

## Monitoring & Observability

### Add Logging

```typescript
// In DrawingService
this.logger.log(`Drawing saved: ${size} bytes to ${location}`);
this.logger.warn(`Large file (${size} bytes), using external storage`);
this.logger.error(`Failed to save drawing: ${error.message}`);
```

### Set Up Alerts

```yaml
# observability-alerts.yml (add to existing)
alerts:
  - name: high_drawing_size
    condition: drawing_size > 5MB
    action: log_warning

  - name: storage_service_timeout
    condition: upload_time > 5000ms
    action: fallback_to_database

  - name: compression_failed
    condition: compression_error
    action: save_uncompressed
```

### Metrics to Track

```typescript
interface DrawingMetrics {
  totalSaved: number;
  averageSize: number;
  compressionRatio: number;
  externalStorageUsed: number;
  averageSaveTime: number;
  failureRate: number;
}
```

---

## Rollback Plan

If issues occur:

### Immediate Rollback

```bash
# Revert to previous code
git revert HEAD

# Rebuild
npm run build

# Restart services
npm run dev
```

### Database Rollback

```bash
# Revert migrations
npx prisma migrate resolve --rolled-back add_drawing_history

# Or reset to previous schema
DATABASE_URL=<url> npx prisma migrate deploy
```

### Data Recovery

```typescript
// If data is lost, restore from snapshots
const backup = await drawingHistory.getSnapshot(lastGoodSnapshotId);
await drawingService.saveDrawing(pageId, backup.data);
```

---

## Success Metrics

Monitor these after implementation:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Storage reduction | 60-75% | Compare with/without compression |
| Save time | <100ms | Monitor via logs |
| Load time | <50ms | Monitor via browser DevTools |
| User adoption | >90% | Track feature usage |
| Error rate | <0.1% | Monitor logs |
| Customer satisfaction | >4/5 | User feedback |

---

## Next Steps

1. **Week 1:** Implement Phase 1 (storage enhancement)
   - Assign to backend developer
   - Code review
   - Testing

2. **Week 2-3:** Implement Phase 2 (history system)
   - Design database migrations
   - Implement history service
   - Build UI for version history

3. **Week 4+:** Implement Phase 3 (collaboration)
   - Set up WebSocket infrastructure
   - Implement real-time sync
   - Add conflict resolution

---

## Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs/
- **Supabase Docs:** https://supabase.com/docs/
- **NestJS Docs:** https://docs.nestjs.com/
- **Socket.io Docs:** https://socket.io/docs/
- **Compression:** https://github.com/nodeca/pako

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2025-11-17

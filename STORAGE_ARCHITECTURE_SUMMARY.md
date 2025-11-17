# Storage Architecture Decision Summary
## MangaFusion Drawing Data System

---

## Executive Summary

For MangaFusion, we recommend a **hybrid storage architecture** combining:
1. **Format:** Custom JSON (optimized for manga overlays)
2. **Compression:** GZIP with automatic compression for files > 50KB
3. **Storage:** PostgreSQL JSONB (< 1MB) + Supabase Storage fallback
4. **Versioning:** Snapshot + incremental delta saves
5. **Serialization:** Hybrid approach (JSON metadata + binary layer data)

**Expected Results:**
- 60-75% storage reduction (Phase 1)
- 90-95% storage reduction with versioning (Phase 2)
- Sub-100ms incremental saves
- Full version reconstruction in <500ms

---

## File Format Comparison Matrix

| Aspect | PSD | KRA | ORA | JSON | Binary | Hybrid |
|--------|-----|-----|-----|------|--------|--------|
| **File Size** | 10-500MB | 2-50MB | 1-30MB | 1-3MB | 0.5-1MB | 0.2-0.8MB |
| **Compression Ratio** | - | ~40% | ~30% | 20-30% | 50-70% | 60-75% |
| **Human Readable** | No | Partial | Partial | Yes | No | Partial |
| **Parse Speed** | Very Slow | Medium | Medium | Fast | Very Fast | Very Fast |
| **Standard Support** | Adobe | Krita | Multi | Universal | Custom | Custom |
| **Metadata Queryable** | No | Limited | Yes | Yes | No | Yes |
| **Non-destructive Edits** | Yes | Yes | No | No | No | Yes |
| **Real-time Sync** | Poor | Poor | Fair | Good | Excellent | Excellent |
| **Mobile Friendly** | No | No | No | Yes | Yes | Yes |
| **Collaboration** | Poor | Poor | Fair | Good | Excellent | Excellent |

---

## Architecture Decision Tree

```
What is your primary use case?
│
├─► Professional Desktop Publishing (Photoshop-compatible)
│   └─► Use: PSD format
│       - Adobe compatibility
│       - Maximum features
│       - Largest file sizes
│
├─► Open-source/Cross-platform (GIMP, Krita, Inkscape)
│   └─► Use: ORA format
│       - Maximum compatibility
│       - Standardized XML metadata
│       - ZIP-based structure
│
├─► Krita-specific Workflow
│   └─► Use: KRA format
│       - Native Krita support
│       - Fast load times
│       - Layer preservation
│
└─► Web-based Manga Editor (MangaFusion)
    └─► Use: Custom JSON + Hybrid Storage
        - Optimized for overlays
        - Compression-friendly
        - Real-time sync capable
        - Mobile-friendly
        ✓ RECOMMENDED FOR MANGAFUSION
```

---

## MangaFusion: Storage Comparison

### Option A: Pure JSON Storage (Current + Enhancement)

```
Advantages:
✓ Human readable for debugging
✓ Easy to version control
✓ Universal browser support
✓ Simple to parse incrementally
✓ Good for small-medium drawings

Disadvantages:
✗ 2-3x larger than binary
✗ Slower parse for large files
✗ Storage cost higher
✗ Bandwidth usage higher
```

**File Size Example:**
- Overlay with 100 strokes: ~500KB JSON
- Same with compression: ~150KB
- Binary equivalent: ~80KB

---

### Option B: Pure Binary Storage

```
Advantages:
✓ Smallest file size (50-70% smaller)
✓ Fastest serialization
✓ Ideal for large drawings
✓ Good for mobile

Disadvantages:
✗ Not human readable
✗ Harder to debug
✗ More complex parsing
✗ Format versioning required
✗ Difficult to do incremental saves
```

---

### Option C: Hybrid Storage (RECOMMENDED)

```
Advantages:
✓ Best of both worlds
✓ Metadata queryable as JSON
✓ Layer data efficient as binary
✓ Good incremental save support
✓ 60-75% compression ratio
✓ Scales to large drawings
✓ Mobile friendly

Perfect for MangaFusion because:
✓ Overlay metadata is small (JSON friendly)
✓ Stroke data benefits from binary encoding
✓ Enables incremental saves
✓ Allows version history
✓ Supports real-time collaboration
```

**Recommended Structure:**
```json
{
  "metadata": {
    "version": 1,
    "format": "hybrid",
    "width": 682,
    "height": 1024,
    "layerCount": 3,
    "createdAt": "2025-11-17T10:00:00Z"
  },
  "layers": [
    {
      "metadata": {
        "id": "layer_1",
        "name": "Background",
        "opacity": 1.0
      },
      "binaryData": "<base64-encoded-gzipped-strokes>"
    }
  ]
}
```

---

## Storage Tier Comparison

### PostgreSQL JSONB (Recommended for < 1MB)

```typescript
Tier 1: Direct JSONB Storage
├─ Cost: Minimal (included in database)
├─ Speed: ~50ms save, ~10ms load
├─ Limit: ~1GB per row (row size limit)
├─ Queryability: Full JSON operators
├─ Backup: Automatic with database
├─ Best for: Overlays, small drawings
└─ Current MangaFusion: ✓ USE THIS

Size examples:
├─ Overlay with 10 strokes: 20KB ✓
├─ Overlay with 100 strokes: 200KB ✓
└─ Overlay with 1000 strokes: 2MB → Move to Supabase
```

### Supabase Storage (Recommended for > 1MB)

```typescript
Tier 2: External Storage + DB Reference
├─ Cost: $5/month (up to 100GB)
├─ Speed: 100-300ms save/load (network dependent)
├─ Limit: 100GB default (expandable)
├─ Queryability: Via metadata in database
├─ Backup: Automatic with Supabase
├─ Features: CDN delivery, compression
├─ Best for: Large drawings, archives
└─ MangaFusion: Use as fallback when >1MB

Size examples:
├─ Complex page drawing: 2MB → Use Supabase
├─ High-resolution canvas: 5MB → Use Supabase
└─ Entire episode archive: 50MB → Use Supabase
```

### Hybrid Strategy (Smart Auto-Migration)

```
Current flow for Phase 1:
┌─────────────────────────┐
│  Save Drawing Data      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Measure JSON Size           │
└────────────┬────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
< 1MB              > 1MB
    │                 │
    ▼                 ▼
PostgreSQL       Supabase Storage
JSONB            + DB Reference
 + Compress      + Compress
    │                 │
    └────────┬────────┘
             │
             ▼
      ┌──────────────┐
      │ Save Success │
      └──────────────┘
```

---

## Compression Strategy Analysis

### Method 1: GZIP (Recommended - Industry Standard)

```typescript
Compression Level: 6 (good balance)
Typical Ratio: 20-30% (JSON stays 70-80%)
Speed: ~5-10ms for 200KB file
Browser Support: Native (pako library)
Decompression: <5ms

Example:
200KB JSON → 60KB GZIP (70% savings)
1MB JSON → 250KB GZIP (75% savings)
```

### Method 2: RLE (Run-Length Encoding)

```typescript
Use Case: Repetitive strokes with similar properties
Typical Ratio: 40-60%
Speed: Fast
Limitation: Only works for similar consecutive elements

Example:
100 black strokes of size 2 → 1 entry with repeat: 100
Savings: 99 entries per 100 strokes
```

### Method 3: Delta Compression

```typescript
Use Case: Incremental saves between snapshots
Typical Ratio: 90-95%
Speed: Very fast (small deltas)
Benefit: Enables fine-grained versioning

Example:
Full drawing: 500KB
Change: Add 1 stroke → 2KB delta (99.6% savings)
Change: Update layer opacity → 1KB delta (99.8% savings)
```

### Recommended Compression Pipeline

```typescript
Step 1: Delta encoding (only changes)
Step 2: Point reduction for strokes (Ramer-Douglas-Peucker)
Step 3: GZIP compression
Step 4: Optional base64 for database storage

Result: 90-95% reduction compared to full snapshots
```

---

## Version History Strategy

### Strategy Comparison

| Strategy | Storage | Speed | Undo Depth | Complexity |
|----------|---------|-------|------------|-----------|
| **Full Snapshots Only** | 100% baseline | Fast random access | Limited by storage | Simple |
| **Incremental Only** | 5-10% baseline | Slow for old versions | Unlimited | Medium |
| **Snapshot + Incremental** | 20-30% baseline | Fast latest, OK old | Unlimited | High |
| **DAG (Branching)** | 30-40% baseline | Medium | Unlimited + branches | Complex |

### Recommended for MangaFusion: Snapshot + Incremental

```
Pattern:
├─ Full Snapshot every 5 minutes (anchor point)
├─ Incremental saves every 1-2 seconds
├─ Max 100 incrementals per snapshot (then new snapshot)
└─ Reconstruction: Latest snapshot + deltas to target version

Storage Efficiency:
1 hour session (typical):
├─ Only snapshots: 12 snapshots × 500KB = 6MB
├─ Only incrementals: 2000 saves × 2KB = 4MB
└─ Hybrid (recommended): 12 snapshots + 200 incrementals = 1.2MB
    ✓ 80% savings vs snapshots only

Reconstruction Time:
├─ Latest: 0ms (already in memory)
├─ 1 minute ago: <50ms (apply 60 increments)
├─ 10 minutes ago: <100ms (apply closest snapshot + deltas)
└─ 30 minutes ago: <150ms (load snapshot from DB + apply deltas)
```

---

## Database Schema Decision

### Current Schema (PostgreSQL + Prisma)

```prisma
model Page {
  id         String     @id @default(uuid())
  episodeId  String
  pageNumber Int
  status     PageStatus
  imageUrl   String?
  audioUrl   String?
  seed       Int?
  version    Int?       @default(0)
  error      String?
  overlays   Json?      // ← Current overlay storage

  episode    Episode    @relation(fields: [episodeId], references: [id])

  @@unique([episodeId, pageNumber])
  @@index([episodeId])
  @@index([status])
}
```

### Recommended Schema Extension (Phase 2)

```prisma
model Page {
  // Existing fields...
  overlays         Json?                    // Keep for backward compat

  // New fields
  drawingSessionId String?   @unique       // Link to drawing session
  drawingFormat    String    @default("json")
  drawingCompressed Boolean  @default(false)

  drawingSession   DrawingSession? @relation(fields: [drawingSessionId], references: [id])

  @@index([drawingSessionId])
}

model DrawingSession {
  id                  String   @id @default(uuid())
  pageId              String   @unique
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  currentSnapshotId   String?
  incrementalCount    Int      @default(0)
  totalVersions       Int      @default(0)

  page                Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  snapshots           DrawingSnapshot[]
  incrementals        DrawingIncremental[]

  @@index([pageId])
  @@index([createdAt])
}

model DrawingSnapshot {
  id                    String   @id @default(uuid())
  sessionId             String
  snapshotNumber        Int
  createdAt             DateTime @default(now())

  data                  Bytes                 // Compressed binary
  compressedSizeBytes   Int?
  uncompressedSizeBytes Int?
  format                String   @default("json")

  label                 String?               // "Initial", "After bg", etc.
  createdBy             String?

  session               DrawingSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, snapshotNumber])
  @@index([sessionId])
  @@index([createdAt])
}

model DrawingIncremental {
  id              String   @id @default(uuid())
  sessionId       String
  sequenceNumber  Int
  createdAt       DateTime @default(now())

  operations      Json                      // Array of operations
  operationsCount Int?
  sizeBytes       Int

  session         DrawingSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, sequenceNumber])
  @@index([sessionId])
  @@index([createdAt])
}
```

---

## Implementation Timeline

### Week 1: Phase 1 - Enhanced Storage
- [ ] Implement `DrawingService` with compression
- [ ] Add Supabase fallback for large files
- [ ] Update Episodes service
- [ ] Test with various file sizes
- [ ] **Expected savings: 60-75%**

### Week 2-3: Phase 2 - History & Snapshots
- [ ] Create database schema for history
- [ ] Implement `DrawingHistoryService`
- [ ] Add snapshot/incremental logic
- [ ] Build version history UI
- [ ] Implement undo/redo
- [ ] **Expected savings: 90-95%**

### Week 4+: Phase 3 - Collaboration
- [ ] WebSocket gateway for real-time sync
- [ ] Conflict resolution
- [ ] Cursor tracking
- [ ] Collaborative annotations
- [ ] Export to PSD/ORA/KRA

---

## Supabase Integration Details

### Configuration

```typescript
// .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_BUCKET=drawings
```

### Bucket Setup

```sql
-- Bucket name: "drawings"
-- Public: Yes (for CDN delivery)
-- Allowed MIME types:
--   - application/gzip
--   - application/json
--   - image/png
--   - image/jpeg

-- Folder structure:
drawings/
├── {pageId}/
│   ├── {timestamp}-{random}.json.gz
│   ├── snapshots/
│   │   ├── snapshot_1.json.gz
│   │   └── snapshot_2.json.gz
│   └── incrementals/
│       ├── inc_001.json
│       └── inc_002.json
```

### Cost Analysis

```
Typical Usage (100 active users):
├─ Daily new drawings: 200
├─ Avg drawing size: 200KB → 60KB (compressed)
├─ Monthly storage growth: 200 × 30 × 60KB = 360MB
├─ Yearly growth: 4.3GB

Cost breakdown:
├─ Storage: 5GB/year × $0.12/GB = $0.60
├─ Database: $25/month = $300/year
├─ Bandwidth: ~100MB/month × $0.12 = $1.20/month
└─ Total: ~$315/year

vs. AWS S3:
├─ Storage: $0.023 per GB → $115/year
├─ Bandwidth: $0.09 per GB → $100/year
└─ Total: ~$215/year

Savings with compression: 60-75% less storage
```

---

## Performance Targets

### Phase 1 (Enhanced Storage)
| Operation | Target | Typical | Notes |
|-----------|--------|---------|-------|
| Save small overlay | <100ms | 60ms | Compressed GZIP |
| Load small overlay | <50ms | 10ms | Cached |
| Save large drawing | <500ms | 200ms | Supabase upload |
| Load large drawing | <500ms | 150ms | Supabase download |
| Storage reduction | 60-75% | 70% | With GZIP |

### Phase 2 (With History)
| Operation | Target | Typical | Notes |
|-----------|--------|---------|-------|
| Incremental save | <20ms | <10ms | Delta only |
| Create snapshot | <200ms | 100ms | Full compression |
| Load latest version | <100ms | 50ms | From cache |
| Reconstruct old version | <500ms | 200ms | Load + apply deltas |
| Undo operation | <30ms | <15ms | In-memory |
| Storage reduction | 90-95% | 93% | Incremental + snapshots |

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| GZIP decompression failure | Data loss | Low | Try-catch, fallback to raw JSON |
| Large file upload timeout | Lost work | Medium | Implement chunked uploads, timeout retry |
| Database row size limit | Can't save | Low | Automatic Supabase migration |
| Supabase downtime | Fallback needed | Low | Keep database as primary storage |
| Incremental chain corruption | History lost | Very Low | Verify checksums, snapshots as anchor |
| Version explosion | Storage bloat | Medium | Prune old incrementals after 30 days |

**Mitigation Strategy:** Implement fallbacks at each layer
1. Try external storage (Supabase)
2. Fall back to database JSONB
3. Store in-memory with explicit save warning

---

## Recommended Decision

```
For MangaFusion Drawing System:

PRIMARY STORAGE:      PostgreSQL JSONB (Phase 1)
SECONDARY STORAGE:    Supabase Storage (>1MB)
SERIALIZATION:        Custom JSON (overlay optimized)
COMPRESSION:          GZIP (Level 6)
VERSIONING:           Snapshot + Incremental (Phase 2)
COLLABORATION:        WebSocket + Operational Transform (Phase 3)

Implementation Order:
1. Week 1: Enhance storage with compression + Supabase fallback
2. Week 2-3: Add snapshot + incremental history
3. Week 4+: Real-time collaboration

Expected Improvements:
- Phase 1: 60-75% storage reduction
- Phase 2: 90-95% storage reduction
- Phase 3: Real-time multi-user editing

Risk Level: LOW (backward compatible, fallbacks at each layer)
Development Effort: MEDIUM (3-4 weeks for full implementation)
Maintenance: LOW (mostly automatic with Prisma/Supabase)
```

---

## References & Resources

- **GZIP Compression:** https://en.wikipedia.org/wiki/Gzip
- **Ramer-Douglas-Peucker Algorithm:** https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
- **Canvas Optimization:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **Prisma Schema:** https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Socket.io for Collaboration:** https://socket.io/docs/

---

**Document Status:** Complete & Ready for Implementation
**Last Updated:** 2025-11-17
**Author:** Architecture Research Team

# Canvas Feature Integration - Quick Start Guide

## Executive Summary

MangaFusion's architecture supports a new **Canvas Drawing/Refinement** feature that allows users to hand-draw or sketch on top of AI-generated manga pages. This document provides a quick-start reference.

---

## Current Architecture at a Glance

```
Frontend (Next.js:3000)
    ↓
Next.js API Routes → NestJS Backend (Port 4000)
    ↓
Services: Planner → Renderer → Storage (Supabase) → Queue (Redis/BullMQ)
    ↓
Database: PostgreSQL (Prisma)
```

**Key Components:**
- **Episodes API**: Create episodes, manage pages
- **Pages API**: Get/save overlays, regenerate, manage dialogue
- **Queue Service**: Background job processing (BullMQ + Redis)
- **Storage Service**: Supabase image uploads
- **Renderer Service**: AI image generation (Gemini/OpenAI)

---

## Canvas Feature: Integration Points

### 1. Database Changes (Priority: P0)

**New Table: Canvas**
```sql
-- Stores drawing strokes and metadata
CREATE TABLE "Canvas" (
  id TEXT PRIMARY KEY,
  pageId TEXT UNIQUE NOT NULL,
  strokesData BYTEA NOT NULL,          -- Compressed strokes
  canvasImageUrl TEXT,                 -- Pure drawing
  overlayImageUrl TEXT,                -- Composite (original + drawing)
  version INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (pageId) REFERENCES "Page"(id) ON DELETE CASCADE
);
```

**Extend Page Table**
```sql
ALTER TABLE "Page" ADD COLUMN canvasId TEXT REFERENCES "Canvas"(id);
ALTER TABLE "Page" ADD COLUMN canvasVersion INT DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN canvasEnabled BOOLEAN DEFAULT false;
```

---

### 2. Backend API Endpoints (Priority: P0)

```
POST   /pages/:id/canvas
       └─ Save drawing strokes
       
GET    /pages/:id/canvas
       └─ Get current canvas data
       
POST   /pages/:id/canvas/clear
       └─ Clear all strokes
       
POST   /pages/:id/canvas/finalize
       └─ Merge canvas with original image
       
GET    /pages/:id/canvas/versions
       └─ Get version history
```

---

### 3. New Service: CanvasService (Priority: P0)

**Key Methods:**
```typescript
class CanvasService {
  // Save drawing strokes
  async saveCanvas(pageId, drawingData): Promise<{canvasUrl, version}>
  
  // Get canvas data
  async getCanvas(pageId): Promise<CanvasData>
  
  // Render strokes to image (using Sharp or canvas)
  private async renderCanvasImage(data): Promise<Buffer>
  
  // Composite canvas with original image
  private async compositeImages(originalUrl, canvasImage): Promise<Buffer>
  
  // Version management
  async getCanvasVersions(pageId): Promise<CanvasHistory[]>
  async restoreCanvasVersion(canvasId, version): Promise<void>
  
  // Finalize and update page imageUrl
  async finalizeCanvas(pageId, options): Promise<{imageUrl}>
}
```

---

### 4. Frontend Component: CanvasEditor (Priority: P1)

**Location:** `components/CanvasEditor.tsx`

**Features:**
- Display base image (background layer)
- Transparent canvas overlay for drawing
- Drawing tools: pen, pencil, brush, eraser
- Color picker, brush size/opacity controls
- Undo/Redo functionality
- Layer toggle (show/hide original)
- Auto-save every 5 seconds
- Real-time stroke preview

**Integration:** New tab in `/pages/studio/[id].tsx`

---

### 5. Storage Integration (Priority: P1)

**Supabase Upload Path:**
```
manga-images/
├── episodes/{episode_title}/
│   ├── canvas/{pageId}_v{n}.png          (Pure drawing)
│   ├── overlay/{pageId}_v{n}.png         (Composite)
│   └── thumbnail/{pageId}.png            (Preview)
```

---

## Workflow Diagram

```
Current Flow:
Planner → Renderer → Storage → Reader View → Studio Overlays → Export

New Flow with Canvas:
Planner → Renderer → Storage → Reader View
                        ↓
                  Studio Overlays
                        ↓
                  Canvas Editor (NEW)
                        ↓
                  Composite Image
                        ↓
                  Export (includes canvas)
```

---

## Implementation Phases

### Phase 1: Backend Foundation (2-3 days)
- [ ] Create Canvas table + Page modifications (1 day)
- [ ] Implement CanvasService (2 days)
- [ ] Add API endpoints to PagesController (1 day)

**Deliverable:** API endpoints for saving/retrieving canvas data

### Phase 2: Frontend Canvas Editor (3-4 days)
- [ ] Implement CanvasEditor component (3 days)
- [ ] Integrate into /pages/studio tab (1 day)
- [ ] Add undo/redo functionality (1 day)

**Deliverable:** Working canvas drawing interface

### Phase 3: Advanced Features (2-3 days)
- [ ] Canvas versioning/history (1 day)
- [ ] Include canvas in PDF/CBZ export (1 day)
- [ ] Performance optimization (1 day)

**Deliverable:** Production-ready feature

---

## Tech Stack Recommendations

| Layer | Tool | Reason |
|-------|------|--------|
| Frontend Drawing | Fabric.js | Rich features, broad browser support |
| Image Rendering | Sharp (Node.js) | Fast, handles compositing |
| Stroke Compression | MessagePack | ~30% smaller than JSON |
| Undo/Redo | Custom Stack | Lightweight, easy to integrate |

---

## Key Design Decisions

### 1. Canvas as Separate Entity
- Canvas has its own table/versioning
- Page references Canvas, not vice versa
- Allows future Canvas reuse/sharing

### 2. Stroke Serialization
- Store compressed stroke data (not rendered images)
- Re-render on demand (scalable, editable)
- Support undo/redo through stroke history

### 3. Image Compositing
- Pure canvas drawing stored separately
- Composite (original + canvas) generated on finalize
- Allows user to toggle visibility before finalizing

### 4. Integration with Existing Flow
- Canvas is **optional** per-page
- Doesn't interfere with overlays or regeneration
- Can be applied after AI regeneration

---

## Example API Usage

### Save Canvas
```bash
POST /pages/page123/canvas
Content-Type: application/json

{
  "drawingData": {
    "strokes": [
      {
        "id": "stroke1",
        "points": [{x: 100, y: 200}, {x: 110, y: 210}],
        "color": "#000000",
        "width": 3,
        "opacity": 1.0,
        "tool": "pen"
      }
    ],
    "canvasWidth": 1024,
    "canvasHeight": 1536
  },
  "generateThumbnail": true
}

Response: {
  "canvasUrl": "https://supabase.../canvas/page123_v1.png",
  "overlayedImageUrl": "https://supabase.../overlay/page123_v1.png",
  "version": 1
}
```

### Finalize Canvas
```bash
POST /pages/page123/canvas/finalize
Content-Type: application/json

{
  "includeCanvas": true,
  "mergeMode": "overlay"
}

Response: {
  "imageUrl": "https://supabase.../episodes/manga/page_01_final.png",
  "version": 2,
  "canvasPreserved": true
}
```

---

## Database Schema Summary

### Canvas Table
```
id (TEXT) PRIMARY KEY
pageId (TEXT) UNIQUE → Page.id
episodeId (TEXT) → Episode.id
strokesData (BYTEA) - compressed strokes
strokeCount (INT)
canvasWidth (INT) default 1024
canvasHeight (INT) default 1536
canvasImageUrl (TEXT) - URL of pure drawing
overlayImageUrl (TEXT) - URL of composite
thumbnail (TEXT) - preview URL
version (INT) default 1
isLatest (BOOLEAN) default true
createdAt (TIMESTAMP)
modifiedAt (TIMESTAMP)
```

### Page Table Changes
```
Add: canvasId (TEXT) FK → Canvas.id
Add: canvasVersion (INT) default 0
Add: lastCanvasEdit (TIMESTAMP)
Add: canvasEnabled (BOOLEAN) default false
Add: Index on (canvasId, canvasEnabled)
```

---

## Testing Strategy

### Unit Tests
- Stroke compression/decompression
- Canvas rendering (small test images)
- Composite calculation

### Integration Tests
- Save & retrieve canvas data
- Canvas finalization
- Integration with page updates

### E2E Tests
- Drawing workflow in CanvasEditor
- Auto-save functionality
- Undo/redo operations
- Finalization and page update

---

## Performance Considerations

| Aspect | Strategy |
|--------|----------|
| Large stroke data | Compress with MessagePack (~70% smaller) |
| Image rendering | Use Sharp with streaming for large images |
| Frontend responsiveness | Render strokes client-side, batch updates |
| Storage | Implement canvas cleanup (auto-delete old versions) |
| Database queries | Index on (pageId, version) for fast lookups |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Mobile canvas performance | WebGL rendering, limit stroke count per-draw |
| Storage bloat | Version cleanup, configurable retention |
| Canvas-overlay conflicts | Clear separation, different rendering paths |
| Browser compatibility | Use Fabric.js (supports IE11+) |

---

## Rollout Plan

### MVP (Week 1)
- Canvas table creation
- Basic save/load functionality
- Simple frontend component

### Extended (Week 2)
- Undo/redo
- Versioning
- Canvas finalization

### Production (Week 3)
- Performance optimization
- Comprehensive testing
- Documentation

---

## Questions & Decisions

**Q: Should canvas be optional per-page?**
A: Yes. Add `canvasEnabled` flag, allow users to opt-in.

**Q: How to handle canvas + overlays together?**
A: Render overlays on top of composite (canvas + original).

**Q: Version control for canvas?**
A: Yes. Keep versions, allow restore, implement cleanup.

**Q: Mobile support?**
A: Phase 3. Use touch events, implement simplified drawing.

---

## Next Steps

1. **Review** this architecture with team
2. **Approve** database schema changes
3. **Create** Canvas table migration
4. **Implement** CanvasService (backend)
5. **Build** CanvasEditor component (frontend)
6. **Test** end-to-end workflow
7. **Deploy** to staging environment

---

## Reference Documents

- **Detailed Analysis:** `CANVAS_FEATURE_INTEGRATION.md`
- **Architecture Diagram:** See section 1 in detailed analysis
- **API Endpoints:** See section 8 in detailed analysis
- **Database Schema:** See section 9 in detailed analysis

---

**Last Updated:** November 17, 2025
**Status:** Ready for Implementation Planning

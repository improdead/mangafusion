# MangaFusion Canvas/Drawing Feature Integration Analysis

**Date:** November 17, 2025
**Analysis Scope:** Current architecture mapping and canvas feature integration points

---

## 1. CURRENT ARCHITECTURE DIAGRAM

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER (Next.js:3000)              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  /pages/index    │  │ /pages/episodes  │  │ /pages/studio    │ │
│  │   (Home)         │  │  (Reader View)   │  │  (Overlay Tool)  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                     │            │
│           └─────────┬───────────┴─────────────────────┘            │
│                     │                                              │
│             ┌───────▼────────────┐                                 │
│             │  Next.js API Routes│                                 │
│             │  /api/planner      │                                 │
│             │  /api/episodes/*   │                                 │
│             │  /api/pages/*      │                                 │
│             └───────┬────────────┘                                 │
│                     │                                              │
│           ┌─────────▼──────────────────┐                          │
│           │  lib/server/container.ts   │                          │
│           │  (Manual DI)               │                          │
│           └─────────┬──────────────────┘                          │
│                     │                                              │
└─────────────────────┼──────────────────────────────────────────────┘
                      │
        ┌─────────────▼──────────────────┐
        │  HTTP (Proxy or Direct)        │
        │  to NestJS Backend:4000        │
        └─────────────┬──────────────────┘
                      │
        ┌─────────────▼───────────────────────────────────────┐
        │      BACKEND LAYER (NestJS:4000)                   │
        ├──────────────────────────────────────────────────────┤
        │                                                      │
        │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
        │  │ Episodes API │  │  Pages API   │  │  Queue API │ │
        │  │  Controller  │  │ Controller   │  │ Controller │ │
        │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
        │         │                 │                │        │
        │  ┌──────▼──────────────────▼────────────────▼──────┐ │
        │  │           SERVICE LAYER                        │ │
        │  ├─────────────────────────────────────────────────┤ │
        │  │  • EpisodesService                              │ │
        │  │  • PlannerService (Hardened, Zod, Retry)       │ │
        │  │  • RendererService (Gemini/OpenAI)             │ │
        │  │  • StorageService (Supabase)                   │ │
        │  │  • ExportService (PDF/CBZ)                     │ │
        │  │  • TTSService (Text-to-Speech)                 │ │
        │  │  • QueueService (BullMQ)                       │ │
        │  │  • EventsService (SSE Stream)                  │ │
        │  └──────┬──────────────────────────────────────────┘ │
        │         │                                             │
        │  ┌──────▼──────────────────────────────────────────┐ │
        │  │        OBSERVABILITY LAYER                      │ │
        │  ├──────────────────────────────────────────────────┤ │
        │  │  • LoggerService (Pino)                         │ │
        │  │  • TracingService (OpenTelemetry)               │ │
        │  │  • CorrelationInterceptor                       │ │
        │  └──────────────────────────────────────────────────┘ │
        └──────────────────────────────────────────────────────┘
                      │
     ┌────────────────┼────────────────┬──────────────────┐
     │                │                │                  │
     ▼                ▼                ▼                  ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌─────────────┐
│ PostgreSQL│   │  Redis   │   │  Supabase    │   │  Worker     │
│ (Prisma)  │   │ (BullMQ) │   │  Storage     │   │  Process    │
│           │   │          │   │  + S3        │   │  (Node)     │
│ Episodes  │   │  Queues: │   │              │   │             │
│ Pages     │   │  - pages │   │  Bucket:     │   │ Processes:  │
│ Characters│   │  - chars │   │  manga-      │   │ - Page Gen  │
│           │   │          │   │  images      │   │ - Char Gen  │
└──────────┘   └──────────┘   └──────────────┘   └─────────────┘
```

---

## 2. CURRENT EPISODE/PAGE WORKFLOW

```
USER SUBMISSION
    │
    ▼
┌─────────────────────────────────────┐
│ 1. PLANNING PHASE                   │
├─────────────────────────────────────┤
│ POST /planner                       │
│  └─> PlannerService.generateOutline │
│      ├─> Validate input (Zod)       │
│      ├─> Call AI (Gemini/OpenAI)    │
│      ├─> Extract & validate JSON    │
│      ├─> Fallback to stub outline   │
│      └─> Return: {outline, chars}   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. PERSISTENCE PHASE                │
├─────────────────────────────────────┤
│ EpisodesService.planEpisode()        │
│  └─> Prisma Transaction             │
│      ├─> Create Episode record       │
│      │   └─ seedInput, outline       │
│      ├─> Create 10 Page records      │
│      │   └─ status: 'queued'         │
│      └─> Create Character records    │
│          └─ assetFilename, name      │
└──────────────┬──────────────────────┘
               │
               ▼ (Return: episodeId)
┌─────────────────────────────────────┐
│ 3. CHARACTER GENERATION (Background)│
├─────────────────────────────────────┤
│ QueueService.enqueueCharacter()      │
│  └─> BullMQ → Redis Queue           │
│      └─> Worker Process             │
│          ├─> RendererService        │
│          │   └─> Call AI image gen  │
│          ├─> StorageService         │
│          │   └─> Upload to Supabase │
│          └─> Update Character.imageUrl
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. PAGE GENERATION                  │
├─────────────────────────────────────┤
│ POST /episodes/:id/generate10        │
│  └─> StartGeneration()              │
│      ├─> BullMQ Queueing (if Redis) │
│      │   └─> Per-page job           │
│      └─> In-process (if no Redis)   │
│          └─> Sequential generation  │
└──────────────┬──────────────────────┘
               │
               ▼
   ┌───────────────────────────────────┐
   │ Each Page Generation Job:         │
   ├───────────────────────────────────┤
   │ 1. Update status: 'in_progress'   │
   │ 2. Emit: page_progress event      │
   │ 3. Call RendererService           │
   │    ├─> Build enhanced prompt      │
   │    ├─> Include character assets   │
   │    ├─> Include style refs         │
   │    └─> Call Gemini/OpenAI         │
   │ 4. StorageService.uploadImage()   │
   │    └─> Supabase → Return URL      │
   │ 5. Update Page record             │
   │    ├─ imageUrl                    │
   │    ├─ seed (random)               │
   │    └─ status: 'done'              │
   │ 6. Emit: page_done event          │
   └───────────────────────────────────┘
               │
               ▼ (SSE Stream)
┌─────────────────────────────────────┐
│ 5. FRONTEND DISPLAY                 │
├─────────────────────────────────────┤
│ GET /episodes/:id/stream (SSE)      │
│  └─> Real-time progress updates     │
│      ├─> page_progress event        │
│      ├─> page_done event            │
│      ├─> page_failed event          │
│      └─> generation_complete event  │
│                                      │
│ Frontend renders:                   │
│  ├─> EpisodeReader view (/episodes) │
│  └─> Studio editor (/studio)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. REFINEMENT PHASE (Studio)        │
├─────────────────────────────────────┤
│ POST /pages/:id/overlays            │ ◄─ TEXT BUBBLES, IMAGES
│ POST /pages/:id/regenerate          │ ◄─ AI-POWERED EDIT
│ POST /pages/:id/dialogue            │ ◄─ CUSTOM DIALOGUE
│ POST /episodes/:id/export           │ ◄─ EXPORT (PDF/CBZ)
└─────────────────────────────────────┘
```

---

## 3. FRONTEND PAGE STRUCTURE

### Page: `/pages/episodes/[id].tsx` (Episode Reader)
**Purpose:** Display generated pages in reading view with progress tracking

**Features:**
- Real-time SSE stream for generation progress
- Display pages as they complete
- Full-page view with navigation
- Reader mode (sequential reading)
- TTS audio generation per page
- Export functionality
- Page retry/regenerate buttons

**Data Flow:**
```
SSE Stream (page_progress, page_done, page_failed)
    │
    ├─> Update page progress indicator
    ├─> Display completed images
    ├─> Show error states
    └─> Enable reader mode when all done
```

### Page: `/pages/studio/[id].tsx` (Overlay Editor/Studio)
**Purpose:** Edit pages with overlays (text bubbles, images, annotations)

**Features:**
- Canvas-like overlay system
- Add text bubbles, image overlays
- Drag/resize overlays
- Edit dialogue text
- Apply AI-powered regeneration with edit prompts
- Style references upload
- Save overlay state per page

**Current Overlay Types:**
```typescript
type Overlay = {
  id: string;
  type: 'text' | 'bubble' | 'image';
  x: number; y: number; w: number; h: number;
  text?: string;
  fontSize?: number;
  color?: string;
  stroke?: string;
  imageUrl?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  radius?: number;
};
```

**Overlay Persistence:**
```
GET /pages/:id/overlays
    │
    ├─> Load saved overlays from Page.overlays (JSON)
    │
POST /pages/:id/overlays
    │
    ├─> Save overlays array to Page.overlays
    │
    └─> Supabase PostgreSQL (Prisma)
```

---

## 4. BACKEND API ENDPOINTS

### Episodes API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/planner` | POST | Create episode outline (Planner → AI) |
| `/episodes/:id` | GET | Fetch episode with pages, characters, outline |
| `/episodes/:id/characters` | GET | Get character list |
| `/episodes/:id/generate10` | POST | Start 10-page generation (Queue) |
| `/episodes/:id/stream` | GET (SSE) | Real-time progress stream |
| `/episodes/:id/style-refs` | GET | List uploaded style references |
| `/episodes/:id/style-refs` | POST | Upload new style reference |
| `/episodes/:id/export` | POST | Export as PDF or CBZ |

### Pages API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/pages/:id` | GET | Get single page with overlays |
| `/pages/:id/overlays` | GET | Get page overlays |
| `/pages/:id/overlays` | POST | Save page overlays |
| `/pages/:id/dialogue` | GET | Get page dialogue/narration |
| `/pages/:id/read` | POST | Generate TTS audio |
| `/pages/:id/regenerate` | POST | Regenerate page with edit prompt |
| `/pages/:id/retry` | POST | Retry failed page generation |

### TTS API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tts/voices` | GET | Get available TTS voices |
| `/tts/models` | GET | Get available TTS models |
| `/tts/usage` | GET | Get TTS usage stats |

### Admin/Queue API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/queue/stats` | GET | Queue statistics |
| `/admin/queue/pause` | POST | Pause queue processing |
| `/admin/queue/resume` | POST | Resume queue processing |
| `/admin/queue/:queue/:jobId` | GET | Get job details |
| `/admin/queue/:queue/:jobId` | DELETE | Cancel job |

---

## 5. STORAGE SERVICE (SUPABASE)

### Supabase Bucket: `manga-images`
**Purpose:** Store generated page images, character assets, style references

**Folder Structure:**
```
manga-images/
├── episodes/
│   └── {episode_title}/
│       ├── page_01_123456.png         (Page image with seed)
│       ├── page_02_789012.png
│       ├── aoi.png                     (Character asset)
│       ├── kenji.png
│       └── style_refs/
│           ├── 1234567890_abc.png
│           └── 1234567891_def.png
└── characters/
    └── {character_id}.png
```

**Operations:**
- `uploadImage(buffer, filename)` → Returns public URL
- `uploadAudio(buffer, filename)` → Returns public URL
- `deleteImage(filename)` → Remove file
- `listPublicUrls(prefix)` → List files in folder

---

## 6. REGENERATION MECHANISM

### Current Regeneration Flow

```
POST /pages/:id/regenerate
│
├─ Input:
│  ├─ prompt: string (edit request)
│  ├─ styleRefUrls: string[] (optional)
│  └─ dialogueTextOverride: string (optional)
│
├─ EpisodesService.regeneratePage()
│  │
│  ├─ 1. Load page & episode
│  ├─ 2. Mark status: 'in_progress'
│  ├─ 3. Persist dialogue override (if provided)
│  │
│  ├─ 4. Call RendererService.generatePage()
│  │    ├─ Build enhanced prompt with:
│  │    │  ├─ Original page outline
│  │    │  ├─ Edit prompt (editPrompt)
│  │    │  ├─ Base image (baseImageUrl)
│  │    │  ├─ Character assets
│  │    │  ├─ Style references
│  │    │  └─ Visual style
│  │    │
│  │    └─ Call AI image model
│  │
│  ├─ 5. StorageService.uploadImage()
│  │    └─ Save to Supabase
│  │
│  ├─ 6. Update Page record:
│  │    ├─ imageUrl: new URL
│  │    ├─ seed: preserved or new
│  │    ├─ version: increment
│  │    └─ status: 'done'
│  │
│  └─ 7. Emit: page_done event
│
└─ Return: { imageUrl, seed, version }
```

### Persistence Points:
1. **Page.overlays** (JSON) → Stores text bubbles, images
2. **Page.version** → Tracks regeneration count
3. **Page.imageUrl** → Updated on each regeneration
4. **Page.seed** → Can be preserved for consistency
5. **Dialogue override** → Stored in Page.overlays.dialogueOverride

---

## 7. PROPOSED CANVAS FEATURE INTEGRATION

### Overview
A **Canvas Refinement** step that allows users to hand-draw, sketch, or digitally paint on top of generated manga pages before finalizing.

### Proposed Workflow

```
Current:
Planner → Renderer → Storage → Display → Overlay Editor → Export

Proposed:
Planner → Renderer → Storage → Display → Canvas Editor → [NEW]
                                              ↓
                                    (Draw/Sketch)
                                              ↓
                                    Save Drawing → Upload
                                              ↓
                                         Storage → Export
```

### Canvas Use Cases
1. **Manual touch-ups** - Redraw character faces, fix anatomy
2. **Panel refinement** - Add speed lines, effects, shading
3. **Text annotations** - Hand-written notes, signatures
4. **Artistic overlays** - Water-color effects, textures
5. **Composition fixes** - Adjust object positions with brush

---

## 8. REQUIRED NEW API ENDPOINTS

### Canvas Drawing Endpoints

```typescript
// Save drawing strokes to page
POST /pages/:id/canvas
Request Body: {
  drawingData: {
    strokes: Array<{
      points: Array<{x, y}>;
      color: string;
      width: number;
      opacity: number;
      tool: 'pen' | 'eraser' | 'brush' | 'pencil';
      blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
    }>;
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor?: string;
    timestamp: number;
  };
  saveAsVersion?: boolean;  // Create new version or update current
  generateThumbnail?: boolean;
}
Response: {
  canvasUrl: string;
  canvasDataUrl?: string;  // For frontend cache
  version: number;
  overlayedImageUrl: string;  // Canvas + original merged
}

// Get drawing data for page
GET /pages/:id/canvas
Response: {
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;
  thumbnail: string;
  version: number;
  createdAt: datetime;
  modifiedAt: datetime;
}

// Clear drawing (restore to generated image)
POST /pages/:id/canvas/clear
Response: {
  ok: boolean;
  versionRestored: number;
}

// Get canvas history/versions
GET /pages/:id/canvas/versions
Response: {
  versions: Array<{
    version: number;
    thumbnail: string;
    createdAt: datetime;
    strokeCount: number;
    size: number;
  }>;
}

// Undo/Redo operations (optional)
POST /pages/:id/canvas/undo
POST /pages/:id/canvas/redo
Response: {
  version: number;
  strokeCount: number;
  canvasUrl: string;
}

// Finalize canvas and generate composite image
POST /pages/:id/canvas/finalize
Request Body: {
  includeCanvas: boolean;
  mergeMode: 'overlay' | 'replace';
}
Response: {
  imageUrl: string;
  compositeUrl: string;
  version: number;
  canvasPreserved: boolean;
}
```

### Canvas Operation Flow

```
┌─────────────────────────────────────────────────────────┐
│ Frontend Canvas Editor (/pages/:id/canvas)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Display:                                              │
│  ├─ Generated page image (background)                  │
│  ├─ Canvas overlay (transparent)                       │
│  └─ Drawing tools:                                     │
│      ├─ Pen, Pencil, Brush                            │
│      ├─ Eraser, Smudge                                │
│      ├─ Layers (show/hide)                            │
│      ├─ Undo/Redo                                     │
│      └─ Color picker, brush size                      │
│                                                         │
│  Events:                                               │
│  ├─ pointerdown → Start stroke                         │
│  ├─ pointermove → Draw stroke                          │
│  ├─ pointerup → End stroke & send to backend           │
│  └─ Auto-save every 5 seconds                          │
│                                                         │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
        POST /pages/:id/canvas
               │
               ├─ Stroke data serialization
               ├─ Compression (optional)
               └─ Timestamp
               │
        ┌──────▼──────────────────────┐
        │ CanvasService (NEW)          │
        ├─────────────────────────────┤
        │                              │
        │ • Render strokes to image    │
        │ • Composite with original    │
        │ • Store stroke metadata      │
        │ • Manage versions            │
        │ • Generate thumbnail         │
        │                              │
        └──────┬───────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ StorageService              │
        ├─────────────────────────────┤
        │ Upload canvas images to     │
        │ Supabase:                   │
        │ canvas/{pageId}_v{n}.png    │
        │ overlay/{pageId}_v{n}.png   │
        │ thumbnail/{pageId}.png      │
        │                              │
        └──────┬───────────────────────┘
               │
               ▼ (Return URLs & metadata)
```

---

## 9. DATABASE SCHEMA CHANGES

### New Table: `Canvas`

```sql
CREATE TABLE "Canvas" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pageId" TEXT NOT NULL UNIQUE,
  "episodeId" TEXT NOT NULL,
  
  -- Stroke data
  "strokesData" BYTEA NOT NULL,  -- Compressed stroke array (protobuf or msgpack)
  "strokeCount" INT NOT NULL DEFAULT 0,
  "canvasWidth" INT NOT NULL DEFAULT 1024,
  "canvasHeight" INT NOT NULL DEFAULT 1536,
  
  -- Rendering
  "canvasImageUrl" TEXT,  -- PNG of pure canvas drawing
  "overlayImageUrl" TEXT, -- Composite: original + canvas
  "thumbnail" TEXT,       -- Small preview
  
  -- Versioning
  "version" INT NOT NULL DEFAULT 1,
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modifiedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE,
  FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE,
  
  -- Indexes
  INDEX "idx_canvas_pageId" ("pageId"),
  INDEX "idx_canvas_episodeId" ("episodeId"),
  INDEX "idx_canvas_createdAt" ("createdAt")
);
```

### Modified Table: `Page`

```sql
-- Add canvas reference and painting tracking
ALTER TABLE "Page" ADD COLUMN "canvasId" TEXT;
ALTER TABLE "Page" ADD COLUMN "canvasVersion" INT DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN "lastCanvasEdit" TIMESTAMP;
ALTER TABLE "Page" ADD COLUMN "canvasEnabled" BOOLEAN DEFAULT false;

-- Add foreign key
ALTER TABLE "Page" 
  ADD CONSTRAINT "fk_page_canvasId" 
  FOREIGN KEY ("canvasId") 
  REFERENCES "Canvas"("id") 
  ON DELETE SET NULL;

-- Add index for queries
CREATE INDEX "idx_page_canvasId" ON "Page"("canvasId");
CREATE INDEX "idx_page_canvasEnabled" ON "Page"("canvasEnabled");
```

### New Table: `CanvasHistory` (Optional - for version tracking)

```sql
CREATE TABLE "CanvasHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "canvasId" TEXT NOT NULL,
  "version" INT NOT NULL,
  "strokeCount" INT NOT NULL,
  "thumbnail" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE,
  UNIQUE("canvasId", "version"),
  INDEX "idx_canvas_history_version" ("canvasId", "version")
);
```

### Migration SQL

```sql
-- Create Canvas table
CREATE TABLE "Canvas" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pageId" TEXT NOT NULL UNIQUE,
  "episodeId" TEXT NOT NULL,
  "strokesData" BYTEA NOT NULL,
  "strokeCount" INT NOT NULL DEFAULT 0,
  "canvasWidth" INT NOT NULL DEFAULT 1024,
  "canvasHeight" INT NOT NULL DEFAULT 1536,
  "canvasImageUrl" TEXT,
  "overlayImageUrl" TEXT,
  "thumbnail" TEXT,
  "version" INT NOT NULL DEFAULT 1,
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modifiedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE,
  FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_canvas_pageId" ON "Canvas"("pageId");
CREATE INDEX "idx_canvas_episodeId" ON "Canvas"("episodeId");
CREATE INDEX "idx_canvas_createdAt" ON "Canvas"("createdAt");

-- Extend Page table
ALTER TABLE "Page" ADD COLUMN "canvasId" TEXT;
ALTER TABLE "Page" ADD COLUMN "canvasVersion" INT DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN "lastCanvasEdit" TIMESTAMP;
ALTER TABLE "Page" ADD COLUMN "canvasEnabled" BOOLEAN DEFAULT false;

ALTER TABLE "Page"
  ADD CONSTRAINT "fk_page_canvasId"
  FOREIGN KEY ("canvasId")
  REFERENCES "Canvas"("id")
  ON DELETE SET NULL;

CREATE INDEX "idx_page_canvasId" ON "Page"("canvasId");
CREATE INDEX "idx_page_canvasEnabled" ON "Page"("canvasEnabled");
```

---

## 10. SERVICE LAYER CHANGES

### New Service: `CanvasService`

```typescript
// Location: backend/src/canvas/canvas.service.ts

interface CanvasStroke {
  id: string;
  points: Array<{x: number; y: number}>;
  color: string;
  width: number;
  opacity: number;
  tool: 'pen' | 'eraser' | 'brush' | 'pencil';
  blendMode?: string;
  timestamp: number;
}

interface CanvasData {
  strokes: CanvasStroke[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
}

@Injectable()
export class CanvasService {
  
  // Save/update canvas drawing
  async saveCanvas(
    pageId: string,
    drawingData: CanvasData,
    options: {saveAsVersion?: boolean; generateThumbnail?: boolean}
  ): Promise<{canvasUrl: string; version: number}>
  
  // Get canvas data for a page
  async getCanvas(pageId: string): Promise<CanvasData | null>
  
  // Render strokes to PNG image
  private async renderCanvasImage(data: CanvasData): Promise<Buffer>
  
  // Composite canvas with original image
  private async compositeImages(
    originalUrl: string,
    canvasImage: Buffer
  ): Promise<Buffer>
  
  // Manage canvas versions
  async getCanvasVersions(pageId: string): Promise<CanvasHistory[]>
  async restoreCanvasVersion(canvasId: string, version: number): Promise<void>
  
  // Finalize canvas (merge with original, update page)
  async finalizeCanvas(
    pageId: string,
    options: {includeCanvas: boolean; mergeMode: string}
  ): Promise<{imageUrl: string}>
  
  // Clear canvas (delete strokes)
  async clearCanvas(pageId: string): Promise<void>
}
```

### Integration with EpisodesService

```typescript
// In EpisodesService.getPageById():
async getPageById(pageId: string): Promise<Page> {
  const page = await this.prisma.page.findUnique({
    where: {id: pageId},
    include: {
      canvas: true  // NEW: Include canvas relationship
    }
  });
  
  return {
    ...page,
    canvasUrl: page.canvas?.overlayImageUrl,  // NEW
    canvasVersion: page.canvasVersion,         // NEW
  };
}
```

---

## 11. FRONTEND COMPONENTS

### New Component: `CanvasEditor.tsx`

```typescript
// Location: components/CanvasEditor.tsx

interface CanvasEditorProps {
  pageId: string;
  baseImageUrl: string;
  initialCanvasData?: CanvasData;
  onSave?: (data: CanvasData) => void;
  onFinalize?: (imageUrl: string) => void;
}

export default function CanvasEditor(props: CanvasEditorProps) {
  // Features:
  // - Render base image + transparent overlay
  // - Drawing tools (pen, pencil, brush, eraser)
  // - Color picker, brush size, opacity
  // - Undo/Redo stack
  // - Layer toggle (show/hide original)
  // - Save/Clear/Finalize buttons
  // - Auto-save every 5 seconds
  // - Real-time stroke preview
}
```

### Integration with `/pages/studio/[id].tsx`

```typescript
// Add Canvas tab to studio page
<Tabs>
  <Tab label="Overlays">
    {/* Current overlay editor */}
  </Tab>
  <Tab label="Canvas">
    {/* NEW: Canvas drawing editor */}
    <CanvasEditor
      pageId={currentPage.id}
      baseImageUrl={currentPage.imageUrl}
      onSave={handleSaveCanvas}
      onFinalize={handleFinalizeCanvas}
    />
  </Tab>
  <Tab label="AI Regenerate">
    {/* Current regenerate editor */}
  </Tab>
</Tabs>
```

---

## 12. TECH STACK RECOMMENDATIONS

### For Canvas Drawing
- **Frontend Canvas:** Fabric.js or Konva.js (robust, feature-rich)
- **Alternative:** Paper.js (vector-based), Excalidraw.js (sketch-style)
- **Rendering Engine:** Sharp (Node.js image processing)
- **Compression:** MessagePack or Protocol Buffers for stroke data
- **Undo/Redo:** Custom stack implementation (lightweight)

### For Stroke Serialization
```typescript
// Option 1: JSON (simple, larger)
{
  strokes: [{points, color, width, ...}],
  ...
}

// Option 2: MessagePack (compact, typed)
// Binary format ~30% smaller

// Option 3: Custom binary (protobuf)
// Smallest, but complex serialization
```

---

## 13. INTEGRATION POINTS SUMMARY

| Component | Integration Point | Type | Priority |
|-----------|-------------------|------|----------|
| Database | New Canvas table + Page.canvasId | Schema | P0 |
| API | POST/GET /pages/:id/canvas | Endpoint | P0 |
| Service | CanvasService + EpisodesService link | Backend | P0 |
| Storage | Upload canvas images to Supabase | Supabase | P1 |
| Frontend | CanvasEditor component + Studio tab | UI | P1 |
| Queue | Optional: async canvas rendering | BullMQ | P2 |
| Events | SSE: canvas_progress, canvas_done | EventsService | P2 |
| Export | Include canvas in PDF/CBZ export | ExportService | P2 |

---

## 14. IMPLEMENTATION ROADMAP

### Phase 1: Backend Foundation (P0)
1. Create Canvas table migration
2. Implement CanvasService
3. Add canvas endpoints to PagesController
4. Link Canvas to Page via EpisodesService

### Phase 2: Frontend Canvas (P1)
1. Implement CanvasEditor component
2. Integrate into /pages/studio tab
3. Add real-time save/preview
4. Implement undo/redo

### Phase 3: Advanced Features (P2)
1. Canvas versioning and history
2. Async rendering via BullMQ
3. Canvas inclusion in exports
4. Collaborative sketching (optional)

### Phase 4: Polish (P3)
1. Performance optimization
2. Compression & storage efficiency
3. Mobile canvas support
4. Offline mode support

---

## 15. ESTIMATED EFFORT & COMPLEXITY

| Task | Effort | Complexity | Duration |
|------|--------|-----------|----------|
| DB schema changes | 2h | Low | 1 day |
| CanvasService impl | 8h | Medium | 2 days |
| API endpoints | 4h | Low | 1 day |
| CanvasEditor component | 12h | High | 3 days |
| Integration & testing | 6h | Medium | 1.5 days |
| **Total** | **32h** | **Medium** | **~1 week** |

---

## 16. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Canvas rendering slow on mobile | Medium | Use WebGL, implement progressive rendering |
| Large stroke data → storage bloat | Medium | Compress with msgpack, implement cleanup |
| Canvas conflicts with overlays | Low | Separate rendering pipelines, clear precedent |
| Performance on large canvases | High | Implement chunking, lazy evaluation, canvas pooling |
| Browser compatibility | Low | Use Fabric.js (broad support) |

---

## 17. EXAMPLE API USAGE

```bash
# Save canvas drawing
curl -X POST http://localhost:4000/pages/page123/canvas \
  -H "Content-Type: application/json" \
  -d '{
    "drawingData": {
      "strokes": [
        {
          "id": "stroke1",
          "points": [{x: 10, y: 20}, {x: 15, y: 25}],
          "color": "#000000",
          "width": 2,
          "opacity": 1,
          "tool": "pen"
        }
      ],
      "canvasWidth": 1024,
      "canvasHeight": 1536
    },
    "generateThumbnail": true
  }'

# Get canvas data
curl http://localhost:4000/pages/page123/canvas

# Finalize canvas
curl -X POST http://localhost:4000/pages/page123/canvas/finalize \
  -H "Content-Type: application/json" \
  -d '{"includeCanvas": true, "mergeMode": "overlay"}'
```


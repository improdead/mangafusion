# Sketch-to-Manga Refinement: Integration & Technical Implementation Guide

**Document Version:** 1.0
**Date:** 2025-11-17
**Purpose:** Technical specifications and integration points for development teams

---

## Quick Navigation

1. [Database Schema Changes](#database-schema-changes)
2. [Backend API Design](#backend-api-design)
3. [Frontend Integration Points](#frontend-integration-points)
4. [Canvas & Drawing Implementation](#canvas--drawing-implementation)
5. [AI Provider Integration](#ai-provider-integration)
6. [Storage & CDN Strategy](#storage--cdn-strategy)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Testing Strategy](#testing-strategy)

---

## Database Schema Changes

### Existing Schema (Current)

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
  overlays   Json?

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
}
```

### Extended Schema (New Fields)

```prisma
model Page {
  id         String     @id @default(uuid())
  episodeId  String
  pageNumber Int
  status     PageStatus
  imageUrl   String?       // Current image (AI-gen or refined)
  audioUrl   String?
  seed       Int?
  version    Int?       @default(0)
  error      String?
  overlays   Json?

  // NEW: Refinement tracking
  refinementCount    Int      @default(0)
  currentRefinementId String?
  refinementHistory  RefinementVersion[]
  currentRefinement  RefinementVersion? @relation("CurrentRefinement")

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, pageNumber])
  @@index([episodeId])
  @@index([status])
  @@index([episodeId, status])
}

// NEW Model
model RefinementVersion {
  id                String   @id @default(uuid())
  pageId            String
  page              Page     @relation(name: "PageRefinements", fields: [pageId], references: [id], onDelete: Cascade)
  isCurrentVersion  Page?    @relation("CurrentRefinement")

  // Sketch input
  originalSketchUrl String

  // Refinement output
  refinedImageUrl   String

  // Configuration used
  promptDescription String?
  style             String   // 'shonen' | 'shojo' | 'seinen' | 'cyberpunk' | 'classic'
  strength          Int      // 0-100
  aiProvider        String   // 'gemini' | 'segmind'
  aiModel           String   // e.g., 'gemini-2.5-flash'
  temperature       Float    @default(0.7)
  seed              Int?

  // Metadata
  processingTimeMs  Int      // Milliseconds
  inputSize         Int      // Bytes of sketch
  outputSize        Int      // Bytes of refined image
  qualityScore      Float?   // 0-100
  styleMatch        Float?   // 0-100
  similarity        Float?   // 0-100 (preservation of sketch elements)

  // Status
  status            String   @default("pending") // 'pending' | 'processing' | 'complete' | 'failed'
  errorMessage      String?

  // Approval status
  userAccepted      Boolean? @default(null)
  acceptedAt        DateTime?
  rejectedAt        DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([pageId])
  @@index([createdAt])
  @@index([userAccepted])
  @@index([status])
}

// NEW Model for bulk jobs
model BulkRefinementJob {
  id              String   @id @default(uuid())
  episodeId       String

  // Configuration
  globalPrompt    String?
  style           String
  strength        Int
  aiProvider      String

  // Progress tracking
  totalPages      Int
  processedCount  Int      @default(0)
  acceptedCount   Int      @default(0)
  rejectedCount   Int      @default(0)
  failedCount     Int      @default(0)

  // Status
  status          String   @default("queued") // 'queued' | 'running' | 'paused' | 'completed' | 'failed'

  // Costs
  estimatedCost   Float
  actualCost      Float?

  // Timing
  startedAt       DateTime?
  completedAt     DateTime?
  totalTimeMs     Int?

  // Results
  results         RefinementVersion[] // through pageId joins

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([episodeId])
  @@index([status])
  @@index([createdAt])
}
```

### Migration Steps

```sql
-- 1. Add new fields to Page table
ALTER TABLE "Page" ADD COLUMN "refinementCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN "currentRefinementId" TEXT;

-- 2. Create RefinementVersion table
CREATE TABLE "RefinementVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pageId" TEXT NOT NULL,
  "originalSketchUrl" TEXT NOT NULL,
  "refinedImageUrl" TEXT NOT NULL,
  "promptDescription" TEXT,
  "style" TEXT NOT NULL DEFAULT 'shonen',
  "strength" INTEGER NOT NULL DEFAULT 50,
  "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
  "aiModel" TEXT NOT NULL,
  "temperature" DECIMAL NOT NULL DEFAULT 0.7,
  "seed" INTEGER,
  "processingTimeMs" INTEGER NOT NULL,
  "inputSize" INTEGER,
  "outputSize" INTEGER,
  "qualityScore" DECIMAL,
  "styleMatch" DECIMAL,
  "similarity" DECIMAL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "errorMessage" TEXT,
  "userAccepted" BOOLEAN,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefinementVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE
);

CREATE INDEX "RefinementVersion_pageId_idx" ON "RefinementVersion"("pageId");
CREATE INDEX "RefinementVersion_createdAt_idx" ON "RefinementVersion"("createdAt");
CREATE INDEX "RefinementVersion_userAccepted_idx" ON "RefinementVersion"("userAccepted");
CREATE INDEX "RefinementVersion_status_idx" ON "RefinementVersion"("status");

-- 3. Create BulkRefinementJob table
CREATE TABLE "BulkRefinementJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "episodeId" TEXT NOT NULL,
  "globalPrompt" TEXT,
  "style" TEXT NOT NULL,
  "strength" INTEGER NOT NULL DEFAULT 50,
  "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
  "totalPages" INTEGER NOT NULL,
  "processedCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "estimatedCost" DECIMAL NOT NULL,
  "actualCost" DECIMAL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "totalTimeMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BulkRefinementJob_episodeId_idx" ON "BulkRefinementJob"("episodeId");
CREATE INDEX "BulkRefinementJob_status_idx" ON "BulkRefinementJob"("status");
CREATE INDEX "BulkRefinementJob_createdAt_idx" ON "BulkRefinementJob"("createdAt");

-- 4. Add foreign key for currentRefinementId
ALTER TABLE "Page" ADD CONSTRAINT "Page_currentRefinementId_fkey"
  FOREIGN KEY ("currentRefinementId") REFERENCES "RefinementVersion" ("id") ON DELETE SET NULL;
```

---

## Backend API Design

### Endpoint 1: Create Refinement

**Route:** `POST /api/pages/[pageId]/refine`

**Request Body:**
```typescript
{
  sketchImageUrl?: string;        // URL to pre-uploaded sketch
  sketchBase64?: string;           // Or direct base64
  promptDescription?: string;      // User's refinement instructions
  style: 'shonen' | 'shojo' | 'seinen' | 'cyberpunk' | 'classic';
  strength: number;                // 0-100
  aiProvider: 'gemini' | 'segmind'; // AI service to use
  aiModel?: string;                // Optional model override
  temperature?: number;            // 0-1, creativity level
  seed?: number;                   // For reproducibility
  enhanceContrast?: boolean;       // Preprocess sketch
}
```

**Response:**
```typescript
{
  refinementId: string;            // ID of refinement job
  status: 'pending' | 'processing';
  estimatedTime: number;           // Seconds
  estimatedCost: number;           // USD
  jobStreamUrl: string;            // SSE endpoint for progress
}
```

**Implementation:**
```typescript
// pages/api/pages/[pageId]/refine.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { validateSketchImage, preprocessSketch } from '@/lib/sketch';
import { queueRefinementJob } from '@/lib/queue';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pageId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId as string }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Validate & process sketch
    let sketchUrl = req.body.sketchImageUrl;
    if (!sketchUrl && req.body.sketchBase64) {
      const blob = Buffer.from(req.body.sketchBase64, 'base64');
      sketchUrl = await uploadToStorage(blob, `sketches/${pageId}`);
    }

    if (!sketchUrl) {
      return res.status(400).json({ error: 'No sketch provided' });
    }

    // Preprocess sketch
    const processedSketch = await preprocessSketch(sketchUrl, {
      enhanceContrast: req.body.enhanceContrast ?? true
    });

    // Create refinement record
    const refinement = await prisma.refinementVersion.create({
      data: {
        pageId: pageId as string,
        originalSketchUrl: sketchUrl,
        refinedImageUrl: '', // Will be updated when complete
        promptDescription: req.body.promptDescription,
        style: req.body.style,
        strength: req.body.strength,
        aiProvider: req.body.aiProvider,
        aiModel: req.body.aiModel || 'gemini-2.5-flash',
        temperature: req.body.temperature ?? 0.7,
        seed: req.body.seed,
        status: 'pending'
      }
    });

    // Queue refinement job
    const job = await queueRefinementJob({
      refinementId: refinement.id,
      sketchUrl: processedSketch,
      config: {
        promptDescription: req.body.promptDescription,
        style: req.body.style,
        strength: req.body.strength,
        aiProvider: req.body.aiProvider,
        aiModel: req.body.aiModel,
        temperature: req.body.temperature,
        seed: req.body.seed
      }
    });

    // Estimate costs
    const estimatedCost = calculateCost(
      req.body.aiProvider,
      768 * 1024 // Standard page size in pixels
    );

    return res.status(202).json({
      refinementId: refinement.id,
      status: 'pending',
      estimatedTime: req.body.aiProvider === 'gemini' ? 45 : 20,
      estimatedCost,
      jobStreamUrl: `/api/refinements/${refinement.id}/stream`
    });
  } catch (error) {
    console.error('Refinement error:', error);
    return res.status(500).json({ error: 'Refinement failed' });
  }
}

function calculateCost(provider: string, pixelCount: number): number {
  const costPerMegapixel = {
    gemini: 0.000005,   // $0.005 per megapixel
    segmind: 0.0000025  // $0.0025 per megapixel
  };

  const megapixels = pixelCount / 1_000_000;
  return megapixels * costPerMegapixel[provider];
}
```

---

### Endpoint 2: Stream Refinement Progress

**Route:** `GET /api/refinements/[refinementId]/stream`

**Response:** Server-Sent Events (SSE)

```typescript
// Event stream format
event: refinement_progress
data: {
  "status": "processing",
  "step": 2,
  "totalSteps": 4,
  "stepName": "Generating base image",
  "progress": 45,
  "estimatedSecondsRemaining": 12
}

event: refinement_complete
data: {
  "status": "complete",
  "refinedImageUrl": "https://cdn.example.com/refined/xyz.png",
  "processingTime": 47000,
  "qualityScore": 92,
  "styleMatch": 94,
  "similarity": 87
}

event: refinement_error
data: {
  "status": "failed",
  "error": "AI provider timeout",
  "errorCode": "PROVIDER_TIMEOUT"
}
```

**Implementation:**
```typescript
// pages/api/refinements/[refinementId]/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { refinementId } = req.query;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Subscribe to Redis pub/sub
  const channel = `refinement:${refinementId}`;
  const subscriber = redis.duplicate();

  subscriber.subscribe(channel, (err) => {
    if (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
      return;
    }
  });

  subscriber.on('message', (channel, message) => {
    const data = JSON.parse(message);
    res.write(`event: ${data.event}\ndata: ${JSON.stringify(data)}\n\n`);

    // End stream on completion
    if (data.event === 'refinement_complete' || data.event === 'refinement_error') {
      subscriber.unsubscribe();
      res.end();
    }
  });

  // Cleanup on disconnect
  req.on('close', () => {
    subscriber.unsubscribe();
    subscriber.disconnect();
  });
}
```

---

### Endpoint 3: Accept/Reject Refinement

**Route:** `PUT /api/refinements/[refinementId]/accept`

**Request:**
```typescript
{
  action: 'accept' | 'reject' | 'retry';
  retryConfig?: RefinementConfig; // If action is 'retry'
}
```

**Response:**
```typescript
{
  success: boolean;
  pageId: string;
  updatedImageUrl?: string; // New image if accepted
  message: string;
}
```

**Implementation:**
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { refinementId } = req.query;
  const { action, retryConfig } = req.body;

  if (action === 'accept') {
    // 1. Get refinement
    const refinement = await prisma.refinementVersion.findUnique({
      where: { id: refinementId as string }
    });

    // 2. Update page to use this refinement
    const page = await prisma.page.update({
      where: { id: refinement.pageId },
      data: {
        imageUrl: refinement.refinedImageUrl,
        version: { increment: 1 },
        currentRefinementId: refinement.id
      }
    });

    // 3. Mark refinement as accepted
    await prisma.refinementVersion.update({
      where: { id: refinementId as string },
      data: {
        userAccepted: true,
        acceptedAt: new Date()
      }
    });

    return res.json({
      success: true,
      pageId: page.id,
      updatedImageUrl: page.imageUrl,
      message: 'Refinement accepted and saved'
    });
  } else if (action === 'reject') {
    // Mark as rejected
    await prisma.refinementVersion.update({
      where: { id: refinementId as string },
      data: {
        userAccepted: false,
        rejectedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Refinement rejected'
    });
  } else if (action === 'retry') {
    // Requeue with new config
    const refinement = await prisma.refinementVersion.findUnique({
      where: { id: refinementId as string }
    });

    const newRefinement = await prisma.refinementVersion.create({
      data: {
        pageId: refinement.pageId,
        originalSketchUrl: refinement.originalSketchUrl,
        refinedImageUrl: '',
        ...retryConfig,
        status: 'pending'
      }
    });

    await queueRefinementJob({
      refinementId: newRefinement.id,
      sketchUrl: refinement.originalSketchUrl,
      config: retryConfig
    });

    return res.json({
      success: true,
      refinementId: newRefinement.id,
      message: 'Retry queued'
    });
  }
}
```

---

### Endpoint 4: Bulk Refinement

**Route:** `POST /api/episodes/[episodeId]/bulk-refine`

**Request:**
```typescript
{
  globalPrompt?: string;
  style: string;
  strength: number;
  aiProvider: string;
  autoAcceptThreshold?: number; // Default: 90 (%)
  skipFailedPages?: boolean;    // Default: true
}
```

**Response:**
```typescript
{
  jobId: string;
  totalPages: number;
  estimatedTime: number;        // Seconds
  estimatedCost: number;        // USD
  jobStreamUrl: string;         // SSE endpoint
}
```

**Implementation:**
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { episodeId } = req.query;

  // Get all pages for episode
  const pages = await prisma.page.findMany({
    where: {
      episodeId: episodeId as string,
      imageUrl: { not: null } // Only pages with content
    },
    orderBy: { pageNumber: 'asc' }
  });

  // Create bulk job
  const job = await prisma.bulkRefinementJob.create({
    data: {
      episodeId: episodeId as string,
      globalPrompt: req.body.globalPrompt,
      style: req.body.style,
      strength: req.body.strength,
      aiProvider: req.body.aiProvider,
      totalPages: pages.length,
      estimatedCost: calculateBulkCost(
        req.body.aiProvider,
        pages.length
      ),
      status: 'queued'
    }
  });

  // Queue all pages
  for (const page of pages) {
    await queueBulkRefinementPage({
      jobId: job.id,
      pageId: page.id,
      config: req.body
    });
  }

  return res.status(202).json({
    jobId: job.id,
    totalPages: pages.length,
    estimatedTime: pages.length * 50, // 50 seconds per page avg
    estimatedCost: job.estimatedCost,
    jobStreamUrl: `/api/bulk-jobs/${job.id}/stream`
  });
}
```

---

## Frontend Integration Points

### Integration 1: Episode Page

**File:** `/pages/episodes/[id].tsx`

```typescript
// Add button to PageCard
interface PageCardProps {
  // ... existing props
  onRefine?: () => void;
  refinementCount?: number;
  hasRefinement?: boolean;
}

export default function PageCard({
  page,
  imageUrl,
  onRefine,
  refinementCount,
  hasRefinement,
  // ... other props
}: PageCardProps) {
  return (
    <div className="page-card">
      {/* ... existing content */}

      {hasRefinement && (
        <div className="refinement-badge" title={`${refinementCount} refinements`}>
          ✨ {refinementCount}
        </div>
      )}

      <div className="card-actions">
        {/* ... existing buttons */}

        <button
          onClick={onRefine}
          className="btn-refine"
          title="Refine this page with AI"
        >
          <svg className="icon-sparkles">✨</svg>
          <span>Refine</span>
        </button>
      </div>
    </div>
  );
}

// In episode page component
const handleRefineClick = (pageId: string) => {
  router.push(`/refine/${pageId}?episodeId=${id}`);
};

// Listen for refinement updates
useEffect(() => {
  const handleRefinementUpdate = (event: CustomEvent) => {
    const { pageId, imageUrl, refinementCount } = event.detail;
    setPages(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        imageUrl,
        refinementCount,
        hasRefinement: true
      }
    }));
  };

  window.addEventListener('refinement:updated', handleRefinementUpdate);
  return () => window.removeEventListener('refinement:updated', handleRefinementUpdate);
}, []);

// Add bulk refine button in header
<button
  onClick={() => router.push(`/bulk-refine/${id}`)}
  className="btn-bulk-refine"
>
  ✨ Refine All Pages
</button>
```

---

### Integration 2: Studio Editor

**File:** `/pages/studio/[id].tsx`

```typescript
// Add refinement tab
const [toolTab, setToolTab] = useState<'tools' | 'overlays' | 'refine'>('tools');

return (
  <Layout title="Studio Editor - MangaFusion">
    <div className="studio-layout">
      {/* ... existing panels ... */}

      {/* Tools panel with tabs */}
      <aside className="tools-panel">
        <div className="tool-tabs">
          <button
            className={toolTab === 'tools' ? 'active' : ''}
            onClick={() => setToolTab('tools')}
          >
            ✎ Tools
          </button>
          <button
            className={toolTab === 'overlays' ? 'active' : ''}
            onClick={() => setToolTab('overlays')}
          >
            💬 Overlays
          </button>
          <button
            className={toolTab === 'refine' ? 'active' : ''}
            onClick={() => setToolTab('refine')}
          >
            ✨ Refine
          </button>
        </div>

        {toolTab === 'tools' && <ToolsPanel />}
        {toolTab === 'overlays' && <OverlaysPanel />}
        {toolTab === 'refine' && (
          <SketchRefinePanel
            pageId={currentPage.id}
            onRefinementComplete={handleRefinementComplete}
          />
        )}
      </aside>
    </div>
  </Layout>
);

const handleRefinementComplete = (newImageUrl: string) => {
  // Update current page
  setPages(prev =>
    prev.map(p =>
      p.id === currentPage.id
        ? { ...p, imageUrl: newImageUrl }
        : p
    )
  );

  // Switch to overlays tab for editing
  setToolTab('overlays');
};
```

---

## Canvas & Drawing Implementation

### Canvas Library Selection

**Recommended:** Custom implementation with Fabric.js optional

```typescript
// lib/canvas/DrawingCanvas.ts
import { Point, Stroke } from './types';

export class DrawingCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];
  private isDrawing = false;
  private lastPoint: Point | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.setupEventListeners();
    this.clear();
  }

  private setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', e => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', e => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', e => this.onPointerUp(e));
    this.canvas.addEventListener('mouseleave', e => this.onPointerUp(e));

    // Touch events
    this.canvas.addEventListener('touchstart', e => this.onPointerDown(e));
    this.canvas.addEventListener('touchmove', e => this.onPointerMove(e));
    this.canvas.addEventListener('touchend', e => this.onPointerUp(e));

    // Pen events (if supported)
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', e => this.onPointerUp(e));
  }

  private onPointerDown(e: any) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;

    this.lastPoint = { x, y };
    this.redoStack = []; // Clear redo on new stroke
  }

  private onPointerMove(e: any) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;
    const pressure = e.pressure || 1.0;

    if (this.lastPoint) {
      this.drawLine(
        this.lastPoint.x,
        this.lastPoint.y,
        x,
        y,
        pressure
      );
    }

    this.lastPoint = { x, y };
  }

  private onPointerUp(e: any) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.lastPoint = null;
  }

  private drawLine(x0: number, y0: number, x1: number, y1: number, pressure: number) {
    // Anti-aliased line drawing using quadratic bezier
    const ctx = this.ctx;
    const brush = this.currentBrushSize;
    const opacity = this.currentOpacity;

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = brush * pressure;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Track for undo
    if (!this.currentStroke) {
      this.currentStroke = {
        points: [{ x: x0, y: y0 }],
        color: this.currentColor,
        size: brush,
        opacity
      };
    }
    this.currentStroke.points.push({ x: x1, y: y1 });
  }

  // Public API
  public setColor(color: string) {
    this.currentColor = color;
  }

  public setBrushSize(size: number) {
    this.currentBrushSize = Math.max(1, Math.min(50, size));
  }

  public setOpacity(opacity: number) {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
  }

  public clear() {
    const ctx = this.ctx;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  public undo() {
    if (this.strokes.length === 0) return;
    const stroke = this.strokes.pop()!;
    this.undoStack.push([stroke]);
    this.redraw();
  }

  public redo() {
    if (this.undoStack.length === 0) return;
    const strokes = this.undoStack.pop()!;
    this.strokes.push(...strokes);
    this.redraw();
  }

  private redraw() {
    this.clear();
    for (const stroke of this.strokes) {
      this.redrawStroke(stroke);
    }
  }

  public exportBlob(format: 'png' | 'jpeg' = 'png'): Promise<Blob> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, `image/${format}`);
    });
  }

  public exportBase64(format: 'png' | 'jpeg' = 'png'): string {
    return this.canvas.toDataURL(`image/${format}`);
  }

  public importImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
}
```

---

## AI Provider Integration

### Provider: Gemini (Google)

```typescript
// lib/ai/providers/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function refineSketchWithGemini(
  sketchBase64: string,
  mimeType: string,
  config: RefinementConfig
): Promise<RefinementResult> {
  const model = genAI.getGenerativeModel({
    model: config.model || 'gemini-2.5-flash'
  });

  const prompt = buildMangaRefinementPrompt(config);

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType,
            data: sketchBase64
          }
        },
        {
          text: prompt
        }
      ]
    }],
    generationConfig: {
      temperature: config.temperature || 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  });

  const response = await result.response;
  const imageUrl = extractImageUrl(response.text());

  return {
    imageUrl,
    qualityScore: calculateQualityScore(response),
    processingTimeMs: Date.now() - startTime
  };
}

function buildMangaRefinementPrompt(config: RefinementConfig): string {
  const styleGuides = {
    shonen: 'Dynamic, action-packed manga style with bold linework and dramatic composition',
    shojo: 'Romantic, emotional manga style with delicate features and soft aesthetic',
    seinen: 'Mature, detailed manga style with sophisticated linework and complex storytelling',
    cyberpunk: 'Futuristic manga style with neon colors, tech elements, and urban setting',
    classic: 'Traditional manga style with clean lines and timeless aesthetic'
  };

  return `You are a professional manga artist. Your task is to refine the provided sketch into a polished manga illustration.

SKETCH ANALYSIS:
- Analyze the sketch composition and character placement
- Preserve all key elements and storytelling aspects
- Maintain the aspect ratio (768x1024px)

REFINEMENT REQUIREMENTS:
- Style: ${styleGuides[config.style]}
- Refinement Strength: ${config.strength}% (0%=subtle, 100%=dramatic)
- Quality: Publication-ready manga illustration
${config.promptDescription ? `- User Instructions: ${config.promptDescription}` : ''}

SPECIFIC INSTRUCTIONS:
1. Clean up linework while preserving the original sketch's character
2. Add appropriate shading and tone (manga black & white or colored)
3. Enhance details: facial expressions, clothing folds, background elements
4. Apply proper perspective and composition rules
5. Add visual effects (speed lines, tone, screentone) as appropriate

OUTPUT:
Generate a refined manga illustration that honors the original sketch while elevating it to professional quality. The result should be suitable for publication in a manga magazine.`;
}
```

### Provider: Segmind ControlNet

```typescript
// lib/ai/providers/segmind.ts
export async function refineSketchWithSegmind(
  sketchBase64: string,
  config: RefinementConfig
): Promise<RefinementResult> {
  // Downscale sketch to optimal size
  const optimized = await optimizeImageSize(sketchBase64, 1024);

  const response = await fetch('https://api.segmind.com/v1/sd-controlnet-canny', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.SEGMIND_API_KEY
    },
    body: JSON.stringify({
      sketch_image: optimized,
      prompt: buildSegmindPrompt(config),
      negative_prompt: 'blurry, low quality, distorted, amateur',
      guidance_scale: 7.5 + (config.strength / 100 * 2.5), // 7.5-10
      num_outputs: 1,
      model: 'sdxl',
      num_inference_steps: 30,
      scheduler: 'euler',
      seed: config.seed || Math.floor(Math.random() * 1000000),
      controlnet: 'canny',
      controlnet_conditioning_scale: config.strength / 100
    })
  });

  if (!response.ok) {
    throw new Error(`Segmind API error: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    imageUrl: result.images[0],
    qualityScore: 80 + (config.strength / 100 * 15), // 80-95
    processingTimeMs: result.processingTime || 15000,
    seed: result.seed
  };
}

function buildSegmindPrompt(config: RefinementConfig): string {
  const stylePrompts = {
    shonen: 'dynamic action-packed anime manga art, bold linework, dramatic composition, heroic pose',
    shojo: 'beautiful romantic anime manga art, delicate features, soft eyes, dreamy aesthetic, sparkles',
    seinen: 'detailed mature anime manga art, sophisticated linework, complex composition, professional quality',
    cyberpunk: 'futuristic cyberpunk manga art, neon colors, tech aesthetic, urban setting, dystopian',
    classic: 'traditional manga art, clean linework, timeless style, professional illustration'
  };

  const basePrompt = `${stylePrompts[config.style]}, professional manga illustration, publication quality, masterwork`;

  if (config.promptDescription) {
    return `${basePrompt}, ${config.promptDescription}`;
  }

  return basePrompt;
}
```

---

## Storage & CDN Strategy

### Storage Implementation

```typescript
// lib/storage/upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadToStorage(
  blob: Blob,
  path: string,
  options?: {
    contentType?: string;
    cacheControl?: string;
  }
): Promise<string> {
  const key = `mangafusion/${path}-${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: blob,
    ContentType: options?.contentType || blob.type,
    CacheControl: options?.cacheControl || 'public, max-age=31536000',
    ServerSideEncryption: 'AES256'
  });

  try {
    await s3.send(command);
    return `https://${process.env.CDN_URL}/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    // Fallback to Supabase if S3 fails
    return uploadToSupabase(blob, path);
  }
}

async function uploadToSupabase(blob: Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('mangafusion')
    .upload(`refinements/${path}`, blob, {
      cacheControl: '31536000',
      upsert: false
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from('mangafusion')
    .getPublicUrl(`refinements/${path}`);

  return publicUrl.publicUrl;
}
```

### CDN Configuration

```typescript
// CloudFront distribution configuration
{
  "origins": [
    {
      "domainName": "mangafusion.s3.amazonaws.com",
      "id": "S3Origin",
      "s3OriginConfig": {
        "originAccessIdentity": "origin-access-identity/cloudfront/ABCDEF"
      }
    }
  ],
  "defaultCacheBehavior": {
    "targetOriginId": "S3Origin",
    "viewerProtocolPolicy": "redirect-to-https",
    "allowedMethods": ["GET", "HEAD"],
    "cachedMethods": ["GET", "HEAD"],
    "compress": true,
    "forwardedValues": {
      "queryString": false,
      "cookies": { "forward": "none" },
      "headers": ["Accept-Encoding"]
    },
    "minTTL": 0,
    "defaultTTL": 31536000,
    "maxTTL": 31536000
  },
  "priceClass": "PriceClass_100"
}
```

---

## Performance Optimization

### Canvas Optimization

```typescript
// lib/canvas/performance.ts

// 1. Canvas pooling to avoid GC pressure
class CanvasPool {
  private pool: HTMLCanvasElement[] = [];
  private maxSize = 10;

  acquire(width: number, height: number): HTMLCanvasElement {
    let canvas = this.pool.pop();

    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  release(canvas: HTMLCanvasElement): void {
    if (this.pool.length < this.maxSize) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      this.pool.push(canvas);
    }
  }
}

// 2. Worker thread for heavy operations
// worker/canvasExport.ts
self.onmessage = (event: MessageEvent) => {
  const { canvas, format, quality } = event.data;

  canvas.toBlob((blob: Blob) => {
    self.postMessage({
      success: true,
      blob: blob,
      size: blob.size
    });
  }, `image/${format}`, quality);
};

// Main thread usage
export async function exportCanvasInWorker(
  canvas: HTMLCanvasElement,
  format: string = 'png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/canvasExport.ts');

    worker.onmessage = (event) => {
      const { success, blob } = event.data;
      if (success) {
        resolve(blob);
        worker.terminate();
      }
    };

    worker.onerror = reject;
    worker.postMessage({
      canvas,
      format,
      quality: format === 'png' ? undefined : 0.85
    });
  });
}

// 3. Lazy loading for comparison images
export async function lazyLoadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.loading = 'lazy';
  img.decoding = 'async';
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
```

---

## Error Handling & Recovery

### Comprehensive Error Handler

```typescript
// lib/errors/refinementErrors.ts

export class RefinementError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public metadata?: Record<string, any>
  ) {
    super(message);
  }
}

export const ErrorHandlers = {
  'SKETCH_INVALID': {
    message: 'Please provide a valid image (PNG, JPG, or WebP)',
    action: 'retry-upload',
    userMessage: 'Invalid sketch format'
  },
  'SKETCH_TOO_LARGE': {
    message: 'Sketch file is too large (max 10MB)',
    action: 'compress-and-retry',
    userMessage: 'Please compress your image'
  },
  'API_TIMEOUT': {
    message: 'AI processing took too long',
    action: 'retry-different-provider',
    userMessage: 'Processing timed out, please try again'
  },
  'PROVIDER_ERROR': {
    message: 'AI provider returned an error',
    action: 'fallback-provider',
    userMessage: 'AI service unavailable, trying alternative'
  },
  'STORAGE_ERROR': {
    message: 'Failed to save refined image',
    action: 'retry-storage',
    userMessage: 'Save failed, retrying...'
  },
  'NETWORK_ERROR': {
    message: 'Network connection lost',
    action: 'retry-with-backoff',
    userMessage: 'Connection error, please check your internet'
  }
};

export async function handleRefinementError(
  error: any,
  context: { pageId: string; refinementId: string }
): Promise<{ recovered: boolean; action: string }> {
  const errorCode = error.code || 'UNKNOWN_ERROR';
  const handler = ErrorHandlers[errorCode];

  if (!handler) {
    console.error('Unknown error:', error);
    return { recovered: false, action: 'contact-support' };
  }

  console.warn(`${errorCode}: ${handler.message}`);

  switch (handler.action) {
    case 'retry-upload':
      // Prompt user to re-upload
      return { recovered: false, action: 'user-action-required' };

    case 'compress-and-retry':
      // Auto-compress image and retry
      try {
        const compressed = await compressImage(/* ... */);
        // Retry refinement
        return { recovered: true, action: 'retried' };
      } catch {
        return { recovered: false, action: 'user-action-required' };
      }

    case 'retry-different-provider':
      // Try Segmind if Gemini failed
      try {
        const result = await refineWithFallbackProvider(
          context.refinementId
        );
        return { recovered: true, action: 'retried' };
      } catch {
        return { recovered: false, action: 'contact-support' };
      }

    case 'retry-storage':
      // Retry storage with exponential backoff
      try {
        await retryWithBackoff(
          () => uploadRefinedImage(context.refinementId),
          3,
          1000
        );
        return { recovered: true, action: 'retried' };
      } catch {
        return { recovered: false, action: 'contact-support' };
      }

    default:
      return { recovered: false, action: 'contact-support' };
  }
}

async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number,
  initialDelay: number
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/canvas/drawing.test.ts
import { DrawingCanvas } from '@/lib/canvas/DrawingCanvas';

describe('DrawingCanvas', () => {
  let canvas: HTMLCanvasElement;
  let drawing: DrawingCanvas;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    drawing = new DrawingCanvas(canvas);
  });

  it('should draw a line', () => {
    drawing.drawLine(10, 10, 20, 20, 1.0);
    const imageData = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height);

    expect(imageData.data.some((v) => v > 0)).toBe(true);
  });

  it('should support undo', () => {
    drawing.drawLine(10, 10, 20, 20, 1.0);
    const beforeUndo = canvas.toDataURL();

    drawing.undo();
    const afterUndo = canvas.toDataURL();

    expect(beforeUndo).not.toBe(afterUndo);
  });

  it('should export as PNG', async () => {
    drawing.drawLine(10, 10, 20, 20, 1.0);
    const blob = await drawing.exportBlob('png');

    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});

// __tests__/api/pages/refine.test.ts
describe('POST /api/pages/[pageId]/refine', () => {
  it('should create a refinement job', async () => {
    const response = await fetch('/api/pages/test-page-id/refine', {
      method: 'POST',
      body: JSON.stringify({
        sketchBase64: mockSketchBase64,
        style: 'shonen',
        strength: 50,
        aiProvider: 'gemini'
      })
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.refinementId).toBeDefined();
    expect(data.status).toBe('pending');
  });

  it('should reject invalid requests', async () => {
    const response = await fetch('/api/pages/test-page-id/refine', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
      })
    });

    expect(response.status).toBe(400);
  });
});
```

---

**Document Status:** Complete Reference
**Next Step:** Begin Phase 1 implementation with database schema changes
**Last Updated:** 2025-11-17

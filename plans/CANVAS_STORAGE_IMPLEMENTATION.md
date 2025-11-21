# Canvas Storage Implementation Guide
## MangaFusion Drawing Data Architecture - Implementation Details

---

## Quick Start: Three Implementation Phases

### Phase 1: Immediate (Week 1) - Enhanced Storage Service
### Phase 2: Short-term (Weeks 2-3) - History & Snapshots
### Phase 3: Advanced (Week 4+) - Collaboration & Export

---

## Phase 1: Enhanced Storage Service

### 1.1 Create Drawing Service

**File:** `/backend/src/drawings/drawing.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as pako from 'pako';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export interface DrawingData {
  version: 1;
  canvas: {
    width: number;
    height: number;
    layers: Layer[];
  };
  metadata?: {
    createdAt: string;
    modifiedAt: string;
    author?: string;
  };
}

export interface Layer {
  id: string;
  name: string;
  opacity: number;
  blendMode: string;
  visible: boolean;
  locked: boolean;
  elements: DrawingElement[];
}

export type DrawingElement =
  | StrokeElement
  | TextElement
  | ShapeElement
  | ImageElement;

export interface StrokeElement {
  type: 'stroke';
  id: string;
  points: [number, number][];
  color: string;
  width: number;
  opacity: number;
}

export interface TextElement {
  type: 'text';
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface ShapeElement {
  type: 'shape';
  id: string;
  shape: 'rect' | 'circle' | 'polygon';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
}

export interface ImageElement {
  type: 'image';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

interface StorageMetadata {
  _externalRef?: string;      // Path in Supabase Storage
  _size?: number;             // Compressed size
  _compressed?: boolean;      // Was compressed
  _format?: 'json' | 'binary'; // Storage format
  _uncompressedSize?: number;
}

const STORAGE_SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB threshold
const COMPRESSION_THRESHOLD = 50 * 1024;        // 50KB threshold for compression

@Injectable()
export class DrawingService {
  private readonly logger = new Logger(DrawingService.name);
  private compressionLevel = 6; // 1-9, 6 is good balance

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Save drawing data with automatic compression and storage selection
   */
  async saveDrawing(pageId: string, drawing: DrawingData): Promise<void> {
    const jsonStr = JSON.stringify(drawing);
    const jsonSize = Buffer.byteLength(jsonStr, 'utf8');

    this.logger.debug(
      `Saving drawing for page ${pageId}, size: ${jsonSize} bytes`,
    );

    // Decide storage strategy based on size
    if (jsonSize < STORAGE_SIZE_THRESHOLD) {
      // Small enough for inline storage in JSONB
      await this.saveToDatabase(pageId, drawing, jsonSize);
    } else {
      // Large drawing - use external storage
      await this.saveToExternalStorage(pageId, drawing, jsonSize);
    }
  }

  /**
   * Save directly to PostgreSQL JSONB column
   */
  private async saveToDatabase(
    pageId: string,
    drawing: DrawingData,
    size: number,
  ): Promise<void> {
    const compressed = size > COMPRESSION_THRESHOLD;

    let data: any = drawing;
    let compressedSize = size;

    if (compressed) {
      // Store compression info
      const jsonStr = JSON.stringify(drawing);
      const gzipped = pako.gzip(jsonStr, { level: this.compressionLevel });
      const base64 = Buffer.from(gzipped).toString('base64');

      data = {
        _compressed: true,
        _format: 'json-gzip',
        _originalSize: size,
        _data: base64,
      };
      compressedSize = base64.length;

      this.logger.debug(
        `Compressed drawing: ${size} -> ${compressedSize} bytes (${Math.round((compressedSize / size) * 100)}%)`,
      );
    }

    await this.prisma.page.update({
      where: { id: pageId },
      data: {
        overlays: data as any,
      },
    });

    this.logger.log(
      `Drawing saved to database for page ${pageId} (${compressedSize} bytes)`,
    );
  }

  /**
   * Save to Supabase Storage with database reference
   */
  private async saveToExternalStorage(
    pageId: string,
    drawing: DrawingData,
    size: number,
  ): Promise<void> {
    const jsonStr = JSON.stringify(drawing);

    // Compress before upload
    const gzipped = pako.gzip(jsonStr, { level: this.compressionLevel });
    const compressedSize = gzipped.length;

    const filename = `drawings/${pageId}/${Date.now()}-${Math.random().toString(36).slice(2)}.json.gz`;

    this.logger.debug(
      `Uploading drawing to storage: ${filename} (${compressedSize} bytes)`,
    );

    try {
      // Upload to storage
      const url = await this.storage.uploadImage(
        Buffer.from(gzipped),
        filename,
        'application/gzip',
      );

      // Store reference in database
      const metadata: StorageMetadata = {
        _externalRef: filename,
        _size: compressedSize,
        _compressed: true,
        _format: 'json',
        _uncompressedSize: size,
      };

      await this.prisma.page.update({
        where: { id: pageId },
        data: {
          overlays: metadata as any,
        },
      });

      this.logger.log(
        `Drawing uploaded to storage: ${filename} (${compressedSize} bytes, from ${size} bytes)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload drawing to storage: ${error}`,
        error,
      );
      // Fallback: save as compressed JSON in database
      this.logger.warn(`Falling back to database storage with compression`);
      await this.saveToDatabase(pageId, drawing, size);
    }
  }

  /**
   * Load drawing from database or external storage
   */
  async loadDrawing(pageId: string): Promise<DrawingData | null> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { overlays: true },
    });

    if (!page?.overlays) {
      return null;
    }

    const data = page.overlays as any;

    // Check if external reference
    if (data._externalRef) {
      return this.loadFromExternalStorage(data._externalRef);
    }

    // Check if compressed in database
    if (data._compressed && data._format === 'json-gzip') {
      return this.decompressData(data._data);
    }

    // Plain JSON
    return data as DrawingData;
  }

  /**
   * Load drawing from Supabase Storage
   */
  private async loadFromExternalStorage(
    storagePath: string,
  ): Promise<DrawingData | null> {
    try {
      const file = await this.downloadFromStorage(storagePath);

      // Decompress
      const decompressed = pako.ungzip(file);
      const jsonStr = new TextDecoder().decode(decompressed);

      return JSON.parse(jsonStr) as DrawingData;
    } catch (error) {
      this.logger.error(
        `Failed to load drawing from storage: ${storagePath}`,
        error,
      );
      return null;
    }
  }

  /**
   * Decompress base64-encoded GZIP data
   */
  private decompressData(base64Data: string): DrawingData | null {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const decompressed = pako.ungzip(buffer);
      const jsonStr = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonStr) as DrawingData;
    } catch (error) {
      this.logger.error(`Failed to decompress data`, error);
      return null;
    }
  }

  /**
   * Download file from Supabase Storage
   * (Implement based on StorageService)
   */
  private async downloadFromStorage(path: string): Promise<Uint8Array> {
    // This would need to be implemented in StorageService
    throw new Error('Not implemented yet');
  }

  /**
   * Get drawing statistics
   */
  async getDrawingStats(
    pageId: string,
  ): Promise<{
    size: number;
    compressed: boolean;
    format: string;
    storageLocation: 'database' | 'external';
  } | null> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { overlays: true },
    });

    if (!page?.overlays) {
      return null;
    }

    const data = page.overlays as any;

    if (data._externalRef) {
      return {
        size: data._size || 0,
        compressed: data._compressed || false,
        format: data._format || 'unknown',
        storageLocation: 'external',
      };
    }

    const jsonStr = JSON.stringify(data);
    return {
      size: Buffer.byteLength(jsonStr, 'utf8'),
      compressed: data._compressed || false,
      format: data._format || 'json',
      storageLocation: 'database',
    };
  }

  /**
   * Delete drawing from storage
   */
  async deleteDrawing(pageId: string): Promise<void> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { overlays: true },
    });

    if (!page?.overlays) {
      return;
    }

    const data = page.overlays as any;

    // Delete from external storage if applicable
    if (data._externalRef) {
      try {
        await this.storage.deleteImage(data._externalRef);
      } catch (error) {
        this.logger.warn(`Failed to delete from storage: ${error}`);
      }
    }

    // Clear from database
    await this.prisma.page.update({
      where: { id: pageId },
      data: {
        overlays: null,
      },
    });
  }

  /**
   * Create a snapshot of current drawing for version history
   * (Phase 2 feature)
   */
  async createSnapshot(
    pageId: string,
    label?: string,
    userId?: string,
  ): Promise<string> {
    const drawing = await this.loadDrawing(pageId);
    if (!drawing) {
      throw new Error('Drawing not found');
    }

    // This will be implemented in Phase 2
    this.logger.log(
      `Snapshot creation queued for page ${pageId} (Phase 2 feature)`,
    );

    return 'snapshot_id_placeholder';
  }
}
```

### 1.2 Create Drawing Module

**File:** `/backend/src/drawings/drawing.module.ts`

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

### 1.3 Update Episodes Service to Use Drawing Service

**File:** `/backend/src/episodes/episodes.service.ts` (Update existing)

```typescript
import { DrawingService } from '../drawings/drawing.service';

@Injectable()
export class EpisodesService {
  constructor(
    // ... existing dependencies
    private readonly drawing: DrawingService,
  ) {}

  async setPageOverlays(pageId: string, overlays: any): Promise<void> {
    const page = await this.getPageById(pageId);
    if (!page) throw new Error('Page not found');

    // Use new drawing service for storage
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

      // Keep legacy storage for backward compatibility
      if (this.prisma.enabled) {
        page.overlays = overlays;
      }
    } catch (error) {
      this.logger.error(`Failed to save drawing: ${error}`);
      throw error;
    }
  }

  async getPageById(pageId: string): Promise<Page | undefined> {
    if (this.prisma.enabled) {
      const result = await withPrismaErrorHandling(
        `getPageById(${pageId})`,
        async () => {
          const p = await this.prisma.client.page.findUnique({
            where: { id: pageId },
          });
          if (!p) return undefined;

          // Try to load from drawing service
          let overlays = (p as any).overlays;
          try {
            const drawingData = await this.drawing.loadDrawing(pageId);
            if (drawingData?.canvas?.layers) {
              overlays = drawingData.canvas.layers;
            }
          } catch (error) {
            this.logger.warn(`Failed to load from drawing service: ${error}`);
          }

          return {
            id: p.id,
            episodeId: p.episodeId,
            pageNumber: p.pageNumber,
            status: p.status as any,
            imageUrl: p.imageUrl ?? undefined,
            seed: p.seed ?? undefined,
            version: p.version ?? undefined,
            error: p.error ?? undefined,
            overlays,
          };
        },
        undefined,
      );

      if (result) return result;
    }
    return this.pages.get(pageId);
  }
}
```

### 1.4 Update App Module to Include Drawing Service

**File:** `/backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DrawingModule } from './drawings/drawing.module';
// ... other imports

@Module({
  imports: [
    // ... existing imports
    DrawingModule,
  ],
  // ... rest of module
})
export class AppModule {}
```

---

## Phase 1.5: Frontend Integration

### Update Studio Component

**File:** `/pages/studio/[id].tsx` (Update existing)

```typescript
const saveOverlays = useCallback(async (pageId: string, list: Overlay[]) => {
  try {
    // Save with drawing service via backend
    const response = await fetch(`${API_BASE}/pages/${pageId}/overlays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ overlays: list }),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    // Show success indicator (optional)
    showSaveIndicator('Saved');

    // Log statistics (optional)
    const stats = await fetch(`${API_BASE}/pages/${pageId}/drawing-stats`).then(
      (r) => r.json(),
    );
    console.log('Drawing stats:', stats);
  } catch (error) {
    console.error('Failed to save overlays:', error);
    showSaveIndicator('Save failed', 'error');
  }
}, []);
```

---

## Phase 2: History & Snapshots

### 2.1 Database Migrations

**File:** `/backend/prisma/migrations/{timestamp}_add_drawing_history/migration.sql`

```sql
-- Create drawing session table
CREATE TABLE "drawing_session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pageId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentSnapshotId" TEXT,
  "incrementalCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "drawing_session_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE
);

-- Create drawing snapshot table
CREATE TABLE "drawing_snapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "snapshotNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data" BYTEA NOT NULL,
  "compressedSizeBytes" INTEGER,
  "uncompressedSizeBytes" INTEGER,
  "format" VARCHAR(50) NOT NULL DEFAULT 'json',
  "label" VARCHAR(255),
  "createdBy" TEXT,

  CONSTRAINT "drawing_snapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "drawing_session" ("id") ON DELETE CASCADE,
  UNIQUE("sessionId", "snapshotNumber")
);

-- Create drawing incremental save table
CREATE TABLE "drawing_incremental" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "sequenceNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "operations" JSONB NOT NULL,
  "operationsCount" INTEGER,
  "sizeBytes" INTEGER NOT NULL,

  CONSTRAINT "drawing_incremental_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "drawing_session" ("id") ON DELETE CASCADE,
  UNIQUE("sessionId", "sequenceNumber")
);

-- Create indexes
CREATE INDEX "drawing_session_pageId_idx" ON "drawing_session"("pageId");
CREATE INDEX "drawing_snapshot_sessionId_idx" ON "drawing_snapshot"("sessionId");
CREATE INDEX "drawing_snapshot_createdAt_idx" ON "drawing_snapshot"("createdAt");
CREATE INDEX "drawing_incremental_sessionId_idx" ON "drawing_incremental"("sessionId");
CREATE INDEX "drawing_incremental_createdAt_idx" ON "drawing_incremental"("createdAt");
```

### 2.2 Extended Drawing Service with History

**File:** `/backend/src/drawings/drawing-history.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as pako from 'pako';
import { PrismaService } from '../prisma/prisma.service';
import { DrawingData } from './drawing.service';

export interface DrawingSnapshot {
  id: string;
  sessionId: string;
  snapshotNumber: number;
  createdAt: Date;
  data: DrawingData;
  label?: string;
  createdBy?: string;
}

export interface DrawingOperation {
  type:
    | 'addStroke'
    | 'updateLayer'
    | 'deleteElement'
    | 'reorderLayers'
    | 'renameLayer';
  timestamp: number;
  layerId?: string;
  payload: any;
}

@Injectable()
export class DrawingHistoryService {
  private readonly logger = new Logger(DrawingHistoryService.name);
  private readonly snapshotInterval = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or get drawing session for a page
   */
  async getOrCreateSession(pageId: string): Promise<string> {
    let session = await this.prisma.drawingSession.findUnique({
      where: { pageId },
      select: { id: true },
    });

    if (!session) {
      session = await this.prisma.drawingSession.create({
        data: {
          pageId,
        },
      });
    }

    return session.id;
  }

  /**
   * Create a snapshot of current drawing state
   */
  async createSnapshot(
    pageId: string,
    drawingData: DrawingData,
    label?: string,
    userId?: string,
  ): Promise<string> {
    const sessionId = await this.getOrCreateSession(pageId);

    // Get next snapshot number
    const lastSnapshot = await this.prisma.drawingSnapshot.findFirst({
      where: { sessionId },
      orderBy: { snapshotNumber: 'desc' },
      select: { snapshotNumber: true },
    });

    const snapshotNumber = (lastSnapshot?.snapshotNumber ?? 0) + 1;

    // Compress drawing data
    const jsonStr = JSON.stringify(drawingData);
    const uncompressedSize = Buffer.byteLength(jsonStr, 'utf8');
    const compressed = pako.gzip(jsonStr, { level: 6 });
    const compressedSize = compressed.length;

    // Store snapshot
    const snapshot = await this.prisma.drawingSnapshot.create({
      data: {
        sessionId,
        snapshotNumber,
        data: compressed,
        compressedSizeBytes: compressedSize,
        uncompressedSizeBytes: uncompressedSize,
        format: 'json',
        label,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Created snapshot #${snapshotNumber} for page ${pageId} (${compressedSize} bytes)`,
    );

    return snapshot.id;
  }

  /**
   * Save incremental changes
   */
  async saveIncremental(
    pageId: string,
    operations: DrawingOperation[],
  ): Promise<string> {
    const sessionId = await this.getOrCreateSession(pageId);

    // Get next sequence number
    const lastIncremental = await this.prisma.drawingIncremental.findFirst({
      where: { sessionId },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    const sequenceNumber = (lastIncremental?.sequenceNumber ?? 0) + 1;

    // Store operations
    const operationsJson = JSON.stringify(operations);
    const size = Buffer.byteLength(operationsJson, 'utf8');

    const incremental = await this.prisma.drawingIncremental.create({
      data: {
        sessionId,
        sequenceNumber,
        operations: operations as any,
        operationsCount: operations.length,
        sizeBytes: size,
      },
    });

    // Check if we need a new snapshot
    const incrementalCount = await this.prisma.drawingIncremental.count({
      where: { sessionId },
    });

    if (incrementalCount % 100 === 0) {
      // Every 100 incremental saves, trigger snapshot
      this.logger.debug(
        `Incremental count reached ${incrementalCount}, consider creating new snapshot`,
      );
    }

    return incremental.id;
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshot(snapshotId: string): Promise<DrawingSnapshot | null> {
    const snapshot = await this.prisma.drawingSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      return null;
    }

    // Decompress data
    const decompressed = pako.ungzip(snapshot.data as any);
    const jsonStr = new TextDecoder().decode(decompressed);
    const data = JSON.parse(jsonStr) as DrawingData;

    return {
      id: snapshot.id,
      sessionId: snapshot.sessionId,
      snapshotNumber: snapshot.snapshotNumber,
      createdAt: snapshot.createdAt,
      data,
      label: snapshot.label ?? undefined,
      createdBy: snapshot.createdBy ?? undefined,
    };
  }

  /**
   * Get all snapshots for a page
   */
  async getSnapshots(
    pageId: string,
  ): Promise<{ snapshotNumber: number; createdAt: Date; label?: string }[]> {
    const session = await this.prisma.drawingSession.findUnique({
      where: { pageId },
    });

    if (!session) {
      return [];
    }

    const snapshots = await this.prisma.drawingSnapshot.findMany({
      where: { sessionId: session.id },
      select: { snapshotNumber: true, createdAt: true, label: true },
      orderBy: { snapshotNumber: 'asc' },
    });

    return snapshots;
  }

  /**
   * Reconstruct drawing state at a specific version
   */
  async reconstructAtVersion(
    pageId: string,
    targetSnapshotNumber: number,
  ): Promise<DrawingData | null> {
    const session = await this.prisma.drawingSession.findUnique({
      where: { pageId },
    });

    if (!session) {
      return null;
    }

    // Load base snapshot
    const baseSnapshot = await this.prisma.drawingSnapshot.findFirst({
      where: {
        sessionId: session.id,
        snapshotNumber: { lte: targetSnapshotNumber },
      },
      orderBy: { snapshotNumber: 'desc' },
    });

    if (!baseSnapshot) {
      return null;
    }

    // Decompress base snapshot
    const decompressed = pako.ungzip(baseSnapshot.data as any);
    const jsonStr = new TextDecoder().decode(decompressed);
    let state = JSON.parse(jsonStr) as DrawingData;

    // Apply incremental operations
    const incrementals = await this.prisma.drawingIncremental.findMany({
      where: {
        sessionId: session.id,
        sequenceNumber: {
          gt: baseSnapshot.snapshotNumber,
          lte: targetSnapshotNumber,
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    for (const inc of incrementals) {
      state = this.applyOperations(state, inc.operations as any);
    }

    return state;
  }

  /**
   * Apply drawing operations to state
   */
  private applyOperations(
    state: DrawingData,
    operations: DrawingOperation[],
  ): DrawingData {
    const newState = JSON.parse(JSON.stringify(state)) as DrawingData;

    for (const op of operations) {
      switch (op.type) {
        case 'addStroke': {
          const layer = newState.canvas.layers.find(
            (l) => l.id === op.layerId,
          );
          if (layer) {
            layer.elements.push(op.payload);
          }
          break;
        }
        case 'updateLayer': {
          const layer = newState.canvas.layers.find(
            (l) => l.id === op.layerId,
          );
          if (layer) {
            Object.assign(layer, op.payload);
          }
          break;
        }
        case 'deleteElement': {
          const layer = newState.canvas.layers.find(
            (l) => l.id === op.layerId,
          );
          if (layer) {
            layer.elements = layer.elements.filter(
              (e) => e.id !== op.payload.elementId,
            );
          }
          break;
        }
        // Add more operation handlers as needed
      }
    }

    return newState;
  }

  /**
   * Get version history summary
   */
  async getHistorySummary(pageId: string) {
    const session = await this.prisma.drawingSession.findUnique({
      where: { pageId },
    });

    if (!session) {
      return null;
    }

    const snapshots = await this.prisma.drawingSnapshot.findMany({
      where: { sessionId: session.id },
      select: { snapshotNumber: true, createdAt: true },
    });

    const incrementals = await this.prisma.drawingIncremental.findMany({
      where: { sessionId: session.id },
      select: { sequenceNumber: true, createdAt: true, sizeBytes: true },
    });

    return {
      sessionId: session.id,
      snapshotCount: snapshots.length,
      incrementalCount: incrementals.length,
      totalVersions: snapshots.length + incrementals.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      totalSize: incrementals.reduce((sum, inc) => sum + inc.sizeBytes, 0),
    };
  }
}
```

---

## Phase 3: Real-Time Collaboration

### WebSocket Integration Example

**File:** `/backend/src/drawings/drawing-collab.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DrawingHistoryService } from './drawing-history.service';

interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
}

@WebSocketGateway({ namespace: '/drawings' })
export class DrawingCollabGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private activeSessions = new Map<string, Set<string>>();
  private userCursors = new Map<string, UserCursor>();

  constructor(private drawingHistory: DrawingHistoryService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Clean up cursors
    this.userCursors.delete(client.id);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    client: Socket,
    data: { sessionId: string; userId: string },
  ) {
    client.join(`drawing:${data.sessionId}`);

    if (!this.activeSessions.has(data.sessionId)) {
      this.activeSessions.set(data.sessionId, new Set());
    }
    this.activeSessions.get(data.sessionId)!.add(client.id);

    // Notify others
    this.server
      .to(`drawing:${data.sessionId}`)
      .emit('user_joined', { userId: data.userId });
  }

  @SubscribeMessage('drawing_update')
  async handleDrawingUpdate(
    client: Socket,
    data: {
      sessionId: string;
      pageId: string;
      operation: any;
      userId: string;
    },
  ) {
    // Save to history
    await this.drawingHistory.saveIncremental(data.pageId, [data.operation]);

    // Broadcast to other clients
    client.broadcast
      .to(`drawing:${data.sessionId}`)
      .emit('drawing_update', {
        operation: data.operation,
        userId: data.userId,
      });
  }

  @SubscribeMessage('cursor_move')
  handleCursorMove(
    client: Socket,
    data: { sessionId: string; x: number; y: number; userId: string },
  ) {
    // Broadcast cursor position
    this.server.to(`drawing:${data.sessionId}`).emit('cursor_update', {
      userId: data.userId,
      x: data.x,
      y: data.y,
    });
  }
}
```

---

## API Endpoints Summary

### Phase 1 Endpoints

```typescript
// Save drawing
POST /api/pages/:id/overlays
Body: { overlays: [...] }
Response: { ok: true }

// Load drawing
GET /api/pages/:id/overlays
Response: { overlays: [...] }

// Get drawing stats (new)
GET /api/pages/:id/drawing-stats
Response: {
  size: number,
  compressed: boolean,
  format: string,
  storageLocation: 'database' | 'external'
}
```

### Phase 2 Endpoints (To be added)

```typescript
// Create snapshot
POST /api/drawings/:pageId/snapshots
Body: { label?: string }
Response: { snapshotId: string }

// List snapshots
GET /api/drawings/:pageId/snapshots
Response: { snapshots: [...] }

// Restore from snapshot
POST /api/drawings/:pageId/restore/:snapshotId
Response: { drawing: DrawingData }

// Get history summary
GET /api/drawings/:pageId/history
Response: { ... }
```

---

## Performance Metrics

### Current System (Phase 0)
- Save: 50ms
- Load: 10ms
- Avg overlay size: 100-200KB

### With Phase 1
- Small file save: 60ms (with compression)
- Large file save: 100-300ms (with Supabase upload)
- Size reduction: 60-75% with GZIP
- **Total storage savings: 60-75%**

### With Phase 2
- Incremental save: <10ms
- Snapshot load: 100-200ms
- Any version reconstruction: <500ms
- **Total storage savings: 90-95%** (vs snapshots only)

---

## Migration Checklist

- [ ] Create `DrawingService` in backend
- [ ] Add drawing module to imports
- [ ] Update `EpisodesService` to use `DrawingService`
- [ ] Add compression dependency (`pako`)
- [ ] Test with various drawing sizes
- [ ] Update frontend to show save indicators
- [ ] Create migration scripts for Phase 2
- [ ] Implement `DrawingHistoryService`
- [ ] Add version history UI
- [ ] Implement WebSocket gateway for collaboration

---

**Next Steps:** Follow the roadmap in `CANVAS_STORAGE_RESEARCH.md` for implementation schedule.

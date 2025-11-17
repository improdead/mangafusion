# Performance Implementation Examples for MangaFusion

## Quick Start: Performance Optimization for Manga Page Display

This guide provides ready-to-use code snippets for integrating performance optimizations into the MangaFusion application.

---

## 1. Canvas-Based Image Viewer Component

```typescript
// components/MangaPageViewer.tsx
import React, { useEffect, useRef, useState } from 'react';

interface MangaPageViewerProps {
  pageUrl: string;
  pageNumber: number;
  width?: number;
  height?: number;
  onLoadComplete?: () => void;
}

export const MangaPageViewer: React.FC<MangaPageViewerProps> = ({
  pageUrl,
  pageNumber,
  width = 1024,
  height = 1536,
  onLoadComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPage = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');

        setIsLoading(true);

        // Use async image decoding for non-blocking rendering
        const img = new Image();
        img.decoding = 'async';

        // Create promise for image load
        const imgLoaded = new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${pageUrl}`));
        });

        img.src = pageUrl;
        await imgLoaded;

        // Draw to canvas
        ctx.drawImage(img, 0, 0, width, height);

        setIsLoading(false);
        onLoadComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pageUrl, width, height, onLoadComplete]);

  return (
    <div className="manga-page-viewer">
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-spinner">Loading page {pageNumber}...</div>}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="manga-canvas"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      />
    </div>
  );
};
```

---

## 2. Optimized Thumbnail Generation with Worker

```typescript
// lib/thumbnail-worker.ts
// This runs in a Web Worker

interface ThumbnailRequest {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
}

self.onmessage = async (event: MessageEvent<ThumbnailRequest>) => {
  const { id, imageUrl, width, height } = event.data;

  try {
    // Fetch and decode image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    // Create offscreen canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Context unavailable');

    // Draw with aspect ratio preservation
    const imgRatio = bitmap.width / bitmap.height;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    }

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw image
    ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    // Convert to blob and send back
    const resultBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.85
    });

    self.postMessage({
      id,
      success: true,
      blob: resultBlob
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// lib/ThumbnailService.ts
export class ThumbnailService {
  private worker: Worker;
  private pendingRequests = new Map<string, Promise<Blob>>();

  constructor() {
    this.worker = new Worker(new URL('./thumbnail-worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event) => {
      const { id, success, blob, error } = event.data;
      const resolve = this.pendingRequests.get(id);
      if (resolve) {
        if (success) {
          (resolve as any)(blob);
        } else {
          throw new Error(error);
        }
      }
    };
  }

  async generateThumbnail(
    imageUrl: string,
    width: number = 256,
    height: number = 384
  ): Promise<Blob> {
    const id = `${Date.now()}-${Math.random()}`;

    const promise = new Promise<Blob>((resolve) => {
      this.pendingRequests.set(id, resolve as any);
    });

    this.worker.postMessage({ id, imageUrl, width, height });

    return promise;
  }

  async generateBatch(
    imageUrls: string[],
    width: number = 256,
    height: number = 384
  ): Promise<Blob[]> {
    return Promise.all(
      imageUrls.map(url => this.generateThumbnail(url, width, height))
    );
  }
}
```

---

## 3. Viewport-Aware Page Loader

```typescript
// lib/ViewportPageLoader.ts
import { useEffect, useState } from 'react';

interface PageLoadConfig {
  pageHeight: number;
  maxCachedPages: number;
  preloadThreshold: number; // Pixel distance to preload
}

export class ViewportPageLoader {
  private pageCache = new Map<number, Blob>();
  private visiblePages = new Set<number>();
  private preloadQueue = new Set<number>();
  private config: PageLoadConfig;
  private scrollTop = 0;

  constructor(config: PageLoadConfig) {
    this.config = config;
  }

  updateScroll(scrollTop: number) {
    this.scrollTop = scrollTop;
    this.updateVisiblePages();
  }

  private updateVisiblePages() {
    const viewportHeight = window.innerHeight;

    // Calculate visible pages
    const visibleStart = Math.max(
      0,
      Math.floor((this.scrollTop - this.config.preloadThreshold) / this.config.pageHeight)
    );

    const visibleEnd = Math.ceil(
      (this.scrollTop + viewportHeight + this.config.preloadThreshold) / this.config.pageHeight
    );

    this.visiblePages.clear();
    this.preloadQueue.clear();

    // Immediately visible pages (high priority)
    for (let i = visibleStart; i <= visibleEnd; i++) {
      this.visiblePages.add(i);
      if (!this.pageCache.has(i)) {
        this.preloadQueue.add(i);
      }
    }

    // Preload next page
    const nextPage = visibleEnd + 1;
    if (!this.pageCache.has(nextPage)) {
      this.preloadQueue.add(nextPage);
    }

    // Clear cache beyond limit
    this.trimCache();
  }

  private trimCache() {
    if (this.pageCache.size <= this.config.maxCachedPages) return;

    const centerPage = Math.floor(
      this.scrollTop / this.config.pageHeight + window.innerHeight / this.config.pageHeight / 2
    );

    const pagesToKeep: number[] = [];
    for (let i = Math.max(0, centerPage - 2); i <= centerPage + 2; i++) {
      pagesToKeep.push(i);
    }

    const pagesToDelete: number[] = [];
    this.pageCache.forEach((_, pageNum) => {
      if (!pagesToKeep.includes(pageNum)) {
        pagesToDelete.push(pageNum);
      }
    });

    // Keep removing until at limit
    while (this.pageCache.size > this.config.maxCachedPages && pagesToDelete.length > 0) {
      const pageToRemove = pagesToDelete.shift();
      if (pageToRemove !== undefined) {
        this.pageCache.delete(pageToRemove);
      }
    }
  }

  getVisiblePages(): number[] {
    return Array.from(this.visiblePages).sort((a, b) => a - b);
  }

  getPreloadQueue(): number[] {
    return Array.from(this.preloadQueue).sort((a, b) => a - b);
  }

  cachePage(pageNum: number, blob: Blob) {
    this.pageCache.set(pageNum, blob);
    this.preloadQueue.delete(pageNum);
  }

  getPage(pageNum: number): Blob | undefined {
    return this.pageCache.get(pageNum);
  }

  clear() {
    this.pageCache.clear();
    this.visiblePages.clear();
    this.preloadQueue.clear();
  }
}

// Hook for React integration
export function useViewportPageLoader(config: PageLoadConfig) {
  const [loader] = useState(() => new ViewportPageLoader(config));
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [preloadQueue, setPreloadQueue] = useState<number[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      loader.updateScroll(window.scrollY);
      setVisiblePages(loader.getVisiblePages());
      setPreloadQueue(loader.getPreloadQueue());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loader]);

  return { loader, visiblePages, preloadQueue };
}
```

---

## 4. Event Throttling & Debouncing Utilities

```typescript
// lib/performance-utils.ts
type CallableFunction = (...args: any[]) => any;

export class EventOptimizer {
  /**
   * Throttle function execution to maximum once per interval
   * Useful for: scroll, mousemove, resize (continuous events)
   */
  static throttle<T extends CallableFunction>(
    fn: T,
    limit: number
  ): T {
    let inThrottle: boolean = false;

    return (function (...args: any[]) {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    }) as T;
  }

  /**
   * Throttle using requestAnimationFrame for smooth 60FPS
   * Useful for: render updates, animation frames
   */
  static rafThrottle<T extends CallableFunction>(fn: T): T {
    let rafId: number | null = null;

    return (function (...args: any[]) {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          fn(...args);
          rafId = null;
        });
      }
    }) as T;
  }

  /**
   * Debounce function execution until after a delay of inactivity
   * Useful for: resize, search input, form submission
   */
  static debounce<T extends CallableFunction>(
    fn: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout;

    return (function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  /**
   * Debounce with immediate execution option
   */
  static debounceImmediate<T extends CallableFunction>(
    fn: T,
    delay: number,
    immediate: boolean = false
  ): T {
    let timeoutId: NodeJS.Timeout;

    return (function (...args: any[]) {
      const callNow = immediate && !timeoutId;

      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        if (!immediate) fn(...args);
      }, delay);

      if (callNow) fn(...args);
    }) as T;
  }

  /**
   * Leading throttle - execute immediately on first call
   */
  static throttleLeading<T extends CallableFunction>(
    fn: T,
    limit: number
  ): T {
    let lastCall = 0;

    return (function (...args: any[]) {
      const now = Date.now();

      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      }
    }) as T;
  }

  /**
   * Trailing throttle - execute after delay of inactivity
   */
  static throttleTrailing<T extends CallableFunction>(
    fn: T,
    limit: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: any[] = [];

    return (function (...args: any[]) {
      lastArgs = args;

      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          fn(...lastArgs);
          timeoutId = null;
        }, limit);
      }
    }) as T;
  }
}

// Usage examples
export const Example = {
  // Throttle scroll events to max 16.67ms intervals (60FPS)
  throttledScroll: EventOptimizer.throttle(() => {
    console.log('Scroll event');
  }, 16.67),

  // RAF throttle for smooth animation
  rafScroll: EventOptimizer.rafThrottle(() => {
    console.log('RAF scroll');
  }),

  // Debounce window resize
  debouncedResize: EventOptimizer.debounce(() => {
    console.log('Resize complete');
  }, 250),

  // Debounce search input
  debouncedSearch: EventOptimizer.debounce((query: string) => {
    console.log('Search:', query);
  }, 300),
};
```

---

## 5. Memory Management with Canvas Pool

```typescript
// lib/CanvasPool.ts
export class CanvasPool {
  private pool: HTMLCanvasElement[] = [];
  private contextCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  private maxPoolSize = 5;

  acquire(width: number, height: number): HTMLCanvasElement {
    // Try to find matching canvas in pool
    const index = this.pool.findIndex(
      c => c.width === width && c.height === height
    );

    if (index !== -1) {
      const [canvas] = this.pool.splice(index, 1);
      return canvas;
    }

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  release(canvas: HTMLCanvasElement) {
    // Clear canvas to free memory
    const ctx = this.contextCache.get(canvas);
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Return to pool if space available
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(canvas);
    }
  }

  getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    let ctx = this.contextCache.get(canvas);
    if (!ctx) {
      ctx = canvas.getContext('2d')!;
      this.contextCache.set(canvas, ctx);
    }
    return ctx;
  }

  clear() {
    this.pool = [];
    this.contextCache = new WeakMap();
  }

  getPoolStats() {
    return {
      poolSize: this.pool.length,
      maxPoolSize: this.maxPoolSize,
      memory: this.pool.reduce((sum, canvas) => {
        return sum + (canvas.width * canvas.height * 4) / 1024 / 1024;
      }, 0),
    };
  }
}

// Usage in React component
export function useCanvasPool(maxSize: number = 5) {
  const poolRef = useRef(new CanvasPool());

  useEffect(() => {
    const pool = poolRef.current;

    // Monitor memory usage
    const interval = setInterval(() => {
      const stats = pool.getPoolStats();
      console.log(`Canvas pool: ${stats.poolSize}/${stats.maxPoolSize}, Memory: ${stats.memory.toFixed(2)}MB`);
    }, 10000);

    return () => {
      clearInterval(interval);
      pool.clear();
    };
  }, []);

  return poolRef.current;
}
```

---

## 6. Memory Monitoring Hook

```typescript
// lib/useMemoryMonitor.ts
import { useEffect, useState } from 'react';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
}

export function useMemoryMonitor(intervalMs: number = 5000) {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [history, setHistory] = useState<MemoryStats[]>([]);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;

        const newStats: MemoryStats = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };

        setStats(newStats);
        setHistory(prev => [...prev.slice(-59), newStats]); // Keep last 60 samples
      }
    };

    const interval = setInterval(checkMemory, intervalMs);
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    stats,
    history,
    isHighUsage: stats ? stats.usagePercent > 85 : false,
    isCritical: stats ? stats.usagePercent > 95 : false,
  };
}

// Usage component
export function MemoryMonitorDisplay() {
  const { stats, isHighUsage, isCritical } = useMemoryMonitor(5000);

  if (!stats) return null;

  return (
    <div className={`memory-monitor ${isCritical ? 'critical' : isHighUsage ? 'warning' : ''}`}>
      <div>Used: {(stats.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
      <div>Total: {(stats.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
      <div>Limit: {(stats.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB</div>
      <div>Usage: {stats.usagePercent.toFixed(1)}%</div>
    </div>
  );
}
```

---

## 7. Image Format Optimization

```typescript
// lib/ImageOptimizer.ts
export class ImageOptimizer {
  /**
   * Get optimal image format supported by browser
   */
  static getSupportedFormat(): 'webp' | 'jpeg' | 'png' {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const webpSupported = canvas.toDataURL('image/webp').includes('webp');
    return webpSupported ? 'webp' : 'jpeg';
  }

  /**
   * Convert image to optimal format with compression
   */
  static async optimizeImage(
    sourceUrl: string,
    width: number = 1024,
    height: number = 1536,
    quality: number = 0.85
  ): Promise<{ url: string; format: string; sizeKB: number }> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Load source image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = sourceUrl;
    });

    // Draw with aspect ratio preservation
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Try formats in order of preference
    let bestBlob: Blob | null = null;
    let bestFormat = 'png';

    // Try WebP
    try {
      const webpBlob = await new Promise<Blob>(resolve => {
        canvas.toBlob(resolve, 'image/webp', quality);
      });

      if (!bestBlob || webpBlob.size < bestBlob.size) {
        bestBlob = webpBlob;
        bestFormat = 'webp';
      }
    } catch {}

    // Try JPEG
    try {
      const jpegBlob = await new Promise<Blob>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });

      if (!bestBlob || jpegBlob.size < bestBlob.size) {
        bestBlob = jpegBlob;
        bestFormat = 'jpeg';
      }
    } catch {}

    // Fallback to PNG
    if (!bestBlob) {
      bestBlob = await new Promise<Blob>(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
    }

    const url = URL.createObjectURL(bestBlob);
    const sizeKB = bestBlob.size / 1024;

    return { url, format: bestFormat, sizeKB };
  }
}

// Usage
const optimized = await ImageOptimizer.optimizeImage(
  '/api/manga/page/1.png',
  1024,
  1536,
  0.85
);
console.log(`Optimized to ${optimized.format} (${optimized.sizeKB.toFixed(1)}KB)`);
```

---

## 8. Progressive Image Rendering

```typescript
// components/ProgressiveImage.tsx
import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  lowResSrc?: string;
  highResSrc: string;
  width: number;
  height: number;
  onLoadComplete?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  lowResSrc,
  highResSrc,
  width,
  height,
  onLoadComplete
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [quality, setQuality] = useState<'low' | 'high'>('low');

  useEffect(() => {
    const renderProgressively = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Render low-res placeholder
      if (lowResSrc) {
        const lowResImg = new Image();
        lowResImg.decoding = 'async';

        await new Promise<void>(resolve => {
          lowResImg.onload = () => {
            ctx.drawImage(lowResImg, 0, 0, width, height);
            resolve();
          };
          lowResImg.src = lowResSrc;
        });
      }

      // Render high-res
      const highResImg = new Image();
      highResImg.decoding = 'async';

      await new Promise<void>(resolve => {
        highResImg.onload = async () => {
          // Use createImageBitmap for non-blocking decoding
          const bitmap = await createImageBitmap(highResImg);
          ctx.drawImage(bitmap, 0, 0, width, height);
          setQuality('high');
          resolve();
        };
        highResImg.src = highResSrc;
      });

      onLoadComplete?.();
    };

    renderProgressively();
  }, [lowResSrc, highResSrc, width, height, onLoadComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`progressive-image progressive-${quality}`}
      style={{
        filter: quality === 'low' ? 'blur(8px)' : 'none',
        transition: 'filter 0.3s ease-in',
      }}
    />
  );
};
```

---

## 9. Integration Example: Full Manga Viewer

```typescript
// pages/manga-reader.tsx
import React, { useState, useCallback } from 'react';
import { MangaPageViewer } from '@/components/MangaPageViewer';
import { useViewportPageLoader } from '@/lib/ViewportPageLoader';
import { useMemoryMonitor } from '@/lib/useMemoryMonitor';
import { EventOptimizer } from '@/lib/performance-utils';

const MANGA_CONFIG = {
  pageWidth: 1024,
  pageHeight: 1536,
  maxCachedPages: 5,
  preloadThreshold: 500,
};

export default function MangaReader() {
  const { loader, visiblePages, preloadQueue } = useViewportPageLoader(MANGA_CONFIG);
  const { stats: memoryStats } = useMemoryMonitor(5000);
  const [totalPages] = useState(100);

  // Throttle scroll handler
  const handleScroll = EventOptimizer.rafThrottle(() => {
    loader.updateScroll(window.scrollY);
  });

  // Preload pages as needed
  const preloadPages = useCallback(async () => {
    const queue = preloadQueue.slice(0, 2); // Load max 2 pages at a time

    for (const pageNum of queue) {
      try {
        const response = await fetch(`/api/manga/page/${pageNum}`);
        const blob = await response.blob();
        loader.cachePage(pageNum, blob);
      } catch (error) {
        console.error(`Failed to preload page ${pageNum}:`, error);
      }
    }
  }, [preloadQueue, loader]);

  React.useEffect(() => {
    preloadPages();
  }, [preloadPages]);

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="manga-reader">
      <header>
        <h1>Manga Reader</h1>
        {memoryStats && (
          <div className="memory-info">
            Memory: {(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB /
            {(memoryStats.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB
          </div>
        )}
      </header>

      <main>
        {visiblePages.map(pageNum => (
          <MangaPageViewer
            key={pageNum}
            pageNumber={pageNum + 1}
            pageUrl={`/api/manga/page/${pageNum}`}
            width={MANGA_CONFIG.pageWidth}
            height={MANGA_CONFIG.pageHeight}
          />
        ))}

        {preloadQueue.length > 0 && (
          <div className="preload-status">
            Preloading: {preloadQueue.length} pages
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## Performance Checklist

Use this checklist to verify all optimizations are in place:

- [ ] Async image decoding enabled (`decoding="async"`)
- [ ] Event throttling/debouncing implemented
- [ ] Canvas pooling for reusable canvases
- [ ] Viewport culling for multi-page display
- [ ] Worker pool for thumbnail generation
- [ ] Memory monitoring and alerts
- [ ] Image format optimization (WebP fallback)
- [ ] Progressive rendering for initial page
- [ ] Lazy loading for offscreen pages
- [ ] Performance metrics collection

---

## Testing Performance

```bash
# Monitor performance during development
npm run performance:test

# Generate performance report
npm run performance:report

# Profile memory usage
npm run profile:memory
```

---

## Reference Implementation

All code examples in this guide follow these principles:
1. **Non-blocking**: Use async/await, workers, RAF
2. **Memory efficient**: Reuse objects, limit caches
3. **Responsive**: Throttle high-frequency events
4. **Measurable**: Include metrics and monitoring
5. **Fallback**: Handle unsupported APIs gracefully


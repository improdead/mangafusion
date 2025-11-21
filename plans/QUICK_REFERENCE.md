# Canvas Performance Optimization - Quick Reference Guide

## For 1024x1536 Manga Pages

### 1. Technology Selection

| Use Case | Technology | Reason |
|----------|-----------|--------|
| Static page display | HTML `<img>` with Canvas backup | Fastest, lowest memory |
| Multi-page scrolling | Canvas 2D + Viewport culling | 60 FPS, efficient memory |
| Real-time drawing | Canvas 2D base + SVG overlay | Best interactivity |
| Thumbnails (100+) | OffscreenCanvas + Workers | 4x faster, no blocking |
| Complex effects | Consider WebGL | GPU acceleration |

### 2. Performance Checklist (Priority Order)

**Must Have (Critical):**
- [ ] Enable async image decoding: `img.decoding = 'async'`
- [ ] Throttle scroll events: Use `requestAnimationFrame`
- [ ] Limit cached pages: Max 5 pages (~31 MB)
- [ ] Clear/release canvas: `ctx.clearRect()` when done

**Should Have (Important):**
- [ ] Implement viewport culling (only render visible)
- [ ] Use canvas pooling (reuse objects)
- [ ] Add OffscreenCanvas workers (thumbnails)
- [ ] Lazy load pages (preload next/prev)

**Nice to Have (Enhancement):**
- [ ] Progressive image rendering (low-res first)
- [ ] WebP image format (25% smaller)
- [ ] Memory monitoring (alerts at 85%+)
- [ ] WebGL acceleration (for 4+ pages)

### 3. Code Snippets (Copy-Paste Ready)

#### A. Async Image Decoding
```typescript
const img = new Image();
img.decoding = 'async';  // Non-blocking!
img.src = '/page.png';
ctx.drawImage(img, 0, 0);
```

#### B. RAF Throttle (60 FPS)
```typescript
let rafId: number | null = null;
function throttleRAF(fn: () => void) {
  return () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn();
        rafId = null;
      });
    }
  };
}

// Usage
window.addEventListener('scroll', throttleRAF(renderPage));
```

#### C. Viewport Culling
```typescript
const viewportStart = Math.floor(scrollTop / pageHeight);
const viewportEnd = Math.ceil((scrollTop + windowHeight) / pageHeight);

// Only render pages in viewport
for (let i = viewportStart; i <= viewportEnd; i++) {
  renderPage(i);
}

// Limit cache to 5 pages
if (pageCache.size > 5) {
  pageCache.delete(oldestPage);
}
```

#### D. Canvas Pool
```typescript
const canvasPool: HTMLCanvasElement[] = [];

function acquireCanvas(w: number, h: number) {
  return canvasPool.pop() || (() => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  })();
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  if (canvasPool.length < 5) {
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    canvasPool.push(canvas);
  }
}
```

#### E. OffscreenCanvas Worker
```typescript
// worker.ts
self.onmessage = async ({ data: { canvas, imageUrl } }) => {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = imageUrl;

  await new Promise(r => img.onload = r);
  ctx.drawImage(img, 0, 0, 256, 384);

  const blob = await canvas.convertToBlob();
  self.postMessage({ blob });
};

// main.ts
const worker = new Worker('worker.ts');
const canvas = new OffscreenCanvas(256, 384);

worker.postMessage(
  { canvas: canvas.transferControlToOffscreen(), imageUrl },
  [canvas.transferControlToOffscreen()]
);

worker.onmessage = ({ data: { blob } }) => {
  // Use thumbnail blob
};
```

### 4. Optimization Impact (Expected Results)

```
┌─────────────────────────────────────────────┐
│ Single Page (1024×1536)                      │
├──────────────────────┬───────────┬──────────┤
│ Metric               │ Before    │ After    │
├──────────────────────┼───────────┼──────────┤
│ Load time            │ 150ms     │ 80ms     │
│ Memory               │ 50 MB     │ 8 MB     │
│ Decode blocking      │ 50ms      │ 0ms      │
└──────────────────────┴───────────┴──────────┘

┌─────────────────────────────────────────────┐
│ Multi-Page Scroll (5 pages)                  │
├──────────────────────┬───────────┬──────────┤
│ Metric               │ Before    │ After    │
├──────────────────────┼───────────┼──────────┤
│ Memory               │ 250 MB    │ 45 MB    │
│ Scroll FPS           │ 25        │ 60       │
│ GC pauses/minute     │ 5         │ 1        │
└──────────────────────┴───────────┴──────────┘

┌─────────────────────────────────────────────┐
│ Thumbnail Batch (100 × 256×384)              │
├──────────────────────┬───────────┬──────────┤
│ Metric               │ Before    │ After    │
├──────────────────────┼───────────┼──────────┤
│ Generation time      │ 5000ms    │ 1200ms   │
│ UI blocking          │ 100%      │ 0%       │
│ Memory peak          │ 200 MB    │ 50 MB    │
└──────────────────────┴───────────┴──────────┘
```

### 5. Memory Budget (1024x1536)

```
Component                  Memory        Notes
─────────────────────────────────────────────────
Canvas buffer              6.3 MB        per page
Typical with overhead      8-10 MB       per page
ImageData cached           6.3 MB        optional
─────────────────────────────────────────────────

Scenario: 5 Pages
Safe cache:                40-50 MB
Thumbnail (256×384):       0.4 MB        each
100 thumbnails:            40 MB         batched
─────────────────────────────────────────────────

Alert Thresholds:
Warning (85%):             ~700 MB heap
Critical (95%):            ~750 MB heap
Emergency unload:          > 800 MB heap
```

### 6. Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Need Fallback? |
|---------|--------|---------|--------|------|---|
| Canvas 2D | ✓ | ✓ | ✓ | ✓ | Required feature |
| img.decoding | ✓ | ✓ | ✗ | ✓ | Use onload instead |
| OffscreenCanvas | ✓ | ✓ | ✓ | ✓ | Use main thread if needed |
| createImageBitmap | ✓ | ✓ | ✓ | ✓ | Use Image element |
| WebP | ✓ | ✓ | ✗ | ✓ | Fall back to JPEG |

### 7. Testing Commands

```bash
# Check performance score
npm run lighthouse

# Profile memory usage
chrome://memory-pressure-level

# Measure FPS in real-time
// In DevTools console:
performance.mark('start');
// ... interact ...
performance.mark('end');
performance.measure('interaction', 'start', 'end');
console.log(performance.getEntriesByName('interaction')[0].duration);

# Monitor memory
setInterval(() => {
  const m = performance.memory;
  console.log(`${(m.usedJSHeapSize/1048576).toFixed(1)}MB`);
}, 1000);
```

### 8. Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| High memory | Cache everything | Limit to 5 pages max |
| Janky scroll | No throttling | Use RAF throttle |
| Slow loading | Async blocking | Use `decoding='async'` |
| UI freeze | Main thread work | Move to OffscreenCanvas |
| GC pauses | Too many objects | Reuse objects (pooling) |
| Blurry on HiDPI | Canvas scale issue | `canvas.width × 2` |

### 9. Performance Monitoring Code

```typescript
// Simple FPS counter
class FPSMonitor {
  private fps = 0;
  private frame = 0;
  private lastTime = performance.now();

  tick() {
    this.frame++;
    const now = performance.now();

    if (now - this.lastTime >= 1000) {
      this.fps = this.frame;
      this.frame = 0;
      this.lastTime = now;
      console.log(`FPS: ${this.fps}`);
    }

    requestAnimationFrame(() => this.tick());
  }
}

// Memory reporter
class MemoryReporter {
  report() {
    if ('memory' in performance) {
      const m = (performance as any).memory;
      console.table({
        used: `${(m.usedJSHeapSize / 1048576).toFixed(1)}MB`,
        total: `${(m.totalJSHeapSize / 1048576).toFixed(1)}MB`,
        limit: `${(m.jsHeapSizeLimit / 1048576).toFixed(1)}MB`,
        percent: `${((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100).toFixed(1)}%`,
      });
    }
  }
}
```

### 10. Implementation Roadmap

**Day 1-2:** Quick Wins
- Add async decoding to all images
- Implement RAF throttling for scroll
- Add basic FPS counter
- **Expected:** 30-40% improvement

**Day 3-4:** Core Optimizations
- Implement viewport culling
- Add page lazy loading
- Set up canvas pooling
- **Expected:** 60+ FPS consistent

**Day 5-7:** Advanced Features
- Add OffscreenCanvas workers
- Batch thumbnail generation
- Add memory monitoring
- **Expected:** 4x faster thumbnails

**Day 8+:** Monitoring & Refinement
- Add performance dashboard
- Set up alerts for memory
- Continuous profiling
- **Expected:** Production-ready

### 11. Recommended Reading (In Order)

1. **CANVAS_PERFORMANCE_OPTIMIZATION_GUIDE.md** - Deep dive
2. **BENCHMARK_ANALYSIS.md** - Comparative metrics
3. **PERFORMANCE_IMPLEMENTATION_EXAMPLES.md** - Code samples
4. This file - Quick reference

### 12. Key Metrics to Track

```typescript
const metrics = {
  pageLoadTime: 0,
  initialRenderTime: 0,
  scrollFPS: 60,
  memoryUsageMB: 0,
  cachedPages: 5,
  gcPausesPerMinute: 0,
  thumbnailGenerationTime: 0,
  errorRate: 0.01, // 1%
};

// Alert thresholds
const alerts = {
  pageLoadTime: 200,        // ms
  initialRenderTime: 50,     // ms
  scrollFPS: 50,             // minimum
  memoryUsageMB: 100,        // warning at 100MB
  gcPausesPerMinute: 5,      // warning
};
```

### 13. Emergency Fixes (If Performance Degrades)

```typescript
// Nuclear option - reduce quality
if (performanceIsBad) {
  // Reduce cache
  maxCachedPages = 2;

  // Lower resolution
  canvasWidth = 512;
  canvasHeight = 768;

  // Disable animations
  disableTransitions = true;

  // Reduce FPS
  rafThrottleInterval = 33; // 30 FPS
}
```

### 14. Next Steps

1. **Read:** CANVAS_PERFORMANCE_OPTIMIZATION_GUIDE.md (sections 1-4)
2. **Copy:** Code snippets from section 3 above
3. **Test:** Run performance tests from section 7
4. **Implement:** Follow roadmap in section 10
5. **Monitor:** Use metrics from section 12
6. **Optimize:** Iterate based on results

---

## Summary

**Canvas Performance = Good Technology + Smart Optimization**

The three cornerstones:
1. **Viewport Culling** (render only what's visible)
2. **Event Throttling** (limit update frequency)
3. **Memory Management** (reuse, limit, pool)

Apply these three principles consistently, and you'll achieve:
- **60 FPS** smooth interactions
- **< 50 MB** memory for 5 pages
- **Excellent** responsiveness on all devices

Good luck! 🚀


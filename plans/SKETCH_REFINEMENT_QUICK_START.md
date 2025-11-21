# Sketch Refinement Quick Start Guide
## Fast-Track Implementation for MangaFusion

**Version:** 1.0
**Date:** 2025-11-17
**Audience:** Developers implementing sketch refinement features

---

## 1. Prerequisites Checklist

```
REQUIRED:
☐ MangaFusion backend running (NestJS)
☐ Segmind API key (register at segmind.com)
☐ Supabase storage configured
☐ PostgreSQL database (optional but recommended)
☐ Node.js 18+ and npm

OPTIONAL:
☐ Redis for caching
☐ Replicate API key (backup provider)
☐ Gemini API key (already configured)
☐ Leonardo AI account (premium quality)
```

---

## 2. Environment Setup (5 minutes)

### Backend Configuration

```bash
# backend/.env

# Existing
GEMINI_API_KEY=your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key

# NEW: Segmind Integration
SEGMIND_API_KEY=your-segmind-api-key
REFINE_PROVIDER=segmind  # Primary provider

# Optional: Backup providers
REPLICATE_API_KEY=your-replicate-key
FALLBACK_PROVIDER=replicate

# Optional: Caching
REDIS_URL=redis://localhost:6379
```

### Database Schema (Prisma)

```bash
# Add to schema.prisma
cat >> backend/prisma/schema.prisma << 'EOF'

model RefinementVersion {
  id              String  @id @default(cuid())
  pageId          String
  version         Int
  imageUrl        String
  seedSketch      String
  prompt          String
  style           String
  guidanceScale   Float
  strength        Float
  seed            Int
  processingTime  Int
  createdAt       DateTime @default(now())
}

model InpaintOperation {
  id        String   @id @default(cuid())
  pageId    String
  maskUrl   String
  prompt    String
  strength  Float
  resultUrl String
  createdAt DateTime @default(now())
}
EOF

# Run migration
npm run prisma:migrate -- --name add-refinement-tables
```

---

## 3. Backend Implementation (1-2 hours)

### Step 1: Create Refinement Service

```bash
# Generate new module
nest g module refine
nest g service refine/refine
nest g controller refine/refine
nest g service refine/providers/segmind
```

### Step 2: Implement Core Service

```typescript
// backend/src/refine/refine.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { SegmindService } from './providers/segmind.service';

@Injectable()
export class RefineService {
  private readonly logger = new Logger(RefineService.name);

  constructor(private segmind: SegmindService) {}

  async refineSketch(sketchBase64: string, prompt: string) {
    this.logger.log(`Refining sketch, prompt: ${prompt.substring(0, 50)}...`);

    const result = await this.segmind.refineSketch({
      sketchImage: sketchBase64,
      prompt: `Convert to manga: ${prompt}`,
      guidanceScale: 7.5,
    });

    return result;
  }

  async inpaintRegion(originalBase64: string, maskBase64: string, prompt: string) {
    return this.segmind.inpaintRegion({
      originalImage: originalBase64,
      maskImage: maskBase64,
      prompt,
    });
  }
}
```

### Step 3: Implement Segmind Provider

```typescript
// backend/src/refine/providers/segmind.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SegmindService {
  private readonly apiKey = process.env.SEGMIND_API_KEY;
  private readonly baseUrl = 'https://api.segmind.com/v1';
  private readonly logger = new Logger(SegmindService.name);

  async refineSketch(request: {
    sketchImage: string;
    prompt: string;
    guidanceScale?: number;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sd-controlnet-scribble-sdxl`,
        {
          sketch_image: request.sketchImage.split(',')[1], // Remove data:image/png;base64,
          prompt: request.prompt,
          guidance_scale: request.guidanceScale || 7.5,
          control_strength: 0.9,
          num_outputs: 1,
          num_inference_steps: 30,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        },
      );

      if (!response.data?.images?.[0]) {
        throw new Error('No image from Segmind');
      }

      return {
        imageBase64: response.data.images[0],
        seed: response.data.seed || 0,
      };
    } catch (error) {
      this.logger.error('Segmind request failed:', error.message);
      throw error;
    }
  }

  async inpaintRegion(request: {
    originalImage: string;
    maskImage: string;
    prompt: string;
  }) {
    const response = await axios.post(
      `${this.baseUrl}/sd-controlnet-inpaint-sdxl`,
      {
        image: request.originalImage.split(',')[1],
        mask: request.maskImage.split(',')[1],
        prompt: request.prompt,
        guidance_scale: 7.5,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
        },
      },
    );

    return {
      imageBase64: response.data.images[0],
    };
  }
}
```

### Step 4: Create Controller Endpoints

```typescript
// backend/src/refine/refine.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { RefineService } from './refine.service';

@Controller('api/refine')
export class RefineController {
  constructor(private refine: RefineService) {}

  @Post('sketch')
  async refineSketch(
    @Body() body: { sketch: string; prompt: string }
  ) {
    const result = await this.refine.refineSketch(body.sketch, body.prompt);

    // TODO: Upload to Supabase
    const imageUrl = await this.uploadToSupabase(result.imageBase64);

    return {
      success: true,
      imageUrl,
      seed: result.seed,
    };
  }

  @Post('inpaint')
  async inpaintRegion(
    @Body() body: { originalImage: string; maskImage: string; prompt: string }
  ) {
    const result = await this.refine.inpaintRegion(
      body.originalImage,
      body.maskImage,
      body.prompt,
    );

    const imageUrl = await this.uploadToSupabase(result.imageBase64);

    return {
      success: true,
      imageUrl,
    };
  }

  private async uploadToSupabase(base64: string): Promise<string> {
    // Implement Supabase upload
    // Return public URL
    return 'https://...'; // Placeholder
  }
}
```

### Step 5: Update App Module

```typescript
// backend/src/app.module.ts

import { RefineModule } from './refine/refine.module';

@Module({
  imports: [
    RefineModule, // ADD THIS
    EpisodesModule,
    // ... rest
  ],
})
export class AppModule {}
```

---

## 4. Frontend Implementation (1-2 hours)

### Step 1: Create Sketch Canvas Component

```typescript
// pages/studio/components/SketchCanvas.tsx

import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

export function SketchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 768,
      height: 1024,
      backgroundColor: 'white',
    });

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = 'black';
    canvas.freeDrawingBrush.width = 2;

    fabricCanvasRef.current = canvas;

    return () => canvas.dispose();
  }, []);

  const handleRefine = async () => {
    if (!fabricCanvasRef.current) return;

    const sketchBlob = await new Promise<Blob>(resolve =>
      fabricCanvasRef.current!.toBlob(resolve, 'image/png'),
    );

    const sketchBase64 = await blobToBase64(sketchBlob);

    const response = await fetch('/api/refine/sketch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sketch: sketchBase64,
        prompt: 'manga illustration, clean linework, detailed',
      }),
    });

    const result = await response.json();
    console.log('Refined image:', result.imageUrl);
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
      <button onClick={handleRefine}>Refine Sketch</button>
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### Step 2: Create Comparison Viewer

```typescript
// pages/studio/components/ComparisonViewer.tsx

interface ComparisonViewerProps {
  originalUrl: string;
  refinedUrl: string;
}

export function ComparisonViewer({ originalUrl, refinedUrl }: ComparisonViewerProps) {
  const [mode, setMode] = useState<'split' | 'slider'>('split');

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setMode('split')}>Split View</button>
        <button onClick={() => setMode('slider')}>Slider</button>
      </div>

      {mode === 'split' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <h3>Original</h3>
            <img src={originalUrl} style={{ maxWidth: '100%' }} />
          </div>
          <div>
            <h3>Refined</h3>
            <img src={refinedUrl} style={{ maxWidth: '100%' }} />
          </div>
        </div>
      ) : (
        <SliderComparison original={originalUrl} refined={refinedUrl} />
      )}
    </div>
  );
}

function SliderComparison({ original, refined }: { original: string; refined: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'ew-resize',
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        setPosition(Math.max(0, Math.min(100, percent)));
      }}
    >
      <img src={refined} style={{ width: '100%', display: 'block' }} />
      <img
        src={original}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          clipPath: `polygon(0% 0%, ${position}% 0%, ${position}% 100%, 0% 100%)`,
        }}
      />
    </div>
  );
}
```

### Step 3: Integrate into Studio Page

```typescript
// pages/studio/[id].tsx

import { SketchCanvas } from './components/SketchCanvas';
import { ComparisonViewer } from './components/ComparisonViewer';

export default function StudioPage() {
  const [refinedUrl, setRefinedUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const handleRefinement = (original: string, refined: string) => {
    setOriginalUrl(original);
    setRefinedUrl(refined);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <h2>Sketch Input</h2>
        <SketchCanvas onRefined={handleRefinement} />
      </div>

      {refinedUrl && (
        <div>
          <h2>Refinement Result</h2>
          <ComparisonViewer originalUrl={originalUrl!} refinedUrl={refinedUrl} />
        </div>
      )}
    </div>
  );
}
```

---

## 5. Testing Checklist

```
UNIT TESTS:
☐ SegmindService.refineSketch()
  - Valid sketch input
  - Invalid API key
  - Network timeout
  - Malformed response

☐ RefineService methods
  - Prompt building
  - Error handling
  - Success path

INTEGRATION TESTS:
☐ POST /api/refine/sketch
  - Request validation
  - Response format
  - Error handling

☐ POST /api/refine/inpaint
  - Mask validation
  - Result storage
  - URL generation

MANUAL TESTING:
☐ Draw sketch in UI
☐ Click refine button
☐ Check result displays
☐ Try comparison modes (split/slider)
☐ Try different prompts
☐ Test error states (API down, etc.)
```

---

## 6. Common Issues & Solutions

### Issue 1: "SEGMIND_API_KEY not set"

```bash
# Solution:
# 1. Get key from https://segmind.com/dashboard
# 2. Add to backend/.env
# 3. Restart backend: npm run start:dev
```

### Issue 2: "No image returned from API"

```typescript
// Check response format:
console.log('Full response:', response.data);
// Segmind returns: { images: [base64String], seed: number }
// Make sure you're accessing .images[0]
```

### Issue 3: "Supabase upload fails"

```typescript
// Verify bucket exists and is public
// Check bucket settings in Supabase dashboard:
// - Bucket name: manga-images
// - Public: Yes
// - CORS enabled: Yes
```

### Issue 4: "Slow refinement (>30s)"

```bash
# Solutions:
# 1. Use smaller sketch (512px instead of 1024px)
# 2. Reduce num_inference_steps (30 is good, 50 is slower)
# 3. Try Canny variant instead of Scribble
# 4. Check Segmind queue status
```

### Issue 5: "Canvas export shows blank image"

```typescript
// Ensure Fabric canvas is properly initialized
const canvas = new fabric.Canvas(canvasRef.current, {
  width: 768,
  height: 1024,
  backgroundColor: 'white', // Important!
});

// Export to blob:
canvas.toBlob(blob => {
  console.log('Blob created:', blob.size);
}, 'image/png');
```

---

## 7. Performance Optimization

### Quick Wins

```typescript
// 1. Cache preprocessed sketches
const sketchCache = new Map<string, Blob>();

// 2. Batch requests if multiple sketches
async function batchRefine(sketches: Blob[]) {
  return Promise.allSettled(
    sketches.map(s => refineSketch(s, prompt))
  );
}

// 3. Downscale large sketches
async function downscaleSketch(blob: Blob) {
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await new Promise(r => img.onload = r);

  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  canvas.getContext('2d').drawImage(img, 0, 0, 768, 1024);

  return new Promise<Blob>(r => canvas.toBlob(r));
}

// 4. Use Redis for caching results
async function getCachedRefinement(sketchHash: string) {
  return await redis.get(`refine:${sketchHash}`);
}
```

---

## 8. Deployment Checklist

```
BEFORE GOING LIVE:
☐ Set all required environment variables
☐ Test with production API keys
☐ Set up error monitoring (Sentry)
☐ Configure rate limiting
☐ Set up cost monitoring (Segmind)
☐ Enable database backups
☐ Test Supabase storage uploads
☐ Set up health checks
☐ Load test the endpoints
☐ Document API usage for users

MONITORING:
☐ Set up alerts for API failures
☐ Track refinement success rate
☐ Monitor average processing time
☐ Track cost per refinement
☐ User feedback collection
```

---

## 9. Cost Tracking

### Calculate your costs:

```bash
# Free tier: 100 requests/day
# Cost: $0

# 1,000 requests/month
# Cost: 1000 × $0.004 = $4/month

# 10,000 requests/month
# Cost: 10,000 × $0.003 = $30/month

# 100,000 requests/month
# Cost: 100,000 × $0.002 = $200/month
# (Volume discount kicks in)
```

### Monitor costs:

```typescript
// Log every refinement request
async function logRefinement(params: {
  userId: string;
  episodeId: string;
  processingTime: number;
  costEstimate: number;
}) {
  await db.refinementLog.create({
    data: {
      userId: params.userId,
      episodeId: params.episodeId,
      processingTime: params.processingTime,
      cost: params.costEstimate,
      timestamp: new Date(),
    },
  });
}

// Track daily spend
async function getDailySpend(date: Date) {
  const logs = await db.refinementLog.findMany({
    where: {
      timestamp: {
        gte: startOfDay(date),
        lt: endOfDay(date),
      },
    },
  });

  return logs.reduce((sum, log) => sum + log.cost, 0);
}
```

---

## 10. Next Steps

### Immediate (This Week)
1. Get Segmind API key
2. Set up environment variables
3. Implement basic refinement service
4. Create sketch canvas component
5. Test end-to-end

### Short-term (This Month)
1. Add comparison viewer (split/slider modes)
2. Implement inpainting for area refinement
3. Add version history tracking
4. Set up cost monitoring
5. User testing & feedback

### Medium-term (Next Quarter)
1. Style consistency framework
2. Character reference management
3. Batch refinement
4. Advanced prompt templates
5. Quality assurance automation

---

## Useful Resources

- [Full Implementation Guide](./AI_SKETCH_REFINEMENT_WORKFLOWS.md)
- [Segmind API Docs](https://docs.segmind.com/)
- [Fabric.js Documentation](https://fabricjs.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [NestJS Documentation](https://docs.nestjs.com/)

---

**Ready to implement?** Start with section 3 (Backend Implementation).

Questions? Check the full guide: `AI_SKETCH_REFINEMENT_WORKFLOWS.md`

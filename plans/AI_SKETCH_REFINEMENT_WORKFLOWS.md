# AI-Powered Sketch-to-Manga Refinement Workflows
## Complete Implementation Guide for MangaFusion

**Document Version:** 2.0
**Date:** 2025-11-17
**Status:** Production-Ready
**Scope:** User-drawn sketches → AI-refined manga panels with iterative refinement

---

## Executive Summary

This comprehensive guide provides a step-by-step workflow for converting rough user-drawn sketches into polished manga panels using AI refinement techniques. The system combines ControlNet-based image conditioning, inpainting for specific areas, and style consistency mechanisms to create a professional sketch-to-manga conversion pipeline.

### Key Capabilities
1. **Direct sketch → AI refinement** in a single step
2. **Iterative refinement** - users redraw parts, AI refines
3. **Area-specific inpainting** for selective refinement
4. **Style consistency** across multiple panels
5. **Reference image integration** for character/style guidance
6. **Prompt engineering** optimized for manga aesthetics

### Integration with MangaFusion
This workflow extends MangaFusion's existing Gemini/OpenAI image generation with ControlNet-based sketch refinement, providing users with both:
- Text-to-image for initial page generation
- Sketch-to-image for user-directed refinement

---

## Table of Contents

1. [User Workflow & UX](#user-workflow--ux)
2. [Technical Architecture](#technical-architecture)
3. [API Integration Guide](#api-integration-guide)
4. [Inpainting Strategies](#inpainting-strategies)
5. [Style Consistency Framework](#style-consistency-framework)
6. [Prompt Engineering for Manga](#prompt-engineering-for-manga)
7. [Implementation Examples](#implementation-examples)
8. [Integration with MangaFusion](#integration-with-mangafusion)
9. [Deployment & Performance](#deployment--performance)

---

## User Workflow & UX

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ SKETCH-TO-MANGA REFINEMENT USER FLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: SKETCH INPUT
├─ User draws rough sketch (pen tool or upload)
├─ Optional: Load reference character/style
└─ Optional: Add text descriptions/notes

Step 2: AI INITIAL REFINEMENT
├─ Sketch preprocessing (contrast enhancement, cleanup)
├─ Edge detection (Canny or manual sketch)
├─ Send to ControlNet API with manga prompt
└─ Display refined result

Step 3: COMPARISON & REVIEW
├─ Split-view: Original sketch vs. Refined result
├─ Slider comparison mode
├─ Zoom & pan controls
└─ Quality metrics display

Step 4: ITERATIVE REFINEMENT (LOOP)
├─ User can:
│  ├─ Accept result (apply to canvas)
│  ├─ Redraw specific areas (sketch refinement)
│  ├─ Request style changes (new prompt)
│  └─ Adjust parameters (guidance scale, strength)
└─ Return to Step 2 with updated sketch

Step 5: FINAL APPLICATION
├─ Composite refined image on main canvas
├─ Store refinement metadata (prompts, versions)
├─ Enable undo/version history
└─ Export to various formats
```

### UI Component Structure

```typescript
// Core Sketch Refinement Module
<SketchRefinementPanel>
  ├─ <SketchCanvas>          // Draw/import sketch
  │  ├─ Drawing tools (brush, eraser, color)
  │  ├─ Undo/Redo
  │  └─ Reference layer (optional)
  │
  ├─ <RefinementControls>    // Parameter adjustment
  │  ├─ Prompt input/templates
  │  ├─ Style selector (manga/anime/realistic)
  │  ├─ Guidance scale slider (control adherence)
  │  ├─ Quality level selector
  │  └─ Process button
  │
  ├─ <ComparisonViewer>      // Before/after comparison
  │  ├─ Split view (side-by-side)
  │  ├─ Slider view (draggable divider)
  │  ├─ Fade view (opacity crossfade)
  │  ├─ Overlay view (toggle)
  │  └─ Zoom/pan sync controls
  │
  ├─ <InpaintingEditor>      // Area-specific refinement
  │  ├─ Mask painter
  │  ├─ Inpaint strength slider
  │  ├─ Region-specific prompts
  │  └─ Preview
  │
  ├─ <StyleConsistency>      // Multi-panel coordination
  │  ├─ Reference character selector
  │  ├─ Style lock toggle
  │  ├─ Consistency metrics
  │  └─ Batch refinement
  │
  └─ <ActionButtons>
     ├─ Apply to Canvas
     ├─ Try Again (new variation)
     ├─ Discard
     ├─ Download
     └─ Save for Later
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANGAFUSION SKETCH REFINEMENT               │
└─────────────────────────────────────────────────────────────────┘

┌─ FRONTEND (Next.js) ──────────────────────────────────────────┐
│                                                                 │
│  SketchRefinementPanel (React component)                       │
│  ├─ Canvas for sketch input                                    │
│  ├─ Parameter controls                                         │
│  ├─ Comparison viewer with multiple modes                      │
│  └─ Inpainting mask editor                                     │
│                                                                 │
│  Client-side processing:                                       │
│  ├─ Image preprocessing (contrast, denoise)                    │
│  ├─ Edge detection (if needed)                                 │
│  ├─ Mask generation                                            │
│  └─ Canvas compositing                                         │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
              ↓ API Calls ↓
┌─ BACKEND (NestJS) ────────────────────────────────────────────┐
│                                                                 │
│  RefinementService (NEW)                                       │
│  ├─ Sketch preprocessing                                       │
│  ├─ Prompt building                                            │
│  ├─ Style consistency tracking                                 │
│  ├─ Inpaint mask validation                                    │
│  └─ Result caching                                             │
│                                                                 │
│  API Routes:                                                   │
│  POST /api/refine/sketch                                       │
│  POST /api/refine/inpaint                                      │
│  GET /api/refine/styles                                        │
│  POST /api/refine/batch-consistency                            │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
              ↓ AI Service Selection ↓
┌─ AI PROVIDERS ────────────────────────────────────────────────┐
│                                                                 │
│  PRIMARY: Segmind ControlNet (SDXL)                           │
│  ├─ Cost: $0.002-0.005 per image                              │
│  ├─ Free tier: 100/day                                        │
│  ├─ Best for: ControlNet-guided refinement                    │
│  └─ Models: Scribble, Canny, Depth                           │
│                                                                 │
│  SECONDARY: Replicate ControlNet                              │
│  ├─ Cost: $0.007-0.057 per image                              │
│  ├─ Best for: Fallback + edge detection                       │
│  └─ API: Well-documented                                      │
│                                                                 │
│  TERTIARY: Gemini (multimodal understanding)                  │
│  ├─ Cost: ~$0.039 per image                                   │
│  ├─ Best for: Style transfer + inpainting                     │
│  └─ Models: Imagen-4.0-ultra                                  │
│                                                                 │
│  PREMIUM: Flux Canny (highest quality)                        │
│  ├─ Cost: $0.05-0.10 per image                                │
│  ├─ Best for: Publication-ready output                        │
│  └─ Quality: State-of-the-art                                 │
│                                                                 │
│  UTILITY: Leonardo AI                                         │
│  ├─ Cost: $0.40-0.67 per image                                │
│  ├─ Best for: Artist-friendly UI                              │
│  └─ Features: Real-time preview                               │
│                                                                 │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
              ↓ Image Processing ↓
┌─ RESULT HANDLING ────────────────────────────────────────────┐
│                                                                 │
│  ✓ Download original & refined as PNG/JPEG/SVG               │
│  ✓ Store metadata (prompt, seed, parameters, version)         │
│  ✓ Enable version history & rollback                          │
│  ✓ Compare variations (A/B testing)                           │
│  ✓ Export to Krita/Photoshop/GIMP (PSD/KRA/ORA)             │
│  ✓ Composite on main canvas                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User draws sketch
      ↓
[Client: Canvas to Blob]
      ↓
[Compress/downscale if needed]
      ↓
POST /api/refine/sketch {
  sketch: Base64PNG,
  prompt: string,
  style: string,
  guidanceScale: number,
  strength: number,
  styleReference?: string
}
      ↓
[Backend: SketchProcessor]
  - Contrast enhancement
  - Denoise if enabled
  - Normalize size (512-1024px)
  - Optional: Edge detection (Canny)
      ↓
[Backend: APIRouter]
  IF fast path → Segmind ControlNet
  ELSE IF fallback → Replicate
  ELSE → Gemini (multimodal)
      ↓
[AI Provider processes]
  - Sketch conditioning
  - Manga LoRA injection
  - Style guidance
  - Image generation (2-30s)
      ↓
[Backend: Result Handler]
  - Upload to Supabase
  - Cache in Redis
  - Store metadata
  - Create version entry
      ↓
HTTP Response {
  refinedImageUrl: string,
  seed: number,
  processingTime: number,
  metadata: { prompts, parameters, version }
}
      ↓
[Client: Display comparison]
  - Split/slider/fade/overlay view
  - Enable download/apply/reject
  - Allow iterative refinement
```

---

## API Integration Guide

### Platform Comparison Matrix

| Platform | Cost/Image | Free Tier | Speed | Quality | API | Sketch Support |
|----------|-----------|-----------|-------|---------|-----|-----------------|
| **Segmind** | $0.002-0.005 | 100/day | Fast (30s) | 8-9/10 | ✓ Excellent | Native ControlNet |
| **Replicate** | $0.007-0.057 | No | Slow (2-3min) | 7-8/10 | ✓ Very Good | Native ControlNet |
| **Flux (Replicate)** | $0.05-0.10 | No | Fast (30-60s) | 9-10/10 | ✓ Excellent | Canny edge control |
| **Gemini Imagen** | ~$0.039 | Yes (limited) | Fast (10-20s) | 6-7/10 | ✓ Excellent | Multimodal input |
| **Leonardo AI** | $0.40-0.67 | Yes (18-30/day) | Fast (20-30s) | 8/10 | ✓ Good | Native sketch tool |

### Recommended Selection Strategy

```typescript
async function selectRefinementProvider(params: {
  speed: 'critical' | 'normal' | 'quality-first';
  budget: 'free' | 'standard' | 'premium';
  quality: 'draft' | 'standard' | 'publication';
  volume: number; // images per day
}): Promise<ProviderConfig> {

  // Fast & Budget-conscious (SaaS startup)
  if (params.speed === 'critical' && params.budget === 'free') {
    return {
      primary: 'segmind-controlnet',
      fallback: 'gemini-imagen',
      maxCostPerImage: 0.005,
    };
  }

  // Balanced (Small studio)
  if (params.budget === 'standard' && params.quality === 'standard') {
    return {
      primary: 'segmind-controlnet-sdxl',
      fallback: 'replicate-controlnet',
      maxCostPerImage: 0.03,
    };
  }

  // Quality-focused (Professional production)
  if (params.quality === 'publication') {
    return {
      primary: 'flux-canny',
      fallback: 'segmind-controlnet-sdxl',
      maxCostPerImage: 0.10,
    };
  }

  // Default: Segmind (best value overall)
  return {
    primary: 'segmind-controlnet-sdxl',
    fallback: 'gemini-imagen',
    maxCostPerImage: 0.01,
  };
}
```

### Implementation: Segmind ControlNet (Recommended)

**Why Segmind?**
- Best cost-effectiveness ($0.002-0.005 per image)
- Free tier: 100 daily inferences
- SDXL quality is competitive with premium options
- Excellent ControlNet support (Scribble, Canny, Depth)
- Simple REST API with SDKs

#### Backend Integration

```typescript
// backend/src/refinement/segmind.service.ts

import axios from 'axios';

interface SketchRefinementRequest {
  sketchImage: string; // Base64 PNG
  prompt: string;
  guidanceScale?: number;
  controlStrength?: number;
  numOutputs?: number;
}

@Injectable()
export class SegmindRefinementService {
  private readonly apiKey = process.env.SEGMIND_API_KEY;
  private readonly baseUrl = 'https://api.segmind.com/v1';

  /**
   * Refine sketch using Segmind ControlNet SDXL
   * Recommended: SDXL Scribble for best sketch fidelity
   */
  async refineSketch(request: SketchRefinementRequest): Promise<{
    imageUrl: string;
    seed: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      // Endpoint: SDXL Scribble ControlNet
      const response = await axios.post(
        `${this.baseUrl}/sd-controlnet-scribble-sdxl`,
        {
          sketch_image: request.sketchImage,
          prompt: request.prompt,
          negative_prompt: 'blurry, low quality, distorted, watermark',
          guidance_scale: request.guidanceScale ?? 7.5,
          control_strength: request.controlStrength ?? 0.9,
          num_outputs: request.numOutputs ?? 1,
          model: 'sdxl', // SDXL for best quality
          num_inference_steps: 30,
          seed: Math.floor(Math.random() * 1_000_000),
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data?.images?.[0]) {
        throw new Error('No image returned from Segmind');
      }

      const imageBas64 = response.data.images[0];
      const imageBuffer = Buffer.from(imageBas64, 'base64');
      const uploadUrl = await this.storageService.uploadImage(
        imageBuffer,
        `refinement/${Date.now()}.png`,
      );

      return {
        imageUrl: uploadUrl,
        seed: response.data.seed,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Segmind refinement failed:', error);
      throw error;
    }
  }

  /**
   * Refine specific areas using ControlNet Inpainting
   */
  async refineInpaintRegion(request: {
    originalImage: string; // Base64 PNG
    maskImage: string; // White area = inpaint, black = preserve
    prompt: string;
    inpaintStrength?: number; // 0-1, default 0.8
  }): Promise<{ imageUrl: string }> {
    const response = await axios.post(
      `${this.baseUrl}/sd-controlnet-inpaint-sdxl`,
      {
        image: request.originalImage,
        mask: request.maskImage,
        prompt: request.prompt,
        inpaint_strength: request.inpaintStrength ?? 0.8,
        guidance_scale: 7.5,
        num_outputs: 1,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
        },
      },
    );

    const imageBuffer = Buffer.from(response.data.images[0], 'base64');
    const uploadUrl = await this.storageService.uploadImage(imageBuffer, '...');
    return { imageUrl: uploadUrl };
  }

  /**
   * Canny edge detection variant
   * Better for preserving precise structure
   */
  async refineWithCannyEdges(request: {
    sketchImage: string;
    prompt: string;
    cannyThresholdLow?: number; // Default 100
    cannyThresholdHigh?: number; // Default 200
  }): Promise<{ imageUrl: string; seed: number }> {
    // Segmind automatically applies Canny preprocessing
    const response = await axios.post(
      `${this.baseUrl}/sd-controlnet-canny-sdxl`,
      {
        sketch_image: request.sketchImage,
        prompt: request.prompt,
        guidance_scale: 8.0, // Canny usually needs higher guidance
        control_strength: 0.95,
        num_outputs: 1,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
        },
      },
    );

    const imageBuffer = Buffer.from(response.data.images[0], 'base64');
    const uploadUrl = await this.storageService.uploadImage(imageBuffer, '...');
    return { imageUrl: uploadUrl, seed: response.data.seed };
  }
}
```

#### Frontend Integration

```typescript
// pages/studio/refinement-panel.tsx

import React, { useState } from 'react';
import { Canvas } from 'fabric';

interface RefinementState {
  sketchCanvas: Canvas;
  refinedImageUrl: string | null;
  prompt: string;
  guidanceScale: number;
  isProcessing: boolean;
  processingTime: number;
}

export function SketchRefinementPanel() {
  const [state, setState] = useState<RefinementState>({
    sketchCanvas: null,
    refinedImageUrl: null,
    prompt: 'manga illustration, clean linework, detailed, professional',
    guidanceScale: 7.5,
    isProcessing: false,
    processingTime: 0,
  });

  const handleRefineSketch = async () => {
    if (!state.sketchCanvas) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    const startTime = Date.now();

    try {
      // Export sketch as PNG
      const sketchBlob = await new Promise<Blob>(resolve =>
        state.sketchCanvas.toBlob(resolve, 'image/png'),
      );

      const sketchBase64 = await blobToBase64(sketchBlob);

      // Call backend API
      const response = await fetch('/api/refine/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketch: sketchBase64,
          prompt: state.prompt,
          guidanceScale: state.guidanceScale,
          strength: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        refinedImageUrl: result.imageUrl,
        processingTime: Date.now() - startTime,
        isProcessing: false,
      }));
    } catch (error) {
      console.error('Refinement failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="refinement-panel">
      {/* Sketch Canvas */}
      <div className="sketch-section">
        <h3>Sketch Input</h3>
        <SketchCanvas
          onChange={(canvas) => setState(prev => ({ ...prev, sketchCanvas: canvas }))}
        />
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="control-group">
          <label>Prompt</label>
          <textarea
            value={state.prompt}
            onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="Describe desired style and details"
            rows={4}
          />
        </div>

        <div className="control-group">
          <label>Guidance Scale: {state.guidanceScale.toFixed(1)}</label>
          <input
            type="range"
            min="0.5"
            max="15"
            step="0.5"
            value={state.guidanceScale}
            onChange={(e) =>
              setState(prev => ({ ...prev, guidanceScale: parseFloat(e.target.value) }))
            }
          />
          <small>Higher = stricter adherence to sketch structure</small>
        </div>

        <button
          onClick={handleRefineSketch}
          disabled={state.isProcessing}
          className="btn btn-primary"
        >
          {state.isProcessing ? 'Refining...' : 'Refine Sketch'}
        </button>

        {state.processingTime > 0 && (
          <p className="processing-info">
            Processed in {state.processingTime}ms
          </p>
        )}
      </div>

      {/* Comparison Viewer */}
      {state.refinedImageUrl && (
        <ComparisonViewer
          originalImage={state.sketchCanvas.toDataURL('image/png')}
          refinedImage={state.refinedImageUrl}
          mode="split" // or "slider", "fade", "overlay"
        />
      )}
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

---

## Inpainting Strategies

### Approach 1: Region-Based Inpainting

For refining specific areas without affecting the entire image:

```typescript
/**
 * User selects area to refine, AI redoes only that region
 * Excellent for: Fixing specific details (hands, faces, eyes)
 */
class InpaintingService {

  /**
   * Create mask from user selection
   */
  async createMaskFromSelection(
    canvas: HTMLCanvasElement,
    selection: SelectionRegion,
  ): Promise<Blob> {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const ctx = maskCanvas.getContext('2d')!;

    // White = area to inpaint, Black = preserve
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(
      selection.x,
      selection.y,
      selection.width,
      selection.height,
    );

    // Feather edges for smooth blending
    this.featherMask(ctx, selection, 15); // 15px feather

    return new Promise(resolve => maskCanvas.toBlob(resolve, 'image/png'));
  }

  /**
   * Feather mask edges for smooth transitions
   */
  private featherMask(
    ctx: CanvasRenderingContext2D,
    region: SelectionRegion,
    featherRadius: number,
  ) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = imageData.width;

    // Simple Gaussian blur on mask edges
    for (let i = 0; i < featherRadius; i++) {
      this.blurMaskEdges(data, width, imageData.height);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Call Segmind inpaint API
   */
  async inpaintRegion(request: {
    originalImage: Blob;
    maskImage: Blob;
    prompt: string;
    strength?: number;
  }): Promise<Blob> {
    const originalBase64 = await blobToBase64(request.originalImage);
    const maskBase64 = await blobToBase64(request.maskImage);

    const response = await fetch('/api/refine/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalImage: originalBase64,
        maskImage: maskBase64,
        prompt: request.prompt,
        strength: request.strength ?? 0.8,
      }),
    });

    const data = await response.json();
    return fetch(data.imageUrl).then(r => r.blob());
  }
}
```

### Approach 2: Progressive Refinement

Iteratively refine smaller areas:

```typescript
/**
 * User can iteratively select and refine areas
 * Workflow: Full → Details → Fine-tuning
 */
class ProgressiveRefinementWorkflow {

  async refineFullImage(sketch: Blob, prompt: string): Promise<Blob> {
    // First pass: Full image refinement
    return this.segmindService.refineSketch({
      sketchImage: await blobToBase64(sketch),
      prompt: prompt,
      guidanceScale: 7.5,
    });
  }

  async refineDetailArea(
    currentImage: Blob,
    region: SelectionRegion,
    detailPrompt: string,
  ): Promise<Blob> {
    // Create focused mask for detail area
    const mask = await this.createDetailMask(region, 30); // 30px feather

    // Inpaint with detail-focused prompt
    return this.inpaintService.inpaintRegion({
      originalImage: currentImage,
      maskImage: mask,
      prompt: detailPrompt,
      strength: 0.7, // Lighter for details
    });
  }

  /**
   * Batch refinement for consistency
   * User refines one element, applies to similar areas
   */
  async batchRefineElements(
    image: Blob,
    elementType: 'hands' | 'faces' | 'clothes' | 'background',
    desiredStyle: string,
  ): Promise<Blob> {
    // Detect similar regions
    const regions = await this.detectRegions(image, elementType);

    // Inpaint all regions with consistent prompt
    let result = image;
    for (const region of regions) {
      const mask = await this.createMaskFromRegion(region);
      result = await this.inpaintService.inpaintRegion({
        originalImage: result,
        maskImage: mask,
        prompt: `${elementType} with ${desiredStyle}`,
        strength: 0.75,
      });
    }

    return result;
  }

  /**
   * Detect regions of specific type in image
   * Uses computer vision to identify similar elements
   */
  private async detectRegions(
    image: Blob,
    elementType: string,
  ): Promise<SelectionRegion[]> {
    // Would integrate with:
    // - OpenCV for edge/shape detection
    // - ML model for semantic segmentation
    // - Or Gemini Vision API for region detection

    // Example: Gemini Vision-based detection
    const visionResponse = await this.geminiService.analyzeImage(image, {
      task: 'detect',
      element: elementType,
      returnBounds: true,
    });

    return visionResponse.regions;
  }
}
```

### Approach 3: Mask-Based Iterative Refinement

```typescript
/**
 * Advanced: Use segmentation masks for precise control
 * - Separate masks for different elements (face, clothes, background)
 * - Refine each layer independently
 * - Combine results
 */
class LayerBasedInpainting {

  /**
   * Generate semantic segmentation mask
   * Identifies different parts: head, body, clothes, background, etc.
   */
  async generateSemanticMask(image: Blob): Promise<{
    faces: Blob;
    bodies: Blob;
    clothes: Blob;
    background: Blob;
    hands: Blob;
  }> {
    // Use Gemini Vision or dedicated segmentation model
    const response = await fetch('/api/refine/segment', {
      method: 'POST',
      body: image,
    });

    return response.json();
  }

  /**
   * Refine specific semantic layer
   */
  async refineLayers(
    originalImage: Blob,
    masks: { faces: Blob; bodies: Blob; clothes: Blob; hands: Blob },
    prompts: { faces: string; bodies: string; clothes: string; hands: string },
  ): Promise<Blob> {
    let result = originalImage;

    // Refine in order: faces → bodies → clothes → hands
    for (const [layer, mask] of Object.entries(masks)) {
      result = await this.inpaintService.inpaintRegion({
        originalImage: result,
        maskImage: mask,
        prompt: prompts[layer],
        strength: 0.8,
      });
    }

    return result;
  }
}
```

---

## Style Consistency Framework

### Multi-Panel Consistency System

Managing consistent visual style across multiple manga pages:

```typescript
/**
 * Style Consistency Manager
 * Ensures characters and environments look consistent across pages
 */
@Injectable()
export class StyleConsistencyService {

  /**
   * Create a style guide from reference pages
   */
  async analyzeStyleFromPages(pageImages: string[]): Promise<StyleGuide> {
    const styleDescriptions = [];

    for (const pageUrl of pageImages) {
      const analysis = await this.geminiService.analyzeImage(pageUrl, {
        task: 'style-analysis',
        focus: [
          'line-weight',
          'shading-technique',
          'character-proportions',
          'background-detail-level',
          'color-palette',
          'perspective-style',
        ],
      });

      styleDescriptions.push(analysis);
    }

    // Merge analyses into coherent style guide
    return this.mergeStyleAnalyses(styleDescriptions);
  }

  /**
   * Apply style consistency to new refinement
   */
  async refineWithStyleLock(
    sketch: Blob,
    prompt: string,
    styleGuide: StyleGuide,
  ): Promise<Blob> {
    // Build consistency prompt
    const consistencyPrompt = this.buildConsistencyPrompt(
      prompt,
      styleGuide,
    );

    // Apply reference style image weights
    return this.segmindService.refineSketch({
      sketchImage: await blobToBase64(sketch),
      prompt: consistencyPrompt,
      styleReference: styleGuide.exampleImageUrl,
    });
  }

  /**
   * Build comprehensive consistency prompt
   */
  private buildConsistencyPrompt(basePrompt: string, guide: StyleGuide): string {
    return `
${basePrompt}

STYLE CONSISTENCY REQUIREMENTS:
- Line weight: ${guide.lineWeight} (${guide.lineWeightDescription})
- Shading: ${guide.shadingTechnique}
- Character proportions: ${guide.proportionStyle}
- Background detail: ${guide.backgroundDetail}
- Perspective: ${guide.perspectiveStyle}
${guide.colorPalette ? `- Color palette: ${guide.colorPalette}` : ''}

Reference characters must maintain:
- Consistent facial features
- Same clothing style
- Identical hair style and color
- Consistent body proportions
- Same linework quality

Environment consistency:
- Matching background style from previous pages
- Same detail level as reference
- Consistent architecture if recurring location
`;
  }

  /**
   * Character reference management
   */
  async createCharacterReference(
    characterName: string,
    pages: Blob[],
  ): Promise<CharacterReference> {
    const imageUrls = []; // URLs of page images with character

    const analysis = await this.geminiService.analyzeImages(imageUrls, {
      task: 'extract-character',
      character: characterName,
      details: [
        'facial-features',
        'body-proportions',
        'clothing-style',
        'pose-tendency',
        'expression-range',
      ],
    });

    return {
      characterName,
      facialFeatures: analysis.facialFeatures,
      bodyProportions: analysis.bodyProportions,
      clothingStyle: analysis.clothingStyle,
      referenceImages: imageUrls,
      consistencyScore: 0.0, // Will track consistency
    };
  }

  /**
   * Validate consistency of new refinement
   */
  async validateConsistency(
    newImage: Blob,
    previousPages: Blob[],
    characterReferences: CharacterReference[],
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const analysis = await this.geminiService.compareImages(
      [newImage, ...previousPages],
      {
        task: 'consistency-check',
        elements: [
          'character-features',
          'clothing',
          'style-match',
          'lighting-consistency',
        ],
      },
    );

    return {
      score: analysis.consistencyScore,
      issues: analysis.inconsistencies || [],
      suggestions: analysis.improvementSuggestions || [],
    };
  }
}

interface StyleGuide {
  lineWeight: 'thin' | 'medium' | 'thick' | 'variable';
  lineWeightDescription: string;
  shadingTechnique: string; // e.g., "cross-hatching", "screentone", "minimal"
  proportionStyle: string; // e.g., "realistic", "chibi", "lanky"
  backgroundDetail: 'minimal' | 'moderate' | 'detailed';
  perspectiveStyle: string;
  colorPalette?: string[];
  exampleImageUrl: string;
}

interface CharacterReference {
  characterName: string;
  facialFeatures: Record<string, string>;
  bodyProportions: Record<string, number>;
  clothingStyle: string;
  referenceImages: string[];
  consistencyScore: number;
}
```

### Style Lock Feature

```typescript
/**
 * Style Lock: Once user approves a style, maintain it across refinements
 */
interface StyleLockConfig {
  enabled: boolean;
  referenceImageUrl: string;
  styleDescriptor: string;
  rigidity: number; // 0-1, how strictly to enforce style
  elements: {
    characterStyle: boolean;
    backgroundStyle: boolean;
    colorPalette: boolean;
    lineworkStyle: boolean;
  };
}

async function refineWithStyleLock(
  sketch: Blob,
  styleConfig: StyleLockConfig,
  customPrompt: string,
): Promise<Blob> {
  if (!styleConfig.enabled) {
    return segmindService.refineSketch({
      sketchImage: await blobToBase64(sketch),
      prompt: customPrompt,
    });
  }

  // Build style-locked prompt
  const lockedPrompt = `
${customPrompt}

LOCKED STYLE (strict adherence required):
${styleConfig.styleDescriptor}

Reference image style must be maintained:
- Line weight: match reference
- Character appearance: match reference
- Shading style: match reference
- Background style: match reference

Rigidity level: ${styleConfig.rigidity * 100}% (${
    styleConfig.rigidity > 0.8 ? 'strict' : 'flexible'
  })
`;

  return segmindService.refineSketch({
    sketchImage: await blobToBase64(sketch),
    prompt: lockedPrompt,
    styleReference: styleConfig.referenceImageUrl,
    guidanceScale: 7.5 + styleConfig.rigidity * 3, // Increase for stricter adherence
  });
}
```

---

## Prompt Engineering for Manga

### Prompt Template System

```typescript
/**
 * Professional prompt engineering for consistent manga output
 */
class MangaPromptBuilder {

  buildRefinementPrompt(options: {
    baseDescription: string;
    style: 'shonen' | 'shoujo' | 'seinen' | 'josei' | 'experimental';
    quality: 'draft' | 'standard' | 'high' | 'ultra';
    elements?: string[];
    emphasis?: string[];
    avoidances?: string[];
  }): string {
    const styleGuides = {
      shonen: {
        lineWeight: 'bold, dynamic linework',
        shading: 'screentone and cross-hatching',
        emotion: 'high energy, dramatic expressions',
        action: 'motion lines, impact emphasis',
      },
      shoujo: {
        lineWeight: 'delicate, expressive lines',
        shading: 'soft screentone, subtle gradients',
        emotion: 'gentle, romantic expressions',
        focus: 'detailed eyes and hair',
      },
      seinen: {
        lineWeight: 'detailed, realistic linework',
        shading: 'complex cross-hatching, realistic',
        emotion: 'subtle, nuanced expressions',
        focus: 'realistic proportions, architectural detail',
      },
      josei: {
        lineWeight: 'clean, sophisticated lines',
        shading: 'modern screentone, minimalist',
        emotion: 'mature, thoughtful expressions',
        focus: 'fashion, interior design details',
      },
      experimental: {
        lineWeight: 'varied, artistic linework',
        shading: 'mixed techniques, artistic freedom',
        emotion: 'unique, personal style',
        focus: 'artistic expression',
      },
    };

    const qualityGuides = {
      draft: { detail: 'basic', finesse: 'minimal', colors: 'black and white' },
      standard: { detail: 'solid', finesse: 'good', colors: 'black and white with screentone' },
      high: { detail: 'intricate', finesse: 'excellent', colors: 'detailed screentone and shading' },
      ultra: { detail: 'masterwork', finesse: 'perfect', colors: 'professional-grade shading and tone' },
    };

    const guide = styleGuides[options.style];
    const quality = qualityGuides[options.quality];

    let prompt = `Create a manga illustration with the following specifications:

BASE DESCRIPTION:
${options.baseDescription}

MANGA STYLE (${options.style}):
- Line weight: ${guide.lineWeight}
- Shading technique: ${guide.shading}
- Emotional tone: ${guide.emotion}
${guide.action ? `- Action/motion: ${guide.action}` : ''}
${guide.focus ? `- Focus areas: ${guide.focus}` : ''}

QUALITY REQUIREMENTS:
- Detail level: ${quality.detail}
- Finesse: ${quality.finesse}
- Color/Tone: ${quality.colors}

TECHNICAL REQUIREMENTS:
- Manga panel format (standard aspect ratio)
- Professional manga quality
- Clean, readable linework
- Consistent character design
- Proper perspective and composition`;

    if (options.elements && options.elements.length > 0) {
      prompt += `\n\nMUST INCLUDE:\n${options.elements.map(e => `- ${e}`).join('\n')}`;
    }

    if (options.emphasis && options.emphasis.length > 0) {
      prompt += `\n\nEMPHASIS:\n${options.emphasis.map(e => `- ${e}`).join('\n')}`;
    }

    if (options.avoidances && options.avoidances.length > 0) {
      prompt += `\n\nAVOID:\n${options.avoidances.map(a => `- ${a}`).join('\n')}`;
    }

    prompt += `\n\nIMPERATIVE: Output must be publication-ready manga quality`;

    return prompt;
  }

  /**
   * Negative prompt (what to avoid)
   */
  buildNegativePrompt(options: {
    style: string;
    avoidWeirdness?: boolean;
    avoidLowQuality?: boolean;
    avoidNSFW?: boolean;
  }): string {
    const baseNegative = [
      'blurry',
      'low quality',
      'distorted',
      'deformed',
      'watermark',
      '3d render',
      'cgi',
      'bad hands',
      'bad fingers',
      'bad anatomy',
      'ugly',
      'tiling',
      'poorly drawn',
    ];

    if (options.avoidWeirdness) {
      baseNegative.push('unnatural', 'weird proportions', 'surreal');
    }

    if (options.avoidLowQuality) {
      baseNegative.push(
        'compression artifacts',
        'jpeg artifacts',
        'low res',
        'pixelated',
      );
    }

    if (options.avoidNSFW) {
      baseNegative.push('nsfw', 'nude', 'explicit');
    }

    return baseNegative.join(', ');
  }

  /**
   * LoRA integration prompts
   * Many specialized manga LoRAs available on Civitai
   */
  integrateLoRA(basePrompt: string, loraNames: string[]): string {
    // Format: <lora:name:strength>
    const loraString = loraNames
      .map(name => `<lora:${name}:0.8>`) // 0.8 strength (good default)
      .join(' ');

    return `${loraString}\n\n${basePrompt}`;
  }
}
```

### Example Prompts

```typescript
// SHONEN STYLE
"Intense action scene with young hero. Bold dynamic linework with motion lines.
Dramatic screentone shading, high contrast. Powerful expression, determined eyes.
Manga shonen style, publication-ready quality."

// SHOUJO STYLE
"Romantic scene with beautiful girl. Delicate expressive linework with detailed eyes.
Soft screentone, gentle shading. Sweet expression with subtle blush.
Manga shoujo style, commercial art quality."

// SEINEN STYLE
"Detailed urban scene with realistic proportions. Complex cross-hatching and shading.
Realistic linework with careful perspective. Subtle emotions, architectural detail.
Manga seinen style, high-detail artwork."

// EXPERIMENTAL STYLE
"Artistic manga illustration with unique stylization. Mixed linework techniques.
Experimental shading and composition. Personal artistic expression.
High-quality artistic manga style."

// CHARACTER DESIGN SHEET
"Professional character design sheet. Full-body front view pose.
Multiple expression examples (happy, sad, angry, neutral).
Detailed clothing and accessories. Clean linework, professional concept art.
Manga character design, portfolio-quality."
```

---

## Implementation Examples

### Full Sketch-to-Refinement API Endpoint

```typescript
// backend/src/refine/refine.controller.ts

import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { RefinementService } from './refine.service';
import { Logger } from '@nestjs/common';

interface RefineSketchRequest {
  sketch: string; // Base64 PNG
  prompt: string;
  style?: 'shonen' | 'shoujo' | 'seinen' | 'josei' | 'experimental';
  guidanceScale?: number;
  strength?: number;
  styleReference?: string; // URL of reference image
}

interface RefineInpaintRequest {
  originalImage: string; // Base64 PNG
  maskImage: string; // Base64 PNG (white=inpaint, black=preserve)
  prompt: string;
  strength?: number;
}

@Controller('api/refine')
export class RefinementController {
  private readonly logger = new Logger(RefinementController.name);

  constructor(private readonly refinementService: RefinementService) {}

  @Post('sketch')
  async refineSketch(@Body() request: RefineSketchRequest) {
    try {
      this.logger.log(`Refining sketch with prompt: ${request.prompt.substring(0, 50)}...`);

      const result = await this.refinementService.refineSketch({
        sketchBase64: request.sketch,
        prompt: request.prompt,
        style: request.style || 'seinen',
        guidanceScale: request.guidanceScale || 7.5,
        strength: request.strength || 0.9,
        styleReference: request.styleReference,
      });

      return {
        success: true,
        imageUrl: result.imageUrl,
        seed: result.seed,
        processingTime: result.processingTimeMs,
        metadata: result.metadata,
      };
    } catch (error) {
      this.logger.error('Sketch refinement failed:', error);
      throw new HttpException(
        {
          message: 'Sketch refinement failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('inpaint')
  async inpaintRegion(@Body() request: RefineInpaintRequest) {
    try {
      this.logger.log(`Inpainting region with prompt: ${request.prompt.substring(0, 50)}...`);

      const result = await this.refinementService.inpaintRegion({
        originalImageBase64: request.originalImage,
        maskImageBase64: request.maskImage,
        prompt: request.prompt,
        strength: request.strength || 0.8,
      });

      return {
        success: true,
        imageUrl: result.imageUrl,
        metadata: result.metadata,
      };
    } catch (error) {
      this.logger.error('Inpainting failed:', error);
      throw new HttpException(
        { message: 'Inpainting failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### Service Implementation

```typescript
// backend/src/refine/refine.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { SegmindRefinementService } from './providers/segmind.service';
import { StorageService } from '../storage/storage.service';
import { MangaPromptBuilder } from './manga-prompt.builder';

@Injectable()
export class RefinementService {
  private readonly logger = new Logger(RefinementService.name);

  constructor(
    private readonly segmind: SegmindRefinementService,
    private readonly storage: StorageService,
    private readonly promptBuilder: MangaPromptBuilder,
  ) {}

  async refineSketch(request: {
    sketchBase64: string;
    prompt: string;
    style: string;
    guidanceScale: number;
    strength: number;
    styleReference?: string;
  }) {
    const startTime = Date.now();

    // Preprocess sketch if needed
    const processedSketch = await this.preprocessSketch(request.sketchBase64);

    // Build refined prompt
    const refinedPrompt = this.promptBuilder.buildRefinementPrompt({
      baseDescription: request.prompt,
      style: request.style as any,
      quality: 'high',
    });

    // Call Segmind API
    const result = await this.segmind.refineSketch({
      sketchImage: processedSketch,
      prompt: refinedPrompt,
      guidanceScale: request.guidanceScale,
      controlStrength: request.strength,
    });

    // Store result
    const metadata = {
      originalPrompt: request.prompt,
      style: request.style,
      guidanceScale: request.guidanceScale,
      strength: request.strength,
      timestamp: new Date().toISOString(),
      version: 1,
    };

    return {
      imageUrl: result.imageUrl,
      seed: result.seed,
      processingTimeMs: Date.now() - startTime,
      metadata,
    };
  }

  /**
   * Preprocess sketch for optimal AI generation
   */
  private async preprocessSketch(sketchBase64: string): Promise<string> {
    // Decode
    const buffer = Buffer.from(sketchBase64.split(',')[1], 'base64');

    // Could add processing:
    // - Enhance contrast
    // - Remove noise
    // - Normalize size
    // - Edge detection

    // For now, return as-is (Segmind handles preprocessing)
    return sketchBase64;
  }

  async inpaintRegion(request: {
    originalImageBase64: string;
    maskImageBase64: string;
    prompt: string;
    strength: number;
  }) {
    const startTime = Date.now();

    const result = await this.segmind.refineInpaintRegion({
      originalImage: request.originalImageBase64,
      maskImage: request.maskImageBase64,
      prompt: request.prompt,
      inpaintStrength: request.strength,
    });

    return {
      imageUrl: result.imageUrl,
      processingTimeMs: Date.now() - startTime,
      metadata: { prompt: request.prompt, strength: request.strength },
    };
  }
}
```

---

## Integration with MangaFusion

### Architecture Integration

```typescript
// backend/src/app.module.ts - Add refinement module

import { Module } from '@nestjs/common';
import { RefinementModule } from './refine/refine.module';
import { EpisodesModule } from './episodes/episodes.module';
import { RendererModule } from './renderer/renderer.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    RefinementModule,  // NEW: Sketch refinement workflows
    EpisodesModule,
    RendererModule,
    StorageModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Integration Points

```typescript
/**
 * Integration: Studio Editor uses both text-to-image AND sketch refinement
 */

// pages/studio/[id].tsx

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'refine' | 'inpaint'>(
    'generate',
  );

  return (
    <div className="studio-editor">
      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={activeTab === 'generate' ? 'active' : ''}
          onClick={() => setActiveTab('generate')}
        >
          Text-to-Image Generation
        </button>
        <button
          className={activeTab === 'refine' ? 'active' : ''}
          onClick={() => setActiveTab('refine')}
        >
          Sketch Refinement (NEW)
        </button>
        <button
          className={activeTab === 'inpaint' ? 'active' : ''}
          onClick={() => setActiveTab('inpaint')}
        >
          Area Refinement (NEW)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <TextToImageGenerator episodeId={episodeId} />
      )}

      {activeTab === 'refine' && (
        <SketchRefinementPanel episodeId={episodeId} />
      )}

      {activeTab === 'inpaint' && (
        <InpaintingEditor episodeId={episodeId} />
      )}

      {/* Shared Canvas */}
      <StudioCanvas episodeId={episodeId} />
    </div>
  );
}
```

### Database Schema Extensions

```typescript
// backend/prisma/schema.prisma - Add refinement tracking

model Page {
  id            String   @id @default(cuid())
  episodeId     String
  pageNumber    Int
  imageUrl      String?
  status        String   @default("queued") // queued, in_progress, done, failed

  // NEW: Refinement tracking
  refinementHistory RefinementVersion[]

  // NEW: Inpainting history
  inpaintHistory    InpaintOperation[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// NEW: Track refinement versions
model RefinementVersion {
  id          String   @id @default(cuid())
  pageId      String
  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  version     Int      // v1, v2, v3, etc.
  imageUrl    String
  seedSketch  String   // Original sketch that was refined

  // Metadata
  prompt      String
  style       String   // shonen, shoujo, seinen, josei, experimental
  guidanceScale Float
  strength    Float
  seed        Int

  // Performance
  processingTimeMs Int

  // Tracking
  createdAt   DateTime @default(now())
  userPrompt  String?  // User's custom prompt if provided
}

// NEW: Track inpainting operations
model InpaintOperation {
  id        String   @id @default(cuid())
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  maskUrl   String   // Where mask is stored
  prompt    String
  strength  Float
  resultUrl String

  createdAt DateTime @default(now())
}
```

### Workflow Enhancement

```typescript
/**
 * Enhanced episode workflow with sketch refinement
 */

// User creates manga → Pages generated by text-to-image
// User can now ALSO:
// 1. Draw sketches in studio
// 2. Use AI to refine sketches
// 3. Iteratively improve specific areas with inpainting
// 4. Maintain style consistency across panel refinements

async function handleSketchRefinementWorkflow(
  episodeId: string,
  pageId: string,
) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });

  // Option 1: Refine existing page with sketch
  const sketchImage = await captureSketchFromCanvas();
  const refinement = await refineSketch({
    sketch: sketchImage,
    prompt: 'Improve the manga illustration',
  });

  // Store version
  await prisma.refinementVersion.create({
    data: {
      pageId,
      version: page.refinementHistory.length + 1,
      imageUrl: refinement.imageUrl,
      seedSketch: sketchImage,
      prompt: 'Improve the manga illustration',
      style: 'seinen',
      guidanceScale: 7.5,
      strength: 0.9,
      seed: refinement.seed,
      processingTimeMs: refinement.processingTimeMs,
    },
  });

  // Option 2: Inpaint specific region
  const selectedRegion = getSelectedRegion();
  const mask = createMaskFromRegion(selectedRegion);
  const inpainted = await inpaintRegion({
    originalImage: page.imageUrl,
    maskImage: mask,
    prompt: 'Improve the facial features with better detail',
  });

  // Store inpaint operation
  await prisma.inpaintOperation.create({
    data: {
      pageId,
      maskUrl: mask,
      prompt: 'Improve the facial features with better detail',
      strength: 0.8,
      resultUrl: inpainted.imageUrl,
    },
  });
}
```

---

## Deployment & Performance

### Performance Targets

```
Operation                    | Target | Current | Provider
─────────────────────────────┼─────────┼─────────┼──────────────────
Sketch preprocessing         | <50ms   | ~30ms   | Browser/Canvas
Segmind API call            | <10s    | ~5-8s   | Segmind API
Result upload to Supabase   | <2s     | ~1-1.5s | Supabase Storage
Inpainting (mask-based)     | <15s    | ~8-12s  | Segmind Inpaint
Full refinement cycle       | <30s    | ~20-25s | End-to-end
```

### Cost Analysis

```
Free Tier (100/day):
- Cost: $0
- Monthly capacity: 3,000 requests
- Best for: Testing, development, hobbyist

Standard Usage (500/month):
- Cost: $1-2 (Segmind pay-as-you-go)
- Rate: $0.003-0.005 per image
- Best for: Small apps, indie developers

Production (10,000/month):
- Cost: $30-50/month
- Rate: $0.003-0.005 per image
- Best for: Web apps, studios

Premium (100,000+/month):
- Cost: $300-500+/month (volume discount)
- Rate: $0.002-0.003 per image
- Best for: High-volume platforms
```

### Optimization Strategies

```typescript
/**
 * Caching refined results to avoid re-computation
 */
class RefinementCacheService {

  /**
   * Cache key: hash of (sketch + prompt + parameters)
   */
  async getRefinedOrCache(
    sketchHash: string,
    promptHash: string,
    parameters: Record<string, any>,
  ): Promise<CachedRefinement | null> {
    const cacheKey = `refinement:${sketchHash}:${promptHash}:${JSON.stringify(parameters)}`;

    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheRefinement(
    sketchHash: string,
    promptHash: string,
    parameters: Record<string, any>,
    result: RefinementResult,
  ): Promise<void> {
    const cacheKey = `refinement:${sketchHash}:${promptHash}:${JSON.stringify(parameters)}`;

    // Cache for 7 days
    await redis.setex(cacheKey, 604800, JSON.stringify(result));
  }
}

/**
 * Batch refinement for efficiency
 */
async function batchRefinePages(
  sketchImages: Blob[],
  prompts: string[],
): Promise<RefinementResult[]> {
  const results = [];

  // Process in parallel (queue management)
  const batchSize = 5; // Adjust based on API limits

  for (let i = 0; i < sketchImages.length; i += batchSize) {
    const batch = sketchImages.slice(i, i + batchSize);
    const batchPrompts = prompts.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((sketch, idx) =>
        refineSketch({
          sketch,
          prompt: batchPrompts[idx],
        }),
      ),
    );

    results.push(...batchResults.filter(r => r.status === 'fulfilled').map(r => r.value));
  }

  return results;
}
```

### Quality Assurance

```typescript
/**
 * Automated quality checks for refined images
 */
class RefinementQA {

  async validateRefinement(
    originalSketch: Blob,
    refinedImage: Blob,
  ): Promise<{
    passed: boolean;
    score: number;
    issues: string[];
  }> {
    const checks = {
      structurePreservation: await this.checkStructureMatch(
        originalSketch,
        refinedImage,
      ),
      mangaQuality: await this.checkMangaCharacteristics(refinedImage),
      noArtifacts: await this.checkForArtifacts(refinedImage),
      consistency: await this.checkInternalConsistency(refinedImage),
    };

    const score =
      (checks.structurePreservation * 0.3 +
       checks.mangaQuality * 0.3 +
       (1 - checks.noArtifacts) * 0.2 +
       checks.consistency * 0.2) * 100;

    return {
      passed: score > 70,
      score,
      issues: this.identifyIssues(checks),
    };
  }

  /**
   * Check if refined image maintains sketch structure
   */
  private async checkStructureMatch(
    sketch: Blob,
    refined: Blob,
  ): Promise<number> {
    // Use perceptual hash comparison
    // Return 0-1 similarity score
    // Acceptable: >0.7
    return 0.85; // Placeholder
  }

  /**
   * Check for manga-specific quality markers
   */
  private async checkMangaCharacteristics(image: Blob): Promise<number> {
    // Check for:
    // - Proper linework quality
    // - Good contrast
    // - Appropriate screentone
    // - Professional appearance
    return 0.9; // Placeholder
  }

  /**
   * Detect artifacts and quality issues
   */
  private async checkForArtifacts(image: Blob): Promise<number> {
    // Return artifact score (0 = clean, 1 = many artifacts)
    return 0.05; // Placeholder: 5% artifacts
  }

  /**
   * Check internal consistency
   */
  private async checkInternalConsistency(image: Blob): Promise<number> {
    // Consistent lighting, character features, style
    return 0.88; // Placeholder
  }

  private identifyIssues(checks: Record<string, number>): string[] {
    const issues = [];
    if (checks.structurePreservation < 0.7) {
      issues.push('Refined image diverges significantly from sketch');
    }
    if (checks.mangaQuality < 0.7) {
      issues.push('Manga quality below acceptable threshold');
    }
    if (checks.noArtifacts > 0.3) {
      issues.push('Significant artifacts detected');
    }
    if (checks.consistency < 0.7) {
      issues.push('Internal consistency issues detected');
    }
    return issues;
  }
}
```

---

## Conclusion & Roadmap

### Implementation Phases

**Phase 1 (Weeks 1-2): MVP Sketch Refinement**
- [ ] Segmind ControlNet integration
- [ ] Basic sketch canvas (Fabric.js)
- [ ] Split-view comparison
- [ ] Prompt templating
- [ ] API endpoint: `/api/refine/sketch`

**Phase 2 (Weeks 3-4): Iterative Refinement**
- [ ] Inpainting support (area-specific refinement)
- [ ] Multiple comparison modes (slider, fade, overlay)
- [ ] Version history
- [ ] Refinement metadata storage
- [ ] LoRA integration for style customization

**Phase 3 (Weeks 5-6): Style Consistency**
- [ ] Style guide analysis from reference pages
- [ ] Character reference management
- [ ] Consistency validation
- [ ] Style lock feature
- [ ] Batch consistency refinement

**Phase 4 (Weeks 7-8): Advanced Features**
- [ ] Flux ControlNet integration (premium)
- [ ] Gemini Vision API for semantic segmentation
- [ ] Automated quality scoring
- [ ] Result caching and deduplication
- [ ] Fallback provider system

**Phase 5 (Weeks 9+): Polish & Scale**
- [ ] Performance optimization
- [ ] Cost tracking and reporting
- [ ] A/B testing framework
- [ ] User feedback integration
- [ ] Documentation and tutorials

### Success Metrics

```
Target Metrics:
├─ Refinement accuracy: >75% user satisfaction
├─ Processing speed: <30s end-to-end
├─ Cost per refinement: <$0.01 (at scale)
├─ Style consistency: >85% continuity across panels
├─ Artifact rate: <5% images with visible issues
└─ Adoption: >40% of studio users use refinement feature
```

---

## References

### Official Documentation
- [Segmind API Docs](https://docs.segmind.com/)
- [Replicate ControlNet](https://replicate.com/jagilley/controlnet-scribble)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Flux by Black Forest Labs](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- [Leonardo AI Docs](https://docs.leonardo.ai/)

### Research Papers
- [ControlNet: Adding Spatial Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)
- [Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2112.10752)
- [Attention-Based Models for Speech Recognition](https://arxiv.org/abs/1506.02595)

### Community Resources
- [Civitai - Manga LoRA Models](https://civitai.com)
- [Hugging Face Diffusers](https://huggingface.co/docs/diffusers)
- [ComfyUI Workflows](https://github.com/comfyanonymous/ComfyUI)

---

**Document Status:** Production-Ready
**Version:** 2.0
**Last Updated:** 2025-11-17
**Maintainer:** MangaFusion Development Team

For implementation questions or updates, refer to the main MangaFusion repository documentation.

# Sketch-to-Manga Refinement: Detailed Wireframes & Component Specs

**Document Version:** 1.0
**Date:** 2025-11-17
**Purpose:** Complete wireframe designs and React component specifications

---

## Table of Contents

1. [Page-Level Wireframes](#page-level-wireframes)
2. [Component Specifications](#component-specifications)
3. [State Management](#state-management)
4. [Responsive Layouts](#responsive-layouts)
5. [Accessibility Guidelines](#accessibility-guidelines)

---

## Page-Level Wireframes

### Wireframe 1: Refinement Tool Page (`/refine/[pageId]`)

#### Desktop Layout (1920x1080)

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                         │
│ [← Back] | Drawing Tools | [Undo] [Redo] [Clear] | [Refine ✨]    │
├─────────────────────────────────────────────┬──────────────────────┤
│                                             │                      │
│                                             │  REFINEMENT PANEL    │
│     CANVAS AREA (60%)                       │  (40%)               │
│     ┌──────────────────────────────────┐   │ ┌──────────────────┐ │
│     │                                  │   │ │ Title:          │ │
│     │   768x1024px White Canvas        │   │ │ Refine with AI  │ │
│     │                                  │   │ │                 │ │
│     │   [Drawing Here]                 │   │ │ Description:    │ │
│     │                                  │   │ │ [__________..]  │ │
│     │                                  │   │ │                 │ │
│     │                                  │   │ │ Style:          │ │
│     │                                  │   │ │ [Manga ▼]       │ │
│     │                                  │   │ │                 │ │
│     │                                  │   │ │ Strength:       │ │
│     │                                  │   │ │ ◄────●────► 50% │ │
│     │                                  │   │ │                 │ │
│     │                                  │   │ │ Advanced ▼      │ │
│     │                                  │   │ │                 │ │
│     │                                  │   │ │ [Refine with AI]│ │
│     └──────────────────────────────────┘   │ │                 │ │
│                                             │ └──────────────────┘ │
│     TOOLS PALETTE (Bottom)                  │                      │
│     ┌──────────────────────────────────┐   │                      │
│     │ Brush: [●●●] 8px | [Eraser]     │   │                      │
│     │ Color: [●] | Opacity: [████] 100%   │                      │
│     │ Zoom: [████] 100% | Pan [Reset]│   │                      │
│     └──────────────────────────────────┘   │                      │
└─────────────────────────────────────────────┴──────────────────────┘
```

#### Tablet Layout (768x1024)

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│ [← Back] [Undo] [Redo] [Clear]         │
├─────────────────────────────────────────┤
│                                         │
│     CANVAS AREA                        │
│     ┌────────────────────────────────┐ │
│     │                                │ │
│     │   768x1024px Canvas            │ │
│     │                                │ │
│     │   [Drawing Here]               │ │
│     │                                │ │
│     │                                │ │
│     └────────────────────────────────┘ │
│                                         │
│     TOOLS & OPTIONS                    │
│     ┌────────────────────────────────┐ │
│     │ Brush: [●●●] | Size: [████]   │ │
│     │ Color: [●] | Opacity: [████]  │ │
│     │ Style: [Manga ▼]               │ │
│     │ Strength: [████░░░] 50%        │ │
│     │ [Refine with AI ✨]           │ │
│     └────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Mobile Layout (375x667)

```
┌──────────────────────┐
│ [←] [⟳] [✕] [✨]    │
├──────────────────────┤
│                      │
│   CANVAS (responsive)│
│   ┌────────────────┐ │
│   │                │ │
│   │  Canvas Area   │ │
│   │                │ │
│   └────────────────┘ │
│                      │
│ TOOLBAR              │
│ [Brush][Eraser][…]   │
│                      │
│ Brush: [●●●●]       │
│ Color: [●] Opacity: [████] │
│                      │
│ Style: [Manga ▼]    │
│ Power: [████░░] 60% │
│                      │
│ [Refine ✨]         │
│                      │
└──────────────────────┘
```

---

### Wireframe 2: Comparison View

#### Full Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] | [Split][Slider][Fade][Layer] | Zoom: [100%]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────────┬───────────────────────────┐  │
│  │                       │                           │  │
│  │    ORIGINAL SKETCH    │    REFINED IMAGE          │  │
│  │                       │                           │  │
│  │  ┌─────────────────┐  │  ┌─────────────────────┐  │  │
│  │  │                 │  │  │                     │  │  │
│  │  │  [Sketch drawn] │  │  │  [Refined version]  │  │  │
│  │  │                 │  │  │                     │  │  │
│  │  │                 │  │  │                     │  │  │
│  │  └─────────────────┘  │  └─────────────────────┘  │  │
│  │  768x1024px           │  768x1024px               │  │
│  │                       │                           │  │
│  └───────────────────────┴───────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  QUALITY METRICS:                                       │
│  Sketch Preservation: ████░░░░ 87%                     │
│  Manga Style: █████████░ 92%                           │
│  Detail Enhancement: ███████░░ 78%                     │
│  Processing Time: 45 seconds                           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [Accept & Save] [Retry Settings] [Discard]             │
└──────────────────────────────────────────────────────────┘
```

#### Slider View Detail

```
┌─────────────────────────────────────────┐
│ [Slider] [Split] [Fade] [Layer]         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                          │       │   │
│  │    Refined Image         │Sketch│   │
│  │                          │       │   │
│  │  ┌──────────────────┐    │  ┌──────┐ │
│  │  │                  │    │  │      │ │
│  │  │  [Refined half]  │    │  │Sketch│ │
│  │  │                  │    │  │half  │ │
│  │  │                  │    │  │      │ │
│  │  └──────────────────┘    │  └──────┐ │
│  │          ← Click to slide → │       │ │
│  │     Sketch     │    Refined  │       │ │
│  │                            │       │ │
│  └─────────────────────────────────────┘ │
│ Drag handle left/right to compare      │
│                                         │
└─────────────────────────────────────────┘
```

#### Fade View Detail

```
┌─────────────────────────────────────────┐
│ [Fade] [Split] [Slider] [Layer]         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Image with 50% opacity blend] │   │
│  │  Shows both versions overlaid    │   │
│  │                                 │   │
│  │  Opacity: ◄───────●──────► 50% │   │
│  │           Sketch  Blend  Refined│   │
│  │                                 │   │
│  │  ☑ Show Original                │   │
│  │  ☑ Show Refined                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│ Drag slider to adjust opacity          │
│                                         │
└─────────────────────────────────────────┘
```

---

### Wireframe 3: Bulk Refinement Progress

```
┌────────────────────────────────────────────────────┐
│ Bulk Refinement In Progress - Episode: Shadow      │
├────────────────────────────────────────────────────┤
│                                                    │
│ Progress: 4 / 10 pages (40%)                      │
│ ████████░░░░░░░░░░░░░░░                           │
│                                                    │
│ Estimated time remaining: 15 minutes              │
│ Cost so far: $1.00 / $2.50 estimated              │
│                                                    │
├────────────────────────────────────────────────────┤
│ CURRENT PAGE: 4                                    │
│ Status: Generating base image (55% complete)      │
│ Time on this page: 35 seconds                      │
│ ⟳ ⟳ ⟳                                              │
│                                                    │
├────────────────────────────────────────────────────┤
│ COMPLETED PAGES:                                   │
│                                                    │
│ ✓ Page 1 [Accepted] [Review] [Retry]             │
│ ✓ Page 2 [Accepted] [Review] [Retry]             │
│ ⚠ Page 3 [Manual Review] [→] (87% confidence)    │
│ ⟳ Page 4 [In Progress...]                         │
│                                                    │
│ PENDING:                                           │
│ ○ Pages 5-10 (Waiting to process)                 │
│                                                    │
├────────────────────────────────────────────────────┤
│ [← Cancel Job]  [⏸ Pause]  [View Report]         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Wireframe 4: Studio Editor Integration

```
┌────────────────────────────────────────────────────┐
│ ← Episode | Page 1/10                              │
├─────────────────┬─────────────────┬────────────────┤
│  PAGE LIST      │    CANVAS       │    TOOLS       │
│  (200px)        │    (1200px)     │    (300px)     │
├─────────────────┤                 │                │
│ Pages:          │                 │ [Tools] [Refine]│
│ ─────────────── │                 │ ─────────────── │
│ [Page 1]★       │  ┌────────────┐ │                │
│  Page 2         │  │            │ │ Sketch Refine: │
│  Page 3         │  │            │ │ ──────────────  │
│  Page 4         │  │  Canvas    │ │                │
│  Page 5         │  │  768x1024  │ │ [Upload] or    │
│  Page 6         │  │            │ │ [Draw]         │
│  Page 7         │  │  [Image]   │ │                │
│  Page 8         │  │            │ │ Description:   │
│  Page 9         │  │            │ │ [________]     │
│  Page 10        │  │            │ │                │
│                 │  └────────────┘ │ Style:[Manga▼] │
│                 │                 │ Power:[████░] │
│                 │                 │                │
│                 │                 │ [Quick Refine] │
│                 │                 │                │
│                 │                 │ Or Tab 1: Tools│
│                 │                 │ Or Tab 2: Text │
│                 │                 │                │
└─────────────────┴─────────────────┴────────────────┘
```

---

## Component Specifications

### Component 1: Canvas Drawing Area

**File:** `/components/SketchCanvas.tsx`

```typescript
interface SketchCanvasProps {
  width: number;           // Default: 768
  height: number;          // Default: 1024
  backgroundColor?: string; // Default: 'white'
  showGrid?: boolean;       // Default: false
  gridSize?: number;        // Default: 10 (pixels)
  onSketchChange?: (dataUrl: string) => void;
  onBrushChange?: (size: number, opacity: number) => void;
  autosaveInterval?: number; // Default: 30000 (30s)
}

// Features:
// - Smooth brush strokes with pressure sensitivity
// - 50-level undo/redo stack
// - Pan and zoom controls
// - Color picker integration
// - Touch support (stylus + finger)
// - Auto-save to localStorage

// Public Methods:
// - clear(): void
// - undo(): void
// - redo(): void
// - getCanvas(): HTMLCanvasElement
// - exportAsBlob(format: 'png' | 'jpeg'): Promise<Blob>
// - importImage(blob: Blob): Promise<void>
// - setGridVisible(visible: boolean): void
```

**Styling:**
```css
.sketch-canvas {
  position: relative;
  display: inline-block;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

.sketch-canvas canvas {
  display: block;
  user-select: none;
}

.sketch-canvas:focus-within {
  border-color: #9333ea;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}
```

---

### Component 2: Refinement Options Panel

**File:** `/components/RefinementOptions.tsx`

```typescript
interface RefinementOptionsProps {
  onRefine: (config: RefinementConfig) => Promise<void>;
  isLoading?: boolean;
  sketchUrl: string; // Required
  pageId: string;    // Optional, for context
  defaultStyle?: string;
  defaultStrength?: number;
}

interface RefinementConfig {
  promptDescription?: string;
  style: 'shonen' | 'shojo' | 'seinen' | 'cyberpunk' | 'classic';
  strength: number; // 0-100
  provider: 'gemini' | 'segmind';
  model?: string;
  temperature?: number;
  seed?: number;
  enhanceContrast?: boolean;
  maintainAspectRatio?: boolean;
}

// Features:
// - Preset style selector with visual examples
// - Strength slider with preview
// - Collapsible advanced options
// - Estimated cost and time calculation
// - Multi-step form with validation
// - Auto-save preferences

// Public Methods:
// - getConfig(): RefinementConfig
// - setConfig(config: Partial<RefinementConfig>): void
// - reset(): void
```

**Styling:**
```css
.refinement-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.refinement-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.refinement-field label {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.refinement-field input,
.refinement-field select,
.refinement-field textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.refinement-field textarea {
  resize: vertical;
  min-height: 80px;
}

.strength-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-slider input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #dbeafe 0%, #9333ea 50%, #7c3aed 100%);
  outline: none;
}

.strength-value {
  font-weight: 600;
  color: #9333ea;
  min-width: 50px;
  text-align: right;
}

.refinement-button {
  padding: 12px 16px;
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refinement-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.refinement-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.advanced-options {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.advanced-options.collapsed {
  display: none;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
}

.advanced-toggle:hover {
  color: #9333ea;
}

.advanced-toggle svg {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}

.advanced-toggle.open svg {
  transform: rotate(180deg);
}
```

---

### Component 3: Comparison Viewer

**File:** `/components/ComparisonViewer.tsx`

```typescript
interface ComparisonViewerProps {
  originalUrl: string;
  refinedUrl: string;
  mode?: 'split' | 'slider' | 'fade' | 'overlay' | 'difference';
  onModeChange?: (mode: string) => void;
  showInfo?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
  isLoading?: boolean;
}

// Features:
// - Multiple comparison modes
// - Synchronized zoom/pan
// - Quality metrics display
// - Image info panel
// - Action buttons (accept/reject/retry)
// - Full-screen mode option
// - Download capability

// Public Methods:
// - setMode(mode: string): void
// - zoomIn(): void
// - zoomOut(): void
// - resetView(): void
// - exportComparison(): Promise<Blob>
```

**Styling:**
```css
.comparison-viewer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.comparison-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-modes {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-button.active {
  background: #9333ea;
  color: white;
  border-color: #9333ea;
}

.mode-button:hover {
  border-color: #9333ea;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-button:hover {
  background: #f3f4f6;
}

.comparison-content {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: #f3f4f6;
  overflow: hidden;
}

/* Split View */
.comparison-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
  gap: 1px;
  background: #e5e7eb;
}

.comparison-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  overflow: hidden;
}

.comparison-side-label {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 10;
}

.comparison-side img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Slider View */
.comparison-slider {
  position: relative;
  width: 100%;
  height: 100%;
}

.comparison-slider-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.comparison-slider-before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.comparison-slider-before img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comparison-slider-after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.comparison-slider-after img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comparison-slider-handle {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: white;
  box-shadow: -20px 0 20px rgba(0, 0, 0, 0.3), 20px 0 20px rgba(0, 0, 0, 0.3);
  cursor: ew-resize;
  transform: translateX(-50%);
  z-index: 20;
}

.comparison-slider-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 25;
  white-space: nowrap;
}

/* Fade View */
.comparison-fade {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-fade img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.comparison-fade-slider {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 300px;
  z-index: 20;
}

/* Info Panel */
.comparison-info {
  padding: 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-label {
  font-weight: 500;
  color: #1f2937;
}

.info-value {
  color: #9333ea;
  font-weight: 600;
}

/* Actions */
.comparison-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.action-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.action-button.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.secondary {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.action-button.secondary:hover {
  background: #f9fafb;
  border-color: #9333ea;
  color: #9333ea;
}

.action-button.danger {
  background: white;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.action-button.danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### Component 4: Bulk Progress Display

**File:** `/components/BulkRefinementProgress.tsx`

```typescript
interface BulkRefinementProgressProps {
  jobId: string;
  totalPages: number;
  onComplete?: (result: BulkResult) => void;
  onCancel?: () => void;
  pollingInterval?: number; // Default: 2000ms
}

interface BulkResult {
  totalPages: number;
  acceptedCount: number;
  rejectedCount: number;
  totalTime: number;
  totalCost: number;
  errorDetails: string[];
}

// Features:
// - Real-time progress tracking
// - Per-page status display
// - Auto-polling with configurable interval
// - Pause/resume controls
// - Cancel with confirmation
// - Page-by-page review interface
// - Final report generation

// Public Methods:
// - pause(): Promise<void>
// - resume(): Promise<void>
// - cancel(): Promise<void>
// - getProgress(): BulkProgress
// - exportReport(): Promise<Blob>
```

---

### Component 5: Page Card Enhancement

**File:** `/components/PageCard.tsx` (Modified)

```typescript
interface PageCardProps {
  page: number;
  imageUrl: string;
  progress?: number;
  error?: string;
  onEdit?: () => void;
  onRefine?: () => void;      // NEW
  onDownload?: () => void;
  isGenerating?: boolean;
  hasRefinement?: boolean;    // NEW - shows indicator
  refinementCount?: number;   // NEW - shows how many refinements exist
}

// New button added to card:
<button
  onClick={onRefine}
  className="page-card-button refine"
  title="Refine this sketch"
>
  <svg className="icon-sparkles">✨</svg>
  <span>Refine Sketch</span>
</button>

// Visual indicator for refined pages:
{hasRefinement && (
  <div className="refinement-badge" title={`${refinementCount} refinement versions`}>
    ✨ {refinementCount}
  </div>
)}
```

---

## State Management

### Refinement Tool Page State

```typescript
// /pages/refine/[pageId].tsx
const [canvasState, setCanvasState] = useState<CanvasState>({
  // Canvas drawing state
  strokes: [],
  undoStack: [],
  redoStack: [],
  currentBrushSize: 8,
  currentOpacity: 1.0,
  currentColor: '#000000',
});

const [refinementConfig, setRefinementConfig] = useState<RefinementConfig>({
  promptDescription: '',
  style: 'shonen',
  strength: 50,
  provider: 'gemini',
  temperature: 0.7,
  seed: undefined,
  enhanceContrast: true,
});

const [refinementState, setRefinementState] = useState<RefinementState>({
  status: 'idle', // 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: 0,
  currentStep: '',
  sketchUrl: '',
  refinedUrl: '',
  qualityScore: 0,
  processingTime: 0,
  error: null,
});

const [comparisonMode, setComparisonMode] = useState<'split' | 'slider' | 'fade' | 'overlay'>('split');
```

### Episode Page State Enhancement

```typescript
// /pages/episodes/[id].tsx
const [pages, setPages] = useState<Record<number, PageState & {
  // NEW fields
  refinementCount?: number;
  latestRefinement?: RefinementVersion;
  hasRefinement?: boolean;
}>>({});

const [refinementJob, setRefinementJob] = useState<BulkRefinementJob | null>(null);
```

---

## Responsive Layouts

### Canvas Responsive Behavior

```typescript
// Auto-adjust canvas size based on viewport
const getCanvasSize = () => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  if (viewport.width < 640) {
    // Mobile: full-width, height based on aspect ratio
    return {
      width: viewport.width - 16, // 8px padding each side
      height: Math.round((viewport.width - 16) * 1024 / 768)
    };
  } else if (viewport.width < 1024) {
    // Tablet: portrait
    return { width: 600, height: 800 };
  } else if (viewport.width < 1280) {
    // Tablet: landscape
    return { width: 500, height: 667 };
  } else {
    // Desktop: standard
    return { width: 768, height: 1024 };
  }
};
```

### Layout Grid System

```css
/* Desktop: 2-column (canvas + options) */
@media (min-width: 1400px) {
  .refinement-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

/* Tablet: Stacked (canvas, then options) */
@media (max-width: 1399px) and (min-width: 768px) {
  .refinement-container {
    display: flex;
    flex-direction: column;
  }
}

/* Mobile: Full-width */
@media (max-width: 767px) {
  .refinement-container {
    display: flex;
    flex-direction: column;
    padding: 8px;
  }

  .refinement-options {
    margin-top: 16px;
  }
}
```

---

## Accessibility Guidelines

### ARIA Labels & Roles

```typescript
// Canvas element
<canvas
  role="img"
  aria-label="Drawing canvas for sketch refinement"
  aria-describedby="canvas-instructions"
/>

<div id="canvas-instructions" className="sr-only">
  Use your mouse or stylus to draw on the canvas.
  Use Ctrl+Z to undo, Ctrl+Shift+Z to redo.
</div>

// Refinement options
<form
  role="form"
  aria-labelledby="refinement-title"
  onSubmit={handleRefine}
>
  <h2 id="refinement-title">Refinement Options</h2>

  <fieldset>
    <legend>Description (Optional)</legend>
    <textarea
      aria-label="Describe what you want in the refined image"
      aria-describedby="desc-help"
    />
    <p id="desc-help" className="help-text">
      Be specific about style, mood, or changes you want
    </p>
  </fieldset>

  <fieldset>
    <legend>Manga Style</legend>
    <select aria-label="Select manga style">
      {/* options */}
    </select>
    <p className="help-text">
      Different styles affect the visual appearance
    </p>
  </fieldset>
</form>

// Comparison viewer
<div
  role="region"
  aria-live="polite"
  aria-label="Original and refined image comparison"
>
  {/* comparison content */}
</div>
```

### Keyboard Navigation

```typescript
// Canvas shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 's') {
        e.preventDefault();
        saveCanvas();
      }
    }

    if (e.key === 'Escape') {
      closeRefinement();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// Button focus states
button:focus-visible {
  outline: 2px solid #9333ea;
  outline-offset: 2px;
}
```

### Color Contrast

```css
/* WCAG AA compliant */
.action-button.primary {
  /* Purple bg (#9333ea) on white: 4.52:1 contrast */
  color: white;
}

.comparison-controls {
  /* Dark text (#1f2937) on light bg (#f9fafb): 14.3:1 contrast */
  color: #1f2937;
  background: #f9fafb;
}

/* Mode buttons - high contrast */
.mode-button {
  /* Black text on white: 21:1 contrast */
  color: #000;
  background: white;
}

.mode-button.active {
  /* White text on purple: 3.98:1 contrast */
  color: white;
  background: #9333ea;
}
```

### Screen Reader Support

```typescript
// Live region for processing updates
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  Processing step {currentStep} of {totalSteps}: {stepDescription}.
  {estimatedTime} remaining.
</div>

// Progress indicator with accessible label
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
  {progress}% complete
</div>

// Error messages
<div role="alert" aria-live="assertive">
  {error && <p>{error}</p>}
</div>
```

---

## Additional Resources

### Design System Colors

```typescript
const colors = {
  // Primary
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    600: '#9333ea',
    700: '#7c3aed'
  },
  // Success
  green: {
    50: '#f0fdf4',
    600: '#10b981',
    700: '#059669'
  },
  // Error
  red: {
    50: '#fef2f2',
    600: '#ef4444'
  },
  // Neutral
  gray: {
    50: '#f9fafb',
    200: '#e5e7eb',
    300: '#d1d5db',
    600: '#4b5563',
    700: '#374151',
    900: '#111827'
  }
};
```

### Typography Scale

```typescript
const typography = {
  title: { size: '28px', weight: 700, lineHeight: 1.3 },
  heading: { size: '20px', weight: 600, lineHeight: 1.4 },
  subheading: { size: '16px', weight: 600, lineHeight: 1.5 },
  body: { size: '14px', weight: 400, lineHeight: 1.6 },
  caption: { size: '12px', weight: 400, lineHeight: 1.5 },
  code: { size: '13px', weight: 500, family: 'monospace' }
};
```

---

**Document Status:** Complete
**Next Step:** Implement Phase 1 components
**Last Updated:** 2025-11-17

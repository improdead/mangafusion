# MangaFusion Drawing Feature - Implementation Guide
## Quick Reference for Development Team

---

## Quick Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  MangaFusion Studio - Drawing Editor                            │
├─────────────────────────────────────────────────────────────────┤
│ File | Edit | View | Tools | Help    [🔍 100%] [🔄] [⚙]       │
├─────────────────┬────────────────────────┬──────────────────────┤
│                 │                        │                      │
│  TOOLS          │                        │   RIGHT PANEL        │
│  PANEL          │   MAIN CANVAS          │   (240px width)      │
│                 │                        │                      │
│ [B] Brush       │    Drawing Area        │   LAYERS TAB         │
│ [E] Eraser      │                        │   ─────────────      │
│ [O] Eyedrop     │    ┌──────────────┐    │   [+] [-] [⋮]       │
│ [K] Fill        │    │              │    │                      │
│ [S] Select      │    │  Canvas      │    │   ┌─ Group: Ink   ┐  │
│ [T] Text        │    │  (1024x768)  │    │   │ Layer: Lines  │  │
│                 │    │              │    │   │ Layer: Details│  │
│ ─────────────   │    │              │    │   └────────────────┘ │
│ [■] [■]         │    │              │    │   ┌─ Group: Color  ┐ │
│ Colors          │    └──────────────┘    │   │ Layer: Skin   │  │
│                 │                        │   │ Layer: Hair   │  │
│                 │                        │   │ Layer: Clothes│ │
│                 │                        │   └────────────────┘ │
│                 │                        │   ☑ Background       │
│                 │                        │                      │
├─────────────────┼────────────────────────┼──────────────────────┤
│ Status: Ready   │ Brush: Pen | Size: 48px | Opacity: 100%       │
└─────────────────┴────────────────────────┴──────────────────────┘
```

---

## Phase 1 MVP: Core Features Checklist

### Canvas & Drawing
- [ ] HTML5 Canvas setup (1024x768 default, scalable)
- [ ] Brush tool implementation
  - [ ] Circular brush
  - [ ] Size control (1-300px)
  - [ ] Opacity control (0-100%)
  - [ ] Smooth antialiasing
- [ ] Eraser tool
- [ ] Color picker (eyedropper)
- [ ] Pan/Zoom navigation
  - [ ] Space+drag to pan
  - [ ] Ctrl+scroll or buttons to zoom
  - [ ] Fit-to-screen button

### Layers
- [ ] Layer data structure
- [ ] Layer list UI
- [ ] Show/hide toggle
- [ ] Basic layer operations (create, delete)
- [ ] Active layer indicator

### Color Management
- [ ] Color input (HEX, RGB)
- [ ] Recent colors history (5 colors)
- [ ] Foreground/background color swap

### History
- [ ] Undo functionality (Ctrl+Z)
- [ ] Redo functionality (Ctrl+Y)
- [ ] History limit (10 steps minimum)

### Keyboard Shortcuts
- [ ] B = Brush tool
- [ ] E = Eraser tool
- [ ] O = Color picker
- [ ] Ctrl+Z = Undo
- [ ] Ctrl+Y = Redo
- [ ] Space+drag = Pan
- [ ] [ = Decrease brush size
- [ ] ] = Increase brush size

### File Operations
- [ ] Save project to server
- [ ] Load project from server
- [ ] Export as PNG/JPEG

---

## Phase 2: Enhanced Features

### Brush System
- [ ] Brush presets (5-10 default)
- [ ] Brush categories (Sketch, Ink, Paint)
- [ ] Save custom brushes
- [ ] Brush size/opacity quick presets

### Layer Enhancements
- [ ] Layer groups/folders
- [ ] Rename layers (inline edit)
- [ ] Blend modes (Normal, Multiply, Screen, Overlay)
- [ ] Layer opacity

### Tools
- [ ] Pencil tool (hard edge)
- [ ] Fill bucket
- [ ] Selection tool (rectangular)
- [ ] Text tool

### Manga Features
- [ ] Screentone/pattern fill (basic)
- [ ] Speed lines effect
- [ ] Panel divider tool

### UI Improvements
- [ ] Brush library panel
- [ ] History/undo panel
- [ ] Color swatches panel
- [ ] Tool options panel

---

## Technology Stack Recommendations

### Frontend
```
Framework: Next.js 15 (already in use)
Canvas: HTML5 Canvas API (raw, not fabric.js yet)
State: React hooks + Context API
Styling: Tailwind CSS (already in use)
Storage: Supabase (already integrated)
```

### Canvas Rendering Pattern
```typescript
// Optimal rendering loop for drawing apps
function animationLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render each layer in order
  layers.forEach(layer => {
    if (layer.visible) {
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layer.canvas, 0, 0);
    }
  });
  ctx.globalAlpha = 1;

  // Render preview stroke (mouse following)
  if (isDrawing) {
    drawPreviewStroke(ctx, currentStroke);
  }

  requestAnimationFrame(animationLoop);
}
```

### Layer Data Structure
```typescript
interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;           // Off-screen canvas for layer
  visible: boolean;
  opacity: number;                     // 0-100
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  position: number;                    // 0 = bottom, higher = top
  group?: string;                      // For layer groups
  locked?: boolean;
}

interface DrawingProject {
  id: string;
  title: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasHeight: number;
  layers: Layer[];
  history: DrawAction[];
  currentHistoryIndex: number;
}

interface DrawAction {
  type: 'stroke' | 'erase' | 'fill' | 'layerCreate' | 'layerDelete';
  layerId: string;
  data: any;                          // Tool-specific data
  timestamp: number;
}
```

---

## File Structure (Recommended)

```
/pages
  /studio
    /drawing
      index.tsx              # Main drawing editor page

/components
  /drawing
    DrawingCanvas.tsx        # Canvas rendering component
    ToolPanel.tsx            # Left toolbar
    LayersPanel.tsx          # Right layers panel
    ColorPanel.tsx           # Color selector
    TopMenu.tsx              # File, Edit menus
    PropertiesPanel.tsx      # Brush/tool properties

/lib/drawing
  canvasRenderer.ts         # Canvas rendering utilities
  drawingEngine.ts          # Core drawing logic
  layerManager.ts           # Layer operations
  historyManager.ts         # Undo/Redo system
  brushEngine.ts            # Brush mechanics
  colorManager.ts           # Color utilities
  shortcuts.ts              # Keyboard handling

/hooks
  useDrawingState.ts        # Drawing context hook
  useCanvasHistory.ts       # Undo/redo hook
  useKeyboardShortcuts.ts   # Shortcut handling hook
```

---

## API Endpoints Needed

### Project Management
```
POST   /api/drawing/projects          # Create new project
GET    /api/drawing/projects/:id      # Load project
PUT    /api/drawing/projects/:id      # Save project
DELETE /api/drawing/projects/:id      # Delete project
```

### Layers
```
POST   /api/drawing/projects/:id/layers        # Create layer
PUT    /api/drawing/projects/:id/layers/:lid   # Update layer
DELETE /api/drawing/projects/:id/layers/:lid   # Delete layer
GET    /api/drawing/projects/:id/layers        # List layers
```

### Export
```
POST   /api/drawing/projects/:id/export/png    # Export as PNG
POST   /api/drawing/projects/:id/export/jpeg   # Export as JPEG
POST   /api/drawing/projects/:id/export/webp   # Export as WebP
```

---

## Component API Examples

### DrawingCanvas Component
```typescript
interface DrawingCanvasProps {
  projectId: string;
  width: number;
  height: number;
  onSave: (project: DrawingProject) => Promise<void>;
  readonly?: boolean;
}

// Usage:
<DrawingCanvas
  projectId={episodeId}
  width={1024}
  height={768}
  onSave={handleProjectSave}
/>
```

### ToolPanel Component
```typescript
interface ToolPanelProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  onBrushChange: (brush: BrushSettings) => void;
}

type ToolType = 'brush' | 'eraser' | 'colorpicker' | 'fill' | 'selection' | 'text';
```

### LayersPanel Component
```typescript
interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerCreate: () => void;
}
```

---

## Keyboard Shortcut Implementation

### Priority Matrix
```
CRITICAL (Day 1)    | IMPORTANT (Week 1)  | NICE-TO-HAVE (Week 2+)
──────────────────  | ───────────────────  | ──────────────────────
B = Brush           | X = Swap colors      | [ = Decrease size
E = Eraser          | D = Reset colors     | ] = Increase size
O = Color Picker    | S = Selection        | Shift+L = Rulers
K = Fill            | T = Text             | Alt+Z = Rotate
Ctrl+Z = Undo       | / = Search help      | G = Grid toggle
Ctrl+Y = Redo       | P = Pan tool         | Ctrl+S = Save
Space = Pan (hold)  | 1-9 = Opacity       | Ctrl+Shift+E = Export
Tab = Hide UI       | A = Select all       | Ctrl+D = Deselect
```

---

## Performance Optimization Checklist

### Rendering
- [ ] Use requestAnimationFrame for smooth updates
- [ ] Only redraw changed portions (dirty rectangle optimization)
- [ ] Cache layer composites when layers don't change
- [ ] Limit FPS to 60 (tie to display refresh rate)
- [ ] Debounce frequent updates (brush size changes, etc.)

### Memory
- [ ] Limit undo history to 50 steps
- [ ] Compress canvas data before saving
- [ ] Release unused image data
- [ ] Monitor canvas memory usage
- [ ] Use OffscreenCanvas for web workers (future)

### Canvas Size Limits
```javascript
// Recommended maximum dimensions
const MAX_CANVAS_SIZE = 4096 * 4096; // 16MP pixels
const DEFAULT_SIZE = 1024 * 768;      // 0.75MP pixels

// Warn user if exceeding
if (width * height > 2048 * 2048) {
  console.warn('Large canvas may impact performance');
}
```

---

## Mobile Adaptation Strategy

### Responsive Breakpoints
```css
/* Desktop (>= 1200px) */
.layout {
  grid-template-columns: 240px 1fr 240px;
}

/* Tablet (768px - 1199px) */
@media (max-width: 1199px) {
  .toolPanel { position: absolute; left: 0; transform: translateX(-100%); }
  .layersPanel { position: absolute; right: 0; transform: translateX(100%); }
  .layout {
    grid-template-columns: 1fr;
  }
}

/* Mobile (< 768px) */
@media (max-width: 767px) {
  .topMenu { display: none; }  /* Use hamburger menu */
  .canvas { width: 100vw; height: 100vh; }
}
```

### Touch Gestures for Mobile
```javascript
// Undo/Redo
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    // Two-finger tap = undo
    if (Date.now() - lastTouchTime < 200) {
      handleUndo();
    }
  }
  if (e.touches.length === 3) {
    // Three-finger tap = redo
    handleRedo();
  }
  lastTouchTime = Date.now();
});

// Brush size adjustment
canvas.addEventListener('touchmove', (e) => {
  if (isMovingBrushSizeHandle) {
    const delta = e.touches[0].clientX - lastX;
    setBrushSize(brushSize + delta);
    lastX = e.touches[0].clientX;
  }
});
```

---

## Browser Support & Testing

### Target Browsers
```
Chrome       >= 90 (Full support)
Firefox      >= 88 (Full support)
Safari       >= 14 (Good support, lacks some properties)
Edge         >= 90 (Full support)
Mobile Safari >= 14 (Good support)
```

### Essential APIs to Test
- Pointer Events (pressure, tilt)
- Canvas rendering context
- Touch events
- Local storage (project cache)
- Service workers (offline support - future)

### Testing Checklist
```
[ ] Brush drawing on desktop
[ ] Brush drawing with tablet/stylus
[ ] Touch drawing on mobile
[ ] Pressure sensitivity
[ ] Undo/redo functionality
[ ] Layer visibility toggle
[ ] Color picker
[ ] Zoom in/out
[ ] Pan canvas
[ ] Save/load project
[ ] Keyboard shortcuts work
[ ] UI responsive on mobile
[ ] Performance on large canvas
[ ] Memory usage stable during long drawing session
```

---

## Integration with Existing MangaFusion Features

### Character Assets Integration
```typescript
// Load character pose as reference layer
async function loadCharacterReference(characterId: string) {
  const response = await fetch(`/api/characters/${characterId}/asset`);
  const imageUrl = (await response.json()).imageUrl;

  const layer: Layer = {
    id: `ref-${characterId}`,
    name: `Character: ${characterId}`,
    canvas: await imageToCanvas(imageUrl),
    opacity: 50,  // Half transparent for reference
    locked: true,
    position: 0   // At bottom of stack
  };

  addLayer(layer);
}
```

### Style References Integration
```typescript
// Display style reference panel alongside drawing
interface StyleReferencesProps {
  episodeId: string;
  onSelectReference: (url: string) => void;
}

// Could be collapsible panel showing episode's style refs
// for artist to reference while drawing
```

### Page Integration
```typescript
// Each manga page can have multiple drawing layers
interface MangaPage {
  id: string;
  pageNumber: number;
  drawingProject?: DrawingProject;  // Associated drawing
  generatedImageUrl: string;        // Original generated image
}
```

---

## Common Pitfalls & Solutions

### Issue: Canvas appears blurry on high-DPI displays
**Solution:**
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = 1024 * dpr;
canvas.height = 768 * dpr;
ctx.scale(dpr, dpr);
```

### Issue: Mouse/touch events not precise
**Solution:**
```javascript
function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}
```

### Issue: Memory leak from undo history
**Solution:**
```javascript
// Limit history size
if (history.length > MAX_HISTORY) {
  const oldest = history.shift();
  oldest.data = null;  // Release memory
}
```

### Issue: Brush stroke lag on complex scenes
**Solution:**
```javascript
// Use off-screen canvas for current stroke
const strokeCanvas = new OffscreenCanvas(1024, 768);
const strokeCtx = strokeCanvas.getContext('2d');
// Draw to strokeCanvas, then composite to main canvas
```

---

## Success Metrics (MVP)

- [ ] Draw smooth strokes with any brush
- [ ] Undo/redo works instantly
- [ ] Layer operations work (create, delete, reorder, hide/show)
- [ ] Save/load project < 2 seconds
- [ ] No noticeable lag during normal drawing
- [ ] Mobile version usable on iPad
- [ ] All keyboard shortcuts responsive
- [ ] Export as PNG works
- [ ] UI accessible and intuitive for new users

---

## Timeline Estimate

**Phase 1 MVP: 3-4 weeks**
- Week 1: Canvas setup, basic brush, color picker
- Week 2: Layers system, undo/redo
- Week 3: Save/load, export, UI polish
- Week 4: Testing, bug fixes, performance tuning

**Phase 2 Enhanced: 3-4 weeks**
- Brush presets, layer groups, blend modes
- Additional tools (pencil, fill, text)
- Manga-specific features
- Mobile adaptation

**Phase 3 Polish: 2-3 weeks**
- Performance optimization
- Accessibility improvements
- Advanced features (dynamics, masks)
- Collaborative drawing (future)

---

## Design System Integration

### Colors (Use MangaFusion Brand)
```css
--primary: #7c3aed;      /* Violet from logo */
--secondary: #ec4899;    /* Pink accent */
--neutral-50: #f9fafb;   /* Light backgrounds */
--neutral-900: #111827;  /* Dark text */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### Typography
```css
--font-mono: 'Monaco', monospace;  /* For px values in UI */
--font-sans: 'Inter', sans-serif;  /* For labels/tooltips */
```

### Spacing
```css
--spacing-unit: 8px;  /* All spacing multiples of 8px */
--panel-width: 240px; /* Standard panel width */
--toolbar-height: 56px; /* Top toolbar height */
```

---

**Document Version:** 1.0
**Status:** Ready for Development
**Last Updated:** November 2024

# MangaFusion Drawing Feature - Standardized Keyboard Shortcuts
## Research-Based Industry Standard Mapping

**Document Version:** 1.0
**Created:** November 17, 2025
**Status:** Reference Guide for Implementation
**Based on:** Analysis of Photoshop, Krita, Clip Studio Paint, Procreate, and Figma

---

## Executive Summary

This document consolidates keyboard shortcuts from 5 professional drawing applications to establish a standardized, intuitive shortcut system for MangaFusion's drawing feature. The recommendations follow industry conventions while maintaining consistency with web-based application standards.

---

## 1. COMPARATIVE SHORTCUT ANALYSIS

### 1.1 Tool Selection Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **Brush Tool** | B | B | P | B | Shift+P | **B** |
| **Eraser Tool** | E | E | E | E | N/A | **E** |
| **Color Picker/Eyedropper** | Alt+Click | N/A | I (tool) or Alt (hold) | N/A | N/A | **Alt+Click** or **I** |
| **Move/Transform** | V | N/A | K | N/A | V | **V** |
| **Hand/Pan Tool** | Spacebar | Spacebar | H | Spacebar | H | **Spacebar** (hold) |
| **Fill Bucket** | N/A | Shift+B | N/A | N/A | N/A | **K** |
| **Selection Tool** | M | R | N/A | N/A | S | **S** |
| **Text Tool** | T | T | T | N/A | T | **T** |

**MangaFusion Recommendation:**
- B = Brush ✓ (100% consensus)
- E = Eraser ✓ (100% consensus)
- V = Move/Transform ✓ (Photoshop + Figma)
- I = Eyedropper Tool (Clip Studio Paint standard)
- Alt+Click = Quick Color Picker (Photoshop + Clip Studio)
- H = Hand Tool (when not holding Space)
- T = Text Tool ✓ (Clip Studio, Photoshop, Krita)
- K = Fill Bucket (proposed)
- S = Selection Tool (Figma standard)

---

### 1.2 Canvas Navigation Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **Pan Canvas** | Space+Drag | Space+Click | H+Drag | Spacebar+Drag | Spacebar+Drag | **Space+Drag** |
| **Zoom In** | Ctrl/Cmd++ | Ctrl+Space | (menu) | Pinch (iPad) | Ctrl+Plus | **Ctrl/Cmd++** |
| **Zoom Out** | Ctrl/Cmd+- | Ctrl+Space | (menu) | Pinch (iPad) | Ctrl+Minus | **Ctrl/Cmd+-** |
| **Zoom 100%** | (double-click) | 1 key | (menu) | (menu) | Shift+0 | **1** or **Shift+0** |
| **Zoom Fit** | Ctrl+0 (Win) | 2 key | (menu) | (menu) | Shift+1 | **2** or **Shift+1** |
| **Rotate Canvas** | R+Drag | Shift+Space | R+Drag | 2-finger rotate | (menu) | **R+Drag** or **Shift+R** |

**MangaFusion Recommendation:**
```
CANVAS NAVIGATION (Core)
├─ Space + Drag/Mouse        → Pan canvas
├─ Ctrl/Cmd + Plus           → Zoom in
├─ Ctrl/Cmd + Minus          → Zoom out
├─ 1                          → 100% zoom
├─ 2                          → Fit to canvas
├─ 0                          → Fit all content
└─ R + Drag                   → Rotate canvas

CANVAS NAVIGATION (Quick Access)
├─ Scroll wheel (Alt held)    → Zoom in/out alternative
├─ Right-click + Drag         → Pan alternative
└─ Home                       → Reset view (center & 100%)
```

---

### 1.3 Editing & History Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **Undo** | Ctrl/Cmd+Z | Ctrl+Z | (menu) | Cmd+Z (Mac) | Ctrl+Z | **Ctrl/Cmd+Z** |
| **Redo** | Ctrl/Cmd+Shift+Z | Ctrl+Shift+Z | (menu) | Shift+Cmd+Z | Ctrl+Shift+Z | **Ctrl/Cmd+Shift+Z** |
| **Undo Step Back** | Ctrl/Cmd+Alt+Z | Ctrl+Alt+Z | N/A | 2-finger tap | N/A | **Ctrl/Cmd+Alt+Z** |
| **Redo Step Forward** | (built into redo) | N/A | N/A | 3-finger tap | N/A | *Optional* |

**MangaFusion Recommendation:**
```
UNDO/REDO (Standard)
├─ Ctrl/Cmd + Z              → Undo last action
├─ Ctrl/Cmd + Shift + Z      → Redo last undone action
└─ Ctrl/Cmd + Alt + Z        → Undo multiple steps (hold to rapid undo)

TOUCH GESTURES (iPad/Tablet)
├─ 2-finger tap               → Undo
└─ 3-finger tap               → Redo
```

---

### 1.4 Brush & Tool Properties Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **Brush Size Down** | [ | [ | (menu) | (slider) | N/A | **[** |
| **Brush Size Up** | ] | ] | (menu) | (slider) | N/A | **]** |
| **Brush Hardness Down** | Shift+[ | N/A | (menu) | N/A | N/A | **Shift+[** |
| **Brush Hardness Up** | Shift+] | N/A | (menu) | N/A | N/A | **Shift+]** |
| **Decrease Opacity** | 1-9 keys | N/A | (menu) | (slider) | N/A | **1-9 keys** |
| **Reset Colors (B/W)** | D | D | (menu) | N/A | N/A | **D** |
| **Swap FG/BG Colors** | X | X | (menu) | N/A | N/A | **X** |
| **Previous Color** | Procreate: X | N/A | N/A | X | N/A | **X** |

**MangaFusion Recommendation:**
```
BRUSH PROPERTIES (Core)
├─ [ (Left Bracket)          → Decrease brush size (5px increments)
├─ ] (Right Bracket)         → Increase brush size (5px increments)
├─ { (Shift+[)               → Decrease brush hardness
├─ } (Shift+])               → Increase brush hardness
└─ Alt + [ / ]               → Fine-tune size (1px increments)

OPACITY SHORTCUTS (Number Keys)
├─ 1                          → 10% opacity
├─ 2                          → 20% opacity
├─ ...
├─ 9                          → 90% opacity
├─ 0                          → 100% opacity
└─ Double-tap number         → Specific value (e.g., 1,5 = 15%)

COLOR MANAGEMENT
├─ D                          → Reset to default (black/white)
├─ X                          → Swap foreground/background color
├─ Alt + Click on canvas      → Pick color (eyedropper)
└─ Z (hold)                   → Temporary eyedropper
```

---

### 1.5 Layer & Selection Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **New Layer** | Ctrl/Cmd+Shift+N | Shift+Ctrl+N | (menu) | (menu) | (menu) | **Ctrl/Cmd+Shift+N** |
| **Duplicate Layer** | Ctrl/Cmd+J | Shift+Ctrl+D | (menu) | (menu) | Ctrl+D | **Ctrl/Cmd+J** |
| **Delete Layer** | (delete key) | Shift+Ctrl+X | (menu) | (menu) | Delete | **Delete** |
| **Merge Down** | Ctrl/Cmd+E | (menu) | (menu) | (menu) | N/A | **Ctrl/Cmd+E** |
| **Group Layers** | Ctrl/Cmd+G | Ctrl+G | (menu) | (menu) | Ctrl+G | **Ctrl/Cmd+G** |
| **Select All** | Ctrl/Cmd+A | Ctrl+A | (menu) | (menu) | Ctrl+A | **Ctrl/Cmd+A** |
| **Deselect** | Ctrl/Cmd+D | Shift+Ctrl+A | (menu) | (menu) | Ctrl+D | **Ctrl/Cmd+D** |

**MangaFusion Recommendation:**
```
LAYER OPERATIONS (Core)
├─ Ctrl/Cmd + Shift + N      → Create new layer
├─ Ctrl/Cmd + J              → Duplicate active layer
├─ Ctrl/Cmd + G              → Group selected layers
├─ Ctrl/Cmd + E              → Merge down (flatten to below)
├─ Delete                     → Delete active layer
├─ Ctrl/Cmd + [ (bracket)    → Select layer below
├─ Ctrl/Cmd + ] (bracket)    → Select layer above
├─ ~ (tilde)                 → Select top layer
└─ Page Up/Down              → Cycle through layers

SELECTION (When applicable)
├─ Ctrl/Cmd + A              → Select all
├─ Ctrl/Cmd + D              → Deselect
├─ Ctrl/Cmd + Shift + I      → Invert selection
└─ Delete                     → Delete selection
```

---

### 1.6 File & Project Shortcuts

| Function | Photoshop | Krita | Clip Studio | Procreate | Figma | Standard |
|----------|-----------|-------|-------------|-----------|-------|----------|
| **New Project** | Ctrl/Cmd+N | Ctrl+N | (menu) | (menu) | Ctrl+N | **Ctrl/Cmd+N** |
| **Open Project** | Ctrl/Cmd+O | Ctrl+O | (menu) | (menu) | Ctrl+O | **Ctrl/Cmd+O** |
| **Save Project** | Ctrl/Cmd+S | Ctrl+S | (menu) | (menu) | Ctrl+S | **Ctrl/Cmd+S** |
| **Save As** | Ctrl/Cmd+Shift+S | Ctrl+Shift+S | (menu) | (menu) | Ctrl+Shift+S | **Ctrl/Cmd+Shift+S** |
| **Export As** | Ctrl/Cmd+Alt+Shift+W | Ctrl+Shift+E | (menu) | (menu) | Ctrl+Shift+E | **Ctrl/Cmd+Shift+E** |
| **Print** | Ctrl/Cmd+P | Ctrl+P | (menu) | (menu) | Ctrl+P | **Ctrl/Cmd+P** |
| **Close** | Ctrl/Cmd+W | Ctrl+W | (menu) | (menu) | Ctrl+W | **Ctrl/Cmd+W** |

**MangaFusion Recommendation:**
```
FILE OPERATIONS (Core)
├─ Ctrl/Cmd + N              → New drawing project
├─ Ctrl/Cmd + O              → Open project
├─ Ctrl/Cmd + S              → Save project (auto-save to drafts)
├─ Ctrl/Cmd + Shift + S      → Save as (name and save)
├─ Ctrl/Cmd + Shift + E      → Export as (PNG/JPEG/WebP)
└─ Ctrl/Cmd + W              → Close project

ALTERNATIVE FILE OPS
├─ Ctrl/Cmd + P              → Print / Print preview
└─ Alt + Shift + S           → Save to specific version
```

---

## 2. MangaFusion STANDARDIZED KEYBOARD SHORTCUTS

### 2.1 CRITICAL SHORTCUTS (Day 1 Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│ CORE DRAWING TOOLS - ALL PLATFORMS (Mac = Cmd, Win/Linux = Ctrl)│
└─────────────────────────────────────────────────────────────────┘

TOOL SELECTION
  B                     Brush tool (primary drawing)
  E                     Eraser tool
  I                     Eyedropper / Color Picker (tool)
  Alt + Click           Quick eyedropper while drawing
  V                     Move / Transform tool
  T                     Text tool
  S                     Selection tool (rectangular)
  K                     Fill bucket / Paint bucket

CANVAS NAVIGATION
  Space + Drag          Pan/scroll canvas
  Ctrl/Cmd + Plus       Zoom in (10% increment)
  Ctrl/Cmd + Minus      Zoom out (10% increment)
  1                     Zoom to 100%
  2                     Fit canvas in view
  0                     Reset view (center + 100%)
  R + Drag              Rotate canvas (30° increments)

UNDO/REDO
  Ctrl/Cmd + Z          Undo last action
  Ctrl/Cmd + Shift + Z  Redo last undone action
  Ctrl/Cmd + Alt + Z    Step back (rapid undo - hold down)

BRUSH PROPERTIES
  [ (Left Bracket)      Decrease brush size (-5px)
  ] (Right Bracket)     Increase brush size (+5px)
  { (Shift + [)         Decrease hardness (-10%)
  } (Shift + ])         Increase hardness (+10%)
  Alt + [ / ]           Fine-tune size (-/+1px)

OPACITY (Number Keys - Quick Set)
  0                     100% opacity
  1                     10% opacity
  2                     20% opacity
  ... (3-8) ...         30-80% opacity
  9                     90% opacity
  Double-tap (e.g. 1,5) Set 15% opacity

COLOR MANAGEMENT
  D                     Reset to default (black fg / white bg)
  X                     Swap foreground and background colors
  ; (semicolon)         Open color palette / color picker UI

LAYERS
  Ctrl/Cmd + Shift + N  Create new layer
  Ctrl/Cmd + J          Duplicate active layer
  Ctrl/Cmd + E          Merge down (flatten to layer below)
  Ctrl/Cmd + G          Group layers (if applicable)
  Delete                Delete active layer
  Page Up               Select layer above
  Page Down             Select layer below
  Home / End            Jump to top/bottom layer

FILE OPERATIONS
  Ctrl/Cmd + N          New drawing project
  Ctrl/Cmd + O          Open project
  Ctrl/Cmd + S          Save project (to drafts)
  Ctrl/Cmd + Shift + S  Save as (new name/version)
  Ctrl/Cmd + Shift + E  Export as (PNG/JPEG/WebP/SVG)
  Ctrl/Cmd + W          Close current project

SELECTION (When in Selection Tool)
  Ctrl/Cmd + A          Select all
  Ctrl/Cmd + D          Deselect
  Ctrl/Cmd + Shift + I  Invert selection
  Delete                Delete selection
```

---

### 2.2 IMPORTANT SHORTCUTS (Week 1 Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│ ENHANCED FEATURES - Build after MVP core is stable             │
└─────────────────────────────────────────────────────────────────┘

ADVANCED BRUSH CONTROLS
  ~ (Tilde)             Show brush preview/selector
  , (Comma)             Previous brush (in preset list)
  . (Period)            Next brush (in preset list)
  ; (Semicolon)         Open brush library panel
  Ctrl/Cmd + ,          Decrease brush smoothing
  Ctrl/Cmd + .          Increase brush smoothing

CANVAS & VIEW
  / (Forward Slash)     Toggle grid/guidelines
  ' (Apostrophe)        Toggle rulers
  \ (Backslash)         Toggle all UI panels (presentation mode)
  Tab                   Hide/show tool and option panels
  Shift + Tab           Hide all UI except canvas
  Ctrl/Cmd + R          Toggle canvas rotation UI

LAYER MANAGEMENT
  Alt + [ / ]           Adjust layer opacity (-/+10%)
  Ctrl/Cmd + [ / ]      Move layer down/up in stack
  ; (Semicolon)         Open layers panel
  H                     Toggle layer visibility (when panel focused)
  L                     Lock/unlock layer
  Ctrl/Cmd + Alt + N    Show layer properties dialog

VIEW & DISPLAY
  Ctrl/Cmd + Plus       Increase UI scale (for accessibility)
  Ctrl/Cmd + Minus      Decrease UI scale
  Ctrl/Cmd + 0 (zero)   Reset UI scale
  F                     Fullscreen mode
  . (Period)            Show/hide tooltips

SELECTION & TRANSFORM
  M                     Rectangle select tool
  L                     Lasso select tool
  Ctrl/Cmd + T          Show transform handles
  Ctrl/Cmd + H          Show/hide selection edges ("marching ants")
  Ctrl/Cmd + Alt + V    Paste as new layer

IMAGE OPERATIONS
  Ctrl/Cmd + I          Invert colors
  Ctrl/Cmd + U          Hue/Saturation dialog
  Ctrl/Cmd + L          Levels / Histogram
  Ctrl/Cmd + M          Curves dialog
  Ctrl/Cmd + B          Color Balance
```

---

### 2.3 NICE-TO-HAVE SHORTCUTS (Week 2+ Polish)

```
┌─────────────────────────────────────────────────────────────────┐
│ POLISH & ACCESSIBILITY - Implement after core features stable  │
└─────────────────────────────────────────────────────────────────┘

ADVANCED NAVIGATION
  Alt + Scroll          Pan canvas (alternative to Space+drag)
  Ctrl/Cmd + Shift + O  Show/hide canvas outline
  Ctrl/Cmd + Shift + G  Snap to grid toggle
  Ctrl/Cmd + Shift + U  Snap to guides toggle

BRUSH & STROKE
  Shift + Draw          Constrain to straight line
  Ctrl/Cmd + Draw       Disable smoothing (pressure-sensitive)
  Alt + Draw            Draw from center point
  Shift + Alt + Draw    Draw square/circle

SPECIAL EFFECTS
  Ctrl/Cmd + Shift + F  Flip canvas horizontally (temporary)
  Ctrl/Cmd + Alt + F    Flip canvas vertically (temporary)
  Ctrl/Cmd + Shift + R  Mirror canvas (symmetry mode)

WORKSPACE
  W                     Next workspace layout (if multiple)
  Shift + W             Previous workspace layout
  Ctrl/Cmd + K          Command palette / Quick search
  ? (Question mark)     Show keyboard shortcuts help
  F1                    Open documentation

ACCESSIBILITY
  Ctrl/Cmd + Alt + A    Toggle high contrast mode
  Ctrl/Cmd + Alt + +    Increase cursor size
  Ctrl/Cmd + Alt + -    Decrease cursor size
  Ctrl/Cmd + Alt + E    Enable/disable keyboard focus outline
  / (Forward Slash)     Repeat last action

PRESENTATION MODE
  F5                    Start presentation (fullscreen canvas)
  Esc                   Exit presentation mode
  Space                 Next slide (in gallery/history)
  Shift + Space         Previous slide

COLLABORATION (Future Feature)
  Ctrl/Cmd + Shift + C  Invite collaborator
  Ctrl/Cmd + Shift + L  Show/hide live cursors
  @                     Mention collaborator (in comments)
```

---

### 2.4 PLATFORM-SPECIFIC ADJUSTMENTS

#### macOS
```
⌘ (Command) = Ctrl on Windows/Linux
⌥ (Option)  = Alt on Windows/Linux
⇧ (Shift)   = Shift on all platforms
⌃ (Control) = Only on Mac for specific features

Key Mac Exceptions:
⌘ + Z              Undo
⌘ + ⇧ + Z          Redo
⌘ + ⌥ + Z          Rapid undo (hold)
⌘ + ,              Preferences/Settings
⌘ + W              Close window
⌘ + Q              Quit application
```

#### Windows / Linux
```
Ctrl = Primary modifier
Alt  = Secondary modifier
Shift = Tertiary modifier

Key Differences:
Ctrl + Z           Undo
Ctrl + Shift + Z   Redo
Ctrl + Alt + Z     Rapid undo (hold)
Alt + F4           Close window
Win Key + D        Minimize all (handled by OS)
```

#### iPad / Touch Devices
```
With External Keyboard:
- All standard Ctrl/Cmd shortcuts apply
- Cmd is automatically mapped to physical keyboard

Touch Gestures (without keyboard):
2-Finger Tap       Undo
3-Finger Tap       Redo
2-Finger Long-Hold Show context menu
2-Finger Pinch     Zoom in/out
2-Finger Rotate    Rotate canvas
3-Finger Swipe Up  Show tool palette
3-Finger Swipe Down Close palette
```

---

## 3. IMPLEMENTATION GUIDE

### 3.1 Keyboard Event Handling Pattern

```typescript
// Recommended React Hook for keyboard shortcuts
// File: /lib/drawing/hooks/useKeyboardShortcuts.ts

import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  [key: string]: (event: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, enabled = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key.toLowerCase();
    const isCtrlCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // Build shortcut string (e.g., "ctrl+shift+z")
    const shortcutKey = [
      isCtrlCmd && 'ctrl',
      isShift && 'shift',
      isAlt && 'alt',
      key
    ]
      .filter(Boolean)
      .join('+');

    // Check for matching shortcut
    if (shortcuts[shortcutKey]) {
      event.preventDefault();
      shortcuts[shortcutKey](event);
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
```

### 3.2 Tool Selection Implementation

```typescript
// File: /lib/drawing/toolManager.ts

export enum DrawingTool {
  BRUSH = 'brush',
  ERASER = 'eraser',
  EYEDROPPER = 'eyedropper',
  MOVE = 'move',
  HAND = 'hand',
  FILL = 'fill',
  SELECT = 'select',
  TEXT = 'text'
}

export const TOOL_SHORTCUTS: Record<string, DrawingTool> = {
  'b': DrawingTool.BRUSH,
  'e': DrawingTool.ERASER,
  'i': DrawingTool.EYEDROPPER,
  'v': DrawingTool.MOVE,
  'h': DrawingTool.HAND,
  'k': DrawingTool.FILL,
  's': DrawingTool.SELECT,
  't': DrawingTool.TEXT
};

export const selectTool = (tool: DrawingTool) => {
  // Handle tool switching with visual feedback
  // Update state, change cursor, update panel
};
```

### 3.3 Brush Size Adjustment

```typescript
// File: /lib/drawing/brushEngine.ts

export const BRUSH_SIZE_STEP = 5; // pixels per bracket key

export const adjustBrushSize = (
  currentSize: number,
  direction: 'increase' | 'decrease',
  fineMode = false
) => {
  const step = fineMode ? 1 : BRUSH_SIZE_STEP;
  const newSize = direction === 'increase'
    ? currentSize + step
    : currentSize - step;

  // Clamp between 1 and 300 pixels
  return Math.max(1, Math.min(300, newSize));
};

export const adjustBrushHardness = (
  currentHardness: number,
  direction: 'increase' | 'decrease'
) => {
  const step = 10; // percent
  const newHardness = direction === 'increase'
    ? currentHardness + step
    : currentHardness - step;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, newHardness));
};
```

### 3.4 Opacity Quick Set

```typescript
// File: /lib/drawing/opacityManager.ts

export const getOpacityFromKey = (key: string): number | null => {
  // Single digit: map to opacity percentage
  if (key === '0') return 100;
  if (key >= '1' && key <= '9') {
    return parseInt(key) * 10;
  }
  return null;
};

export const getOpacityFromDoubleKey = (keys: string[]): number | null => {
  if (keys.length === 2) {
    const value = parseInt(keys.join(''));
    if (value >= 0 && value <= 100) {
      return value;
    }
  }
  return null;
};
```

### 3.5 Testing Shortcuts

```typescript
// File: /tests/drawing/keyboard-shortcuts.test.ts

describe('Keyboard Shortcuts', () => {
  it('should activate brush tool with B key', () => {
    const { getByTestId } = render(<DrawingEditor />);
    fireEvent.keyDown(window, { key: 'b' });
    expect(getByTestId('tool-brush')).toHaveClass('active');
  });

  it('should undo with Ctrl+Z', () => {
    const { getByTestId } = render(<DrawingEditor />);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(getByTestId('undo-state')).toBeInTheDocument();
  });

  it('should increase brush size with ]', () => {
    const { getByTestId } = render(<DrawingEditor />);
    const initialSize = 20;
    fireEvent.keyDown(window, { key: ']' });
    expect(parseInt(getByTestId('brush-size').textContent)).toBe(initialSize + 5);
  });

  it('should pan canvas with Space+Drag', () => {
    const { getByTestId } = render(<DrawingEditor />);
    const canvas = getByTestId('drawing-canvas');

    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.mouseDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    expect(getByTestId('canvas-pan')).toHaveBeenCalled();
  });
});
```

---

## 4. CONFLICT RESOLUTION STRATEGY

### 4.1 Browser & OS Default Conflicts

| Shortcut | Conflict | Solution |
|----------|----------|----------|
| Ctrl+S | Browser "Save Page" | Intercept & prevent default |
| Ctrl+W | Browser "Close Tab" | Warn user, confirm close |
| Ctrl+P | Browser "Print" | Use for print preview if applicable |
| Alt+F4 | OS "Close Window" | Allow native close (unmodified) |
| Cmd+Q | macOS "Quit" | Allow native quit |
| Ctrl+Z | Some password managers | Intercept & prevent default |

**Implementation:**
```typescript
// File: /lib/drawing/conflictResolver.ts

const BROWSER_CONFLICTS = {
  'ctrl+s': { action: 'preventDefault', replace: 'save' },
  'ctrl+w': { action: 'confirm', message: 'Close drawing?' },
  'ctrl+p': { action: 'preventDefault', replace: 'print-preview' },
  'ctrl+a': { action: 'preventDefault', replace: 'select-all' }
};

export const resolveConflict = (shortcut: string) => {
  const conflict = BROWSER_CONFLICTS[shortcut];
  if (conflict?.action === 'preventDefault') {
    return true; // Prevent default browser behavior
  }
  return false;
};
```

### 4.2 Application-Specific Conflicts

| Context | Shortcut | Behavior |
|---------|----------|----------|
| Text Input Field | All shortcuts | Disabled (focus text area) |
| Color Picker Active | Modifier Keys | May interfere with picker |
| Modal Dialog Open | Most shortcuts | Dispatch to modal only |
| Transform Mode | Arrow Keys | Move/resize object |
| Free Transform | Shift+Drag | Constrain proportions |

**Implementation:**
```typescript
// Disable shortcuts when in text input
export const isTextInputActive = () => {
  const activeElement = document.activeElement as HTMLElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.contentEditable === 'true'
  );
};

export const shouldHandleShortcut = (shortcut: string) => {
  if (isTextInputActive()) return false;
  if (isModalOpen()) return false; // Modal handles own shortcuts
  return true;
};
```

---

## 5. USER ACCESSIBILITY & CUSTOMIZATION

### 5.1 Shortcut Reminders

```
┌─────────────────────────────────────────────────────────────────┐
│ IN-APP HELP & DISCOVERABILITY                                   │
└─────────────────────────────────────────────────────────────────┘

TOOLTIP SYSTEM
├─ Tool buttons display shortcut on hover (e.g. "Brush (B)")
├─ Show shortcut hints in status bar
├─ Context-sensitive tooltips for panels
└─ Keyboard hints toggle in Help menu

SHORTCUT CHEAT SHEET
├─ ? or F1 → Opens interactive shortcut reference
├─ Shows shortcuts grouped by category
├─ Searchable/filterable
├─ Printable version available
└─ Platform-specific variants (Mac vs Windows)

DISCOVERABILITY
├─ First-time user tutorial shows common shortcuts
├─ Highlight shortcut when menu item is clicked
├─ "Learn Shortcut" button in preferences
└─ Analytics to identify underused shortcuts
```

### 5.2 Customization Support (Future)

```typescript
// File: /lib/drawing/shortcutPreferences.ts

interface ShortcutCustomization {
  shortcutId: string;          // 'tool.brush', 'undo', etc.
  defaultBinding: string;      // 'b', 'ctrl+z'
  customBinding?: string;      // User override
  isCustom: boolean;
  category: string;            // 'tools', 'navigation', 'editing'
}

export const CUSTOMIZABLE_SHORTCUTS: Record<string, ShortcutCustomization> = {
  'tool.brush': {
    shortcutId: 'tool.brush',
    defaultBinding: 'b',
    category: 'tools'
  },
  'tool.eraser': {
    shortcutId: 'tool.eraser',
    defaultBinding: 'e',
    category: 'tools'
  }
  // ... more shortcuts
};

// Note: First release uses defaults only
// v2.0 can add customization panel in Preferences
```

### 5.3 Accessibility Considerations

```
KEYBOARD-ONLY USERS
├─ Tab navigation through all UI elements
├─ Enter/Space to activate buttons
├─ Arrow keys for numeric adjustments
├─ Alt key access to menu items
└─ Focus indicators clearly visible

ALTERNATIVE INPUT METHODS
├─ Mouse-based UI alternatives to keyboard shortcuts
├─ On-screen toolbar buttons for all tools
├─ Dropdown menus for all actions
├─ Right-click context menus
└─ Settings panel for tool configuration

SCREEN READER SUPPORT
├─ Shortcut help text includes in aria-labels
├─ "Press B for Brush" announced
├─ Tool state changes announced
└─ Error messages include suggested shortcuts
```

---

## 6. REFERENCE CARD - QUICK LOOKUP

### 6.1 Keyboard Layout Visualization

```
┌─────────────────────────────────────────────────────────────┐
│ STANDARD QWERTY KEYBOARD WITH SHORTCUTS HIGHLIGHTED          │
└─────────────────────────────────────────────────────────────┘

NUMBER ROW (Opacity Quick Set)
┌─ [ ] 1-9 ] ─────────────────────────────────────────────────┐
│     │Opacity % selectors            │ Brush size        │
│ ┌───┴────────────────────────────────┴──────────────────────┐

TOP ROW (Tools)
   Q    W[Workspace] E[Eraser]  R[Rotate]  T[Text]

   ...skip to right side:
                                        [ Decrease Size
                                        ] Increase Size

MIDDLE ROW (Layer/Color)
   A    S[Select]  D[Default Color]  F  G  H[Hand]  I[Eyedropper]
                                              K[Fill]

   ...modifiers:
       Shift+S = Screen Capture
       Ctrl+S = Save

HOME ROW (Primary)
   Z    X[Swap Colors]  C    V[Move]  B[Brush]   N    M

   ...special:
       Ctrl+Z = Undo
       Ctrl+X = Cut
       Ctrl+C = Copy
       Ctrl+V = Paste

BOTTOM ROW / SPACE
   [Space + Drag = Pan Canvas]

MOD KEYS
   Ctrl/Cmd  ← Primary modifier (undo, save, etc)
   Shift     ← Secondary (brush hardness, etc)
   Alt/Opt   ← Tertiary (eyedropper, fine-tune, etc)
```

### 6.2 One-Page Cheat Sheet (Print Friendly)

```
╔═══════════════════════════════════════════════════════════════╗
║       MANGAFUSION DRAWING - KEYBOARD SHORTCUTS CHEAT SHEET     ║
╚═══════════════════════════════════════════════════════════════╝

TOOLS (Single Key)              CANVAS NAVIGATION
├─ B = Brush                    ├─ Space+Drag = Pan
├─ E = Eraser                   ├─ Ctrl/Cmd+Plus = Zoom In
├─ I = Eyedropper               ├─ Ctrl/Cmd+Minus = Zoom Out
├─ V = Move                     ├─ 1 = 100%
├─ H = Hand                     ├─ 2 = Fit Canvas
├─ T = Text                     ├─ R+Drag = Rotate
├─ S = Select
└─ K = Fill Bucket

BRUSH ADJUSTMENTS               COLORS & HISTORY
├─ [ = Smaller Size             ├─ D = Default Color (B/W)
├─ ] = Larger Size              ├─ X = Swap FG/BG
├─ Shift+[ = Less Hard          ├─ Alt+Click = Pick Color
├─ Shift+] = More Hard          ├─ Ctrl/Cmd+Z = Undo
├─ 1-9 = Quick Opacity (10-90%) └─ Ctrl/Cmd+Shift+Z = Redo
└─ 0 = 100% Opacity

LAYERS                          FILES
├─ Ctrl/Cmd+Shift+N = New       ├─ Ctrl/Cmd+N = New Project
├─ Ctrl/Cmd+J = Duplicate       ├─ Ctrl/Cmd+O = Open
├─ Ctrl/Cmd+G = Group           ├─ Ctrl/Cmd+S = Save
├─ Ctrl/Cmd+E = Merge Down      ├─ Ctrl/Cmd+Shift+E = Export
├─ Delete = Delete Layer        └─ Ctrl/Cmd+W = Close
└─ Page Up/Down = Switch

QUICK TIPS:
• Hold Space to pan temporarily (don't need Hand tool)
• Alt+Click to pick colors without switching tools
• Type 1,5 to set opacity to 15% (double-tap numbers)
• Double-click tool button to access settings
• Right-click canvas for context menu

╔═══════════════════════════════════════════════════════════════╗
║ For complete list, press ? or see Help → Keyboard Shortcuts  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 7. TESTING CHECKLIST

- [ ] All shortcuts work on Windows (Ctrl)
- [ ] All shortcuts work on macOS (Cmd)
- [ ] All shortcuts work on Linux (Ctrl)
- [ ] Shortcuts don't conflict with browser defaults
- [ ] Focus management works (text input disables shortcuts)
- [ ] Modifier key combinations properly detected
- [ ] Shortcut hints display in tooltips
- [ ] Help dialog shows all shortcuts
- [ ] Keyboard-only navigation possible
- [ ] Mobile/touch devices work with external keyboard
- [ ] Performance impact negligible
- [ ] Accessibility features functional
- [ ] Analytics track shortcut usage

---

## 8. REFERENCES & SOURCES

### Industry Standard Keyboards
1. **Photoshop** (Adobe Ecosystem Standard)
   - https://helpx.adobe.com/photoshop/using/default-keyboard-shortcuts.html
   - Most widely used professional standard

2. **Krita** (Open-Source Pro Standard)
   - https://docs.krita.org/en/reference_manual/shortcuts.html
   - Linux-optimized, highly customizable

3. **Clip Studio Paint** (Manga/Comic Professional)
   - https://help.clip-studio.com/en-us/manual_en/780_shortcuts/
   - Manga-specific industry leader

4. **Procreate** (iPad Professional Standard)
   - https://help.procreate.com/procreate/handbook/interface-gestures/keyboard
   - Touch and keyboard hybrid approach

5. **Figma** (Design Platform Web Standard)
   - https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard
   - Modern web-first approach

### Web Standards
- MDN Web Docs - Keyboard Events: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
- W3C - WAI-ARIA Keyboard Guidelines: https://www.w3.org/WAI/ARIA/apg/

---

**Document Status:** Ready for Development
**Version:** 1.0
**Last Updated:** November 17, 2025
**Maintained By:** MangaFusion Development Team

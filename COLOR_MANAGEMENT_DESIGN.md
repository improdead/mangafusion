# Color Management & Palette UI Design for MangaFusion

## Executive Summary

This document outlines a comprehensive color management system tailored for manga drawing workflows. While manga is traditionally black & white, modern digital workflows require sophisticated color tools for screentones, grayscale tones, overlays, and color accents. This design emphasizes efficiency for manga-specific needs: quick access to grayscale/screentone palettes, precise tonal control, and seamless workflow integration.

---

## 1. Color Picker System

### 1.1 Primary Color Input Modes

#### HSV (Hue-Saturation-Value) Mode
**Recommended for manga screentones and tonal work**

```
┌─────────────────────────────────────┐
│  HSV Color Picker                   │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │   Saturation-Value Grid      │   │
│  │   (interactive 2D picker)    │   │
│  │   S (0-100%) horizontal      │   │
│  │   V (0-100%) vertical        │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   Hue Slider (0-360°)        │   │
│  │   [Red→Yellow→Green→Cyan...]  │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   Alpha/Opacity (0-100%)     │   │
│  │   [████░░░░░░░░░░░░]         │   │
│  └──────────────────────────────┘   │
│                                     │
│  Input Fields:                      │
│  H: [000°]  S: [100%]  V: [50%]     │
│  A: [100%]                          │
└─────────────────────────────────────┘
```

**Manga-specific benefits:**
- Saturation control for screentone intensity
- Value (brightness) directly maps to gray tones
- Natural for tonal/grayscale workflow
- Quick access to pure blacks (#000000) and whites (#ffffff)

#### RGB (Red-Green-Blue) Mode
**For technical/digital color specification**

```
┌─────────────────────────────────────┐
│  RGB Color Picker                   │
├─────────────────────────────────────┤
│  Red:   [███░░░░] 192    │ R Slider │
│  Green: [██░░░░░] 128    │ G Slider │
│  Blue:  [█████░░] 160    │ B Slider │
│  Alpha: [████░░░] 100%   │ A Slider │
│                                     │
│  Hex Preview: #C080A0               │
│  RGB: rgb(192, 128, 160, 1.0)       │
└─────────────────────────────────────┘
```

**Use cases:**
- Precise color matching with design specs
- Importing colors from other tools
- Accessibility testing (WCAG contrast)

#### Hex Code Input
**Direct color specification**

```
Hex Input: [ #C080A0 ]
           [ #000000 ] (Black)
           [ #FFFFFF ] (White)
           [ #808080 ] (Mid-Gray)
```

**Features:**
- 6-character hex support (#RRGGBB)
- 8-character hex with alpha (#RRGGBBAA)
- Real-time validation
- Copy/paste support
- Convert to RGB/HSV on input

### 1.2 Color Display & Preview

```
┌─────────────────────┐
│  Current Color      │
├─────────────────────┤
│  ┌───────────────┐  │
│  │               │  │
│  │  NEW (50x50)  │  │ Current selected color
│  │               │  │
│  ├───────────────┤  │
│  │               │  │
│  │  OLD (50x50)  │  │ Previously selected
│  │               │  │
│  └───────────────┘  │
│                     │
│  Copy Hex: #C080A0  │
└─────────────────────┘
```

**Features:**
- Side-by-side new/old comparison
- Show both with current opacity applied
- Background checkerboard for transparency visibility
- One-click copy to clipboard

### 1.3 Color Space Toggle

Quick switcher between input modes:
```
[HSV] [RGB] [HEX] [CMYK*]
 ^
 Active mode

* CMYK for print-oriented designs (optional)
```

---

## 2. Manga-Specific Preset Palettes

### 2.1 Screentone Palette Library

**Purpose:** Provide industry-standard tones used in manga

```
┌──────────────────────────────────────────────┐
│  SCREENTONE PRESETS                          │
├──────────────────────────────────────────────┤
│                                              │
│  STANDARD GRAYS (10% increments)             │
│  ░░░░░░░░░░  10%   #E6E6E6  (Lightest)       │
│  ░░░░░░░░▓▓  20%   #CCCCCC                   │
│  ░░░░░░▓▓▓▓  30%   #B3B3B3                   │
│  ░░░░▓▓▓▓▓▓  40%   #999999  (Mid-tone)       │
│  ░░▓▓▓▓▓▓▓▓  50%   #808080                   │
│  ▓▓▓▓▓▓▓▓░░  60%   #666666                   │
│  ▓▓▓▓▓▓▓▓▓░  70%   #4D4D4D                   │
│  ▓▓▓▓▓▓▓▓▓▓  80%   #333333                   │
│  ███████░░░  90%   #1A1A1A                   │
│  ██████████  100%  #000000  (Black)          │
│                                              │
│  COMMON SCREENTONE PATTERNS                  │
│  ::::  Light Halftone (20%)  #E6E6E6         │
│  ▓▓▓▓  Medium Halftone (50%)  #808080        │
│  ████  Dark Halftone (80%)   #333333        │
│  ▲▲▲▲  Diagonal Lines        #999999        │
│  ||||  Vertical Lines        #AAAAAA        │
│                                              │
│  SPECIAL MANGA TONES                         │
│  White (BG):  #FFFFFF  (100% - Paper)        │
│  Black (Ink): #000000  (0% - Pure black)     │
│  Shadow:      #1A1A1A  (90%)                 │
│  Midtone:     #808080  (50%)                 │
│  Highlight:   #E6E6E6  (10%)                 │
│  Skin Tone:   #E8C8A8  (Sepia tint)         │
│                                              │
└──────────────────────────────────────────────┘
```

**Implementation:**
```typescript
interface ScreentonePreset {
  name: string;           // "10% Light Gray"
  hex: string;            // "#E6E6E6"
  hsv: { h: number, s: number, v: number };
  category: 'gray' | 'tone' | 'pattern';
  description?: string;
}

const MANGA_SCREENTONES: ScreentonePreset[] = [
  { name: '10%', hex: '#E6E6E6', hsv: {h: 0, s: 0, v: 90}, category: 'gray' },
  { name: '20%', hex: '#CCCCCC', hsv: {h: 0, s: 0, v: 80}, category: 'gray' },
  { name: '50%', hex: '#808080', hsv: {h: 0, s: 0, v: 50}, category: 'gray' },
  { name: '100%', hex: '#000000', hsv: {h: 0, s: 0, v: 0}, category: 'gray' },
  // ... more tones
];
```

### 2.2 Named Color Palettes

**Purpose:** Quick access to manga-relevant colors

```
┌─────────────────────────────────────────┐
│ PALETTE: Traditional Manga              │
├─────────────────────────────────────────┤
│                                         │
│  Pure Black      #000000  ██████████    │
│  Deep Shadow     #1A1A1A  ▓▓▓▓▓▓▓▓░░    │
│  Dark Ink        #2D2D2D  ▓▓▓▓▓░░░░░    │
│  Ink Gray        #404040  ▓▓▓░░░░░░░    │
│  Dark Tone       #666666  ▓▓░░░░░░░░    │
│  Mid Gray        #808080  ▓░░░░░░░░░    │
│  Light Tone      #CCCCCC  ░░░░░░░░░░    │
│  White Paper     #FFFFFF  ░░░░░░░░░░    │
│                                         │
│  [Add to Palette] [Export] [Duplicate]   │
└─────────────────────────────────────────┘
```

**Additional Palettes:**
- **Character Palettes:** Per-character color schemes (for color manga)
- **Scene Palettes:** Atmospheric colors for specific scenes
- **Effect Palettes:** Speed lines, motion blur, glow effects
- **User Custom:** Saved user-created palettes

### 2.3 Default Palette Categories

```
┌──────────────────────────────────────┐
│  PALETTE LIBRARY                     │
├──────────────────────────────────────┤
│  [▼] Traditional Manga (9 colors)    │
│  [▼] Screentone Grays (10 colors)   │
│  [▼] Ink Effects (5 colors)         │
│  [▼] Paper Tones (3 colors)         │
│  [▼] My Palettes                    │
│      ├─ Character A                  │
│      ├─ Scene 3 Night                │
│      └─ Speed Lines                  │
│  [+] Create New Palette              │
└──────────────────────────────────────┘
```

---

## 3. Color History & Recent Colors

### 3.1 Recent Colors Strip

**Purpose:** Quick access to colors used recently in the current project

```
┌─────────────────────────────────────────────────┐
│  RECENT COLORS (Last 16 used)                   │
├─────────────────────────────────────────────────┤
│  ██  ▓▓  ░░  █░  ▓░  ░░  ██  ░░               │
│  ██  ▓▓  ░░  █░  ▓░  ░░  ██  ░░               │
│  ██  ▓▓  ░░  █░  ▓░  ░░  ██  ░░               │
│  ██  ▓▓  ░░  █░  ▓░  ░░  ██  ░░               │
│                                                 │
│  [Clear History]  [←] [→] [Pin Selected]       │
└─────────────────────────────────────────────────┘
```

**Features:**
- Display as a grid (4 rows x 4 columns = 16 colors)
- Hover to show hex value
- Click to select color
- Drag to reorder
- Pin/favorite important colors
- Limit to last N colors used (default: 16)
- Optional: Save history per project

### 3.2 Color History Details

```typescript
interface ColorHistory {
  colors: Color[];
  maxSize: number;              // Default: 16
  timestamps: Date[];
  pinnedColors: string[];       // hex codes
}

// Add to history when color is selected:
addToHistory(color: Color) {
  if (this.history.includes(color.hex)) {
    // Move to front if already exists
    this.history = [color, ...this.history.filter(c => c !== color)];
  } else {
    this.history = [color, ...this.history].slice(0, this.maxSize);
  }
}
```

### 3.3 Color Picker History Integration

```
┌──────────────────────────────────┐
│  Color Picker (full)             │
├──────────────────────────────────┤
│  [HSV/RGB/HEX tabs]             │
│  [...color picker UI...]        │
│                                  │
│  ┌────────────────────────────┐  │
│  │ RECENTLY USED (Quick Pick) │  │
│  │ ██ ▓▓ ░░ ██ ▓░ ░░ ██ ░░  │  │
│  │ Tap above or [Clear]       │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 4. Eyedropper Tool

### 4.1 Eyedropper Implementation

**Purpose:** Sample colors directly from canvas, images, or screen

```
┌─────────────────────────────────────┐
│  [🎨 COLOR PICKER]  [💧 EYEDROPPER] │
└─────────────────────────────────────┘
        ↓ Click eyedropper
        Cursor changes to crosshair

Canvas shows magnified preview:
┌─────────────────────────┐
│  MAGNIFIED PIXEL VIEW   │
│  10x10 grid             │
│  Center pixel selected: │
│  Hex: #C080A0          │
│  RGB: (192, 128, 160)  │
│  HSV: (340°, 33%, 75%) │
└─────────────────────────┘
```

### 4.2 Eyedropper Features

```typescript
class EyedropperTool {
  // Activate eyedropper mode
  activate() {
    this.canvas.style.cursor = 'crosshair';
    document.addEventListener('click', this.onPixelClick);
  }

  // Sample pixel from canvas
  async sampleFromCanvas(x: number, y: number) {
    const imageData = this.canvas
      .getContext('2d')
      .getImageData(x, y, 1, 1);

    return Color.fromRGBA(
      imageData.data[0],
      imageData.data[1],
      imageData.data[2],
      imageData.data[3]
    );
  }

  // Optional: Sample from any element on page
  async sampleFromElement(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element);
    return Color.fromCss(computedStyle.backgroundColor);
  }

  deactivate() {
    this.canvas.style.cursor = 'default';
    document.removeEventListener('click', this.onPixelClick);
  }
}
```

### 4.3 Eyedropper UI Modes

**Mode 1: Canvas-only sampling**
```
Eyedropper restricted to current manga page canvas
- Useful for sampling from artwork/overlays
- Prevents accidental sampling from UI
```

**Mode 2: Full-screen sampling**
```
Eyedropper samples from entire viewport
- Sample from reference images
- Match colors in different windows
- Requires browser permission (optional)
```

**Mode 3: Multi-pixel averaging**
```
Sample average color from region:
┌────────────────────────┐
│  Averaging 5x5 pixels  │
│  ┌─────────────────┐   │
│  │ Sampled region  │   │
│  │   [+++++]       │   │
│  │   [+++++]       │   │
│  │   [+++++]       │   │
│  │   [+++++]       │   │
│  │   [+++++]       │   │
│  └─────────────────┘   │
│  Average: #989898      │
└────────────────────────┘
```

### 4.4 Eyedropper Keyboard Shortcuts

```
[E]           - Toggle eyedropper mode
[Escape]      - Cancel eyedropper
[Space]       - Lock/unlock current sample
[+/-]         - Increase/decrease averaging radius
[V]           - Average mode toggle
[Ctrl+C]      - Copy sampled color to clipboard
```

---

## 5. Opacity & Alpha Controls

### 5.1 Opacity Slider

```
┌──────────────────────────────────────┐
│  OPACITY CONTROL                     │
├──────────────────────────────────────┤
│                                      │
│  Opacity: 75%                        │
│  ░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░ │
│  0%                           100%   │
│                                      │
│  [ Input: 75 ] [Slider]              │
│                                      │
│  Preview:                            │
│  ┌──────────────────┐                │
│  │ 75% opacity      │                │
│  │ color swatch     │                │
│  │ over checkerboard               │
│  └──────────────────┘                │
│                                      │
└──────────────────────────────────────┘
```

### 5.2 Opacity Presets

**Quick opacity buttons:**
```
┌────────────────────────────────────┐
│  OPACITY PRESETS                   │
│  [10%]  [25%]  [50%]  [75%]  [100%]│
│                                    │
│  Also show:                        │
│  [20%]  [30%]  [40%]  [60%]  [80%] │
│  (Shift to reveal extended set)    │
└────────────────────────────────────┘
```

### 5.3 Alpha Channel Visualization

```typescript
// Show checkerboard behind semi-transparent color
.color-swatch {
  background-image:
    linear-gradient(45deg, #888 25%, transparent 25%),
    linear-gradient(-45deg, #888 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #888 75%),
    linear-gradient(-45deg, transparent 75%, #888 75%);
  background-size: 10px 10px;
  background-color: #ccc;
}
```

### 5.4 Opacity Shortcuts

```
[1]  - 10% opacity
[2]  - 25% opacity
[3]  - 50% opacity
[4]  - 75% opacity
[5]  - 100% opacity (fully opaque)

Shift+[0] - 0% opacity (transparent)
Scroll    - Adjust opacity in 5% increments
```

---

## 6. Blending Modes for Manga Workflow

### 6.1 Essential Blending Modes

```
┌─────────────────────────────────────────┐
│  BLENDING MODE SELECTOR                 │
├─────────────────────────────────────────┤
│  [▼ Normal]                             │
│                                         │
│  ┌─────────────────────────────────────┐
│  │ BASIC MODES                         │
│  │ ☑ Normal        (default, no blend) │
│  │                                     │
│  │ DARKENING MODES (for inks/shadows)  │
│  │ ☐ Multiply      (typical for tones)│
│  │ ☐ Darken        (keeps darks only) │
│  │ ☐ Color Burn    (intensified dark) │
│  │ ☐ Screen        (inverse multiply) │
│  │                                     │
│  │ LIGHTENING MODES (for highlights)   │
│  │ ☐ Lighten       (keeps lights only)│
│  │ ☐ Color Dodge   (intensified light)│
│  │ ☐ Addition      (additive light)   │
│  │                                     │
│  │ CONTRAST MODES                      │
│  │ ☐ Overlay       (multiply + screen)│
│  │ ☐ Soft Light    (subtle overlay)   │
│  │ ☐ Hard Light    (intense overlay)  │
│  │ ☐ Linear Light  (linear lighten)  │
│  │                                     │
│  │ COMPONENT MODES                     │
│  │ ☐ Hue           (preserve color)   │
│  │ ☐ Saturation    (preserve tone)    │
│  │ ☐ Color         (hue + sat)        │
│  │ ☐ Luminosity    (preserve bright)  │
│  │                                     │
│  │ DIFFERENCE MODES                    │
│  │ ☐ Difference    (subtract colors)  │
│  │ ☐ Exclusion     (softer diff)      │
│  │ ☐ Subtract      (inverse of add)   │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────┘
```

### 6.2 Recommended Manga Blending Workflows

**Screentone Application:**
```
Action: Add screentone over sketch
Tool: Text overlay with screentone color
Blend Mode: Multiply
Opacity: 50-100%
Result: Dark gray overlay preserves underlying artwork
```

**Speed Lines & Motion:**
```
Action: Add white speed lines
Tool: Line overlay
Blend Mode: Screen  (or Color Dodge for intense)
Opacity: 75-100%
Result: White lines appear to glow/stand out
```

**Shadow Enhancement:**
```
Action: Deepen shadows
Tool: Dark gray overlay
Blend Mode: Multiply + Darken
Opacity: 30-60%
Result: Natural darkening without losing detail
```

**Highlight & Light Effects:**
```
Action: Add shine/highlight
Tool: White/light overlay
Blend Mode: Screen or Addition
Opacity: 40-80%
Result: Luminous effects
```

**Color Tinting (for color manga):**
```
Action: Tint scene with warm/cool color
Tool: Semi-transparent color layer
Blend Mode: Color or Overlay
Opacity: 20-40%
Result: Atmospheric color shift
```

### 6.3 Blending Mode Implementation

```typescript
type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

interface TextOverlay {
  blendMode: BlendMode;
  opacity: number;  // 0-100
}

// CSS implementation
.overlay {
  mix-blend-mode: multiply;  /* CSS property */
  opacity: 0.75;
}

// Canvas implementation
const ctx = canvas.getContext('2d');
ctx.globalCompositeOperation = 'multiply';
ctx.globalAlpha = 0.75;
```

### 6.4 Blending Mode Presets for Manga

```typescript
const MANGA_BLEND_PRESETS = {
  screentone: {
    mode: 'multiply',
    opacity: 75,
    description: 'Standard screentone application'
  },
  shadow: {
    mode: 'multiply',
    opacity: 50,
    description: 'Deep shadow enhancement'
  },
  spotlight: {
    mode: 'screen',
    opacity: 80,
    description: 'Bright light/highlight'
  },
  speedLines: {
    mode: 'screen',
    opacity: 90,
    description: 'Motion/speed lines'
  },
  glow: {
    mode: 'color-dodge',
    opacity: 60,
    description: 'Intense glow effect'
  },
  tint: {
    mode: 'color',
    opacity: 30,
    description: 'Atmospheric color shift'
  },
};
```

---

## 7. Integrated Color Management Panel

### 7.1 Full Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│  COLOR MANAGER                                    [_][□][x]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PRIMARY COLOR PICKER                            │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  ┌──────────────────────┐  ┌──────────────────┐ │  │
│  │  │  SV Grid             │  │ Current: #C080A0 │ │  │
│  │  │  (HSV Mode)          │  │                  │ │  │
│  │  │  S ────────────────► │  │ ████████████████ │ │  │
│  │  │  │                   │  │ Previous: #000000│ │  │
│  │  │  V │                 │  │ ████░░░░░░░░░░░░│ │  │
│  │  │    ▼                 │  │                  │ │  │
│  │  └──────────────────────┘  └──────────────────┘ │  │
│  │                                                  │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │ Hue: [▓░░░░░░░░░░░░░] 340°              │   │  │
│  │  │ Sat: [██████████░░░░░░░░] 67%           │   │  │
│  │  │ Val: [████████░░░░░░░░░░░░] 75%        │   │  │
│  │  │ Opa: [███████░░░░░░░░░░░░░░] 87%       │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  │  Hex: [ #C080A0 ]  [Copy]  [Paste]             │  │
│  │  [HSV] [RGB] [HEX]                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  QUICK ACCESS PALETTES                           │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  Screentones:  ░░ ▓▓ ▓░ ██ [+] [>]             │  │
│  │  Recent (8):   ██ ▓▓ ░░ █░ ▓░ ░░ ██ ░░         │  │
│  │                                                  │  │
│  │  [Manga Trad] [Grays] [Effects] [+ New]        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OVERLAY OPTIONS                                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  Blend Mode:  [▼ Multiply          ]            │  │
│  │  Opacity:     [███████░░░░░] 75%  [75]         │  │
│  │  └─ Presets: [10%] [25%] [50%] [75%] [100%]   │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [🎨 Picker] [💧 Eyedropper] [⚙ Options]             │  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Compact Panel Layout

For docked/side panel in studio:

```
┌─────────────────────────────────────┐
│  COLOR                              │
├─────────────────────────────────────┤
│                                     │
│  Current:                           │
│  ████████████████████████████████   │
│                                     │
│  H: [███░░░░░░░░░░] 340°           │
│  S: [██████████░░░░░░░░] 67%       │
│  V: [████████░░░░░░░░░░░░] 75%    │
│  A: [███████░░░░░░░░░░░░░░] 87%   │
│                                     │
│  Hex: #C080A0  [Copy] [•••]        │
│                                     │
│  ┌─────────────────────────────────┤
│  │ Screentones: ░▓▓▓██ [▸]         │
│  │ Recent: ██▓░░█░░ [▸]            │
│  └─────────────────────────────────┤
│                                     │
│  Mode: [▼ Multiply] Opa: [75%]     │
│                                     │
│  [Eyedropper] [More]               │
└─────────────────────────────────────┘
```

### 7.3 Floating Picker

Detachable color picker for reference while editing:

```
┌─────────────────────┐
│  [─][+][×]          │
│  Color Picker       │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │  SV Grid (small)│ │
│ │  └──┐           │ │
│ └──────────────────┘ │
│ H:[▓░░░░░░░] 340°   │
│ Hex: #C080A0 [Copy] │
│ Opa: [███░░░░] 75%  │
│ Mode:[▼ Multiply]   │
│                     │
│ Recent: ██▓░░       │
└─────────────────────┘
  (Draggable header)
```

---

## 8. Keyboard Shortcuts & Quick Actions

### 8.1 Color Selection Shortcuts

```
[C]           - Open/focus color picker
[E]           - Activate eyedropper tool
[Q]           - Quick palette toggle
[R]           - Swap current/previous color
[Ctrl+C]      - Copy current color (hex) to clipboard
[Ctrl+V]      - Paste hex color from clipboard
[Ctrl+Shift+C]- Copy RGB(a) format
```

### 8.2 Color Adjustment Shortcuts

```
[Ctrl + Mouse Wheel]  - Adjust opacity in 5% steps
[Shift + Mouse Wheel] - Adjust hue in 5° steps
[Alt + Mouse Wheel]   - Adjust saturation/value

[+]           - Increase opacity 10%
[-]           - Decrease opacity 10%
[>]           - Next palette color (cycling)
[<]           - Previous palette color (cycling)

[0]           - 0% opacity
[1]           - 10% opacity
[2]           - 25% opacity
[3]           - 50% opacity
[4]           - 75% opacity
[5]           - 100% opacity
```

### 8.3 Eyedropper Shortcuts

```
[E]           - Toggle eyedropper
[Escape]      - Cancel eyedropper
[Space]       - Confirm sample
[Shift+Click] - Average surrounding pixels
[Ctrl+Click]  - Sample with holding alt to continue
```

### 8.4 Palette Shortcuts

```
[Shift+S]     - Show screentone palette
[Shift+G]     - Show gray palette
[Shift+R]     - Show recent colors
[Shift+1-9]   - Apply palette preset 1-9
```

---

## 9. Implementation in MangaFusion Studio

### 9.1 Integration Points

**Current Structure:**
```
Studio Editor
├── Pages List (left sidebar)
├── Canvas (center)
│   └── Overlays
│       ├── Text (with color, stroke)
│       ├── Bubble (with color, stroke)
│       └── Image
└── Tools Panel (right sidebar)
    ├── Dialogue Editor
    ├── Visual Edit Prompt
    └── Style References
```

**Proposed Addition:**
```
Studio Editor
├── Pages List (left sidebar)
├── Canvas (center)
│   └── Overlays with Color Management
├── Tools Panel (right sidebar - existing)
└── ► NEW ◄ Color Manager Panel (right side, below tools)
    ├── Color Picker
    ├── Palette Management
    └── Overlay Blending Controls
```

### 9.2 Studio Overlay Color Properties

Extend current `Overlay` interface:

```typescript
interface Overlay {
  // Existing properties
  id: string;
  type: 'text' | 'bubble' | 'image';
  x: number; y: number; w: number; h: number;
  text?: string;
  fontSize?: number;
  color?: string;        // Text color (hex)
  stroke?: string;       // Border/stroke color (hex)
  imageUrl?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  radius?: number;

  // NEW: Enhanced color management
  colorMode?: 'hex' | 'rgb' | 'hsv';
  opacity?: number;           // 0-100
  backgroundColor?: string;   // Background fill color
  backgroundOpacity?: number; // 0-100
  blendMode?: BlendMode;      // mix-blend-mode

  // Stroke enhancements
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeBlendMode?: BlendMode;
}
```

### 9.3 Color Picker Integration in Studio

```typescript
interface StudioColorState {
  currentColor: Color;
  currentOpacity: number;
  currentBlendMode: BlendMode;

  selectedOverlayId?: string;

  recentColors: Color[];
  pinnedColors: Color[];

  activeTab: 'picker' | 'palettes' | 'history';
}

// When overlay is selected, show its color properties
const handleOverlaySelect = (overlay: Overlay) => {
  setColorState({
    currentColor: Color.fromHex(overlay.color),
    currentOpacity: overlay.opacity ?? 100,
    currentBlendMode: overlay.blendMode ?? 'normal',
    selectedOverlayId: overlay.id,
  });
};

// When color changes, update selected overlay
const handleColorChange = (color: Color) => {
  if (!selectedOverlay) return;

  const updated = {
    ...selectedOverlay,
    color: color.toHex(),
    opacity: currentOpacity,
    blendMode: currentBlendMode,
  };

  updateOverlay(selected.pageId, updated);
  addToRecentColors(color);
};
```

### 9.4 Studio UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ STUDIO EDITOR - Episode 1                         [−][□][×]
├────────────────────┬──────────────────┬─────────────────┤
│                    │                  │                 │
│  Pages             │                  │ Tools Panel     │
│  ─────────────────│  CANVAS          │ ─────────────   │
│  □ Page 1 (sel)   │  ┌──────────────┐│ Dialogue...     │
│  □ Page 2         │  │              ││ Visual Edit...  │
│  □ Page 3         │  │   Overlays   ││ Style Refs...   │
│  □ Page 4         │  │              ││                 │
│  □ Page 5         │  │              ││ ─────────────   │
│                    │  │              ││ COLOR MANAGER   │
│  [+ Add Page]     │  └──────────────┘│ ─────────────   │
│                    │                  │ Current: #C080A0│
│                    │                  │ ████████████░░  │
│                    │                  │                 │
│                    │                  │ H:[▓░░░░░░░] 340°│
│                    │                  │ S:[██████░░░░]  │
│                    │                  │ V:[████░░░░░░]  │
│                    │                  │                 │
│                    │                  │ Hex: #C080A0    │
│                    │                  │ [Eyedropper]    │
│                    │                  │                 │
│                    │                  │ Opacity: [███░░]│
│                    │                  │                 │
│                    │                  │ Mode: [▼Normal] │
│                    │                  │                 │
│                    │                  │ Palettes:       │
│                    │                  │ [Screentones]   │
│                    │                  │ ░ ▓ ▓ ░ ░ ██    │
│                    │                  │                 │
│                    │                  │ Recent:         │
│                    │                  │ ██▓░░░░██░░     │
└────────────────────┴──────────────────┴─────────────────┘
```

---

## 10. Recommended Libraries & Tech Stack

### 10.1 Color Manipulation Libraries

```typescript
// 1. TinyColor2 (lightweight, well-tested)
import tinycolor from 'tinycolor2';

const color = tinycolor('#C080A0');
const hsv = color.toHsv();
const hex = color.toHex();
const rgb = color.toRgb();

// 2. Chroma.js (powerful color transformations)
import chroma from 'chroma-js';

const color = chroma('#C080A0');
const hex = color.hex();
const hsv = color.hsv();
const lab = color.lab();

// 3. Color (simple & pure JS)
import Color from 'color';

const color = new Color('#C080A0');
const hsv = color.hsv();
const hex = color.hex();

// Recommendation: TinyColor2 for manga app
// - Small bundle size (~6KB)
// - Good HSV support (important for tonal work)
// - Simple API
```

### 10.2 Color Picker Components

```typescript
// Option 1: react-color (well-maintained)
import { ChromePicker } from 'react-color';

<ChromePicker
  color={color}
  onChangeComplete={handleChange}
/>

// Option 2: tldraw (used in drawing apps)
import { ColorPicker } from '@tldraw/ui';

// Option 3: Custom implementation using Canvas
// (Recommended for manga-specific features)

// Option 4: Vanilla JS canvas picker
// - Full control over manga-specific features
// - Optimized for screentone palettes
// - Better performance
```

### 10.3 CSS for Blending Modes

```css
/* Standard CSS mix-blend-mode support */
.overlay {
  mix-blend-mode: multiply;
  opacity: 0.75;
}

/* For unsupported browsers, fallback */
@supports not (mix-blend-mode: multiply) {
  .overlay {
    /* Use alternative blending */
    opacity: 0.75;
    background-blend-mode: multiply;
  }
}
```

### 10.4 Recommended Tech Stack

```
Frontend Color Management:
├── TinyColor2 (color conversion)
├── Custom Canvas-based Color Picker
├── React Hooks for state management
├── localStorage for palette persistence
└── HTML Canvas for color preview/blend simulation

Backend (Optional):
├── User palette storage (Prisma)
├── Color history per user
├── Shared palette management
└── Color accessibility validation
```

---

## 11. Color Accessibility & Manga-Specific Considerations

### 11.1 Contrast Checking

```typescript
interface ColorAccessibility {
  wcagScore: 'AAA' | 'AA' | 'Fail';
  contrastRatio: number;
  recommendations: string[];
}

function checkContrast(foreground: Color, background: Color): ColorAccessibility {
  const ratio = getContrastRatio(foreground, background);

  return {
    wcagScore:
      ratio >= 7 ? 'AAA' :
      ratio >= 4.5 ? 'AA' :
      'Fail',
    contrastRatio: ratio,
    recommendations: [
      ratio < 4.5 ? 'Consider increasing contrast for accessibility' : null,
      'This color pair is readable at small sizes' : null,
    ].filter(Boolean) as string[],
  };
}
```

### 11.2 Grayscale Preview

**For checking manga readability:**

```
┌─────────────────────────────────────┐
│ Preview: [ RGB ] [ Grayscale ] [BW] │
│                                     │
│ Grayscale preview shows how colors  │
│ appear when printed in b/w          │
│ or viewed by color-blind users      │
│                                     │
│ Current Palette:                    │
│ Color:     [████████████░░░░░░░░░] │
│ Grayscale: [████░░░░░░░░░░░░░░░░░] │
│ B&W:       [█████░░░░░░░░░░░░░░░░] │
│                                     │
│ Luminance: 50% (good contrast)      │
└─────────────────────────────────────┘
```

### 11.3 Manga-Specific Color Notes

```
1. SCREENTONES
   - Traditional manga uses halftone patterns
   - Digital screentones are grayscale values
   - Avoid saturated colors for professional look

2. INK BLACKS
   - Use pure black (#000000) for inking
   - Avoid very dark grays if crispness matters
   - Ensure high contrast with white paper

3. PAPER TONES
   - Standard is white (#FFFFFF)
   - Tinted paper backgrounds are optional
   - Avoid very light grays unless intentional

4. TEXT READABILITY
   - Black text on white background (highest contrast)
   - White text on black background (acceptable)
   - Avoid low-contrast color combinations
   - Consider both screen and print readability

5. DIALOGUE BUBBLES
   - Default: black text on white bubble
   - Optional: subtle gray background (#F5F5F5)
   - Avoid rainbow borders (unprofessional)
   - Simple geometric shapes preferred
```

---

## 12. Implementation Roadmap

### Phase 1: Core Color Picker (MVP)
```
Week 1-2:
- Implement HSV color picker (canvas-based)
- RGB/Hex input modes
- Recent colors tracking (localStorage)
- Integration with existing overlay color properties
- Basic opacity slider
```

### Phase 2: Palettes & Presets
```
Week 3-4:
- Screentone preset library
- Named palette system
- Palette CRUD operations
- Palette import/export
- UI for palette selection
```

### Phase 3: Advanced Features
```
Week 5-6:
- Eyedropper tool implementation
- Blending modes dropdown
- Opacity presets
- Color history with pinning
- Keyboard shortcut system
```

### Phase 4: Polish & Performance
```
Week 7-8:
- Optimize color picker rendering
- Add color accessibility checker
- Grayscale preview mode
- User preference persistence
- Documentation & help system
```

---

## 13. Component Structure

### 13.1 React Component Hierarchy

```
ColorManager
├── ColorPickerPanel
│   ├── ColorPickerCanvas
│   ├── HueSlider
│   ├── OpacitySlider
│   ├── ColorInputs (HSV/RGB/Hex)
│   └── ColorPreview
│
├── PalettePanel
│   ├── PaletteSelector
│   ├── PaletteGrid
│   │   └── ColorSwatch[]
│   ├── RecentColorsStrip
│   └── PaletteActions (Add, Edit, Delete)
│
├── OverlayBlendingPanel
│   ├── BlendModeSelector
│   ├── OpacityControl
│   └── PreviewToggle
│
├── EyedropperTool
│   ├── EyedropperCursor
│   ├── MagnifiedPreview
│   └── SampleResult
│
└── ColorHistory
    ├── RecentColorsList
    └── PinnedColorsList
```

### 13.2 Custom Hooks

```typescript
// useColorPicker - Main color management hook
const [color, setColor] = useColorPicker('#000000');

// useColorHistory - Track recent colors
const { recent, pinned, add, pin } = useColorHistory();

// useEyedropper - Eyedropper functionality
const { active, sample, cancel } = useEyedropper(canvasRef);

// useColorPalette - Palette management
const { palettes, current, create, update, delete: remove } = useColorPalette();

// useColorAccessibility - Check contrast/readability
const { contrast, wcag, recommendations } = useColorAccessibility(fg, bg);
```

---

## 14. Example Usage in Studio

```typescript
// In pages/studio/[id].tsx

const [colorState, setColorState] = useState({
  currentColor: '#000000',
  opacity: 100,
  blendMode: 'normal',
});

const [selectedOverlay, setSelectedOverlay] = useState<Overlay | null>(null);

// When overlay selected, load its color
const selectOverlay = (overlay: Overlay) => {
  setSelectedOverlay(overlay);
  setColorState({
    currentColor: overlay.color,
    opacity: overlay.opacity ?? 100,
    blendMode: overlay.blendMode ?? 'normal',
  });
};

// When color changes, update overlay
const updateOverlayColor = (newColor: string) => {
  if (!selectedOverlay) return;

  const updated = {
    ...selectedOverlay,
    color: newColor,
    opacity: colorState.opacity,
    blendMode: colorState.blendMode,
  };

  updateOverlay(selectedOverlay.id, updated);
};

return (
  <Layout>
    <div className="flex h-[calc(100vh-120px)]">
      {/* Canvas and other panels... */}

      {/* NEW: Color Manager Panel */}
      <ColorManager
        color={colorState.currentColor}
        opacity={colorState.opacity}
        blendMode={colorState.blendMode}
        onColorChange={updateOverlayColor}
        onOpacityChange={(op) => setColorState({...colorState, opacity: op})}
        onBlendModeChange={(mode) => setColorState({...colorState, blendMode: mode})}
      />
    </div>
  </Layout>
);
```

---

## 15. Testing Strategy

### 15.1 Unit Tests

```typescript
// Color conversion tests
describe('Color', () => {
  test('converts hex to HSV', () => {
    const color = Color.fromHex('#FF0000');
    expect(color.hsv).toEqual({ h: 0, s: 100, v: 100 });
  });
});

// Blending mode tests
describe('BlendingModes', () => {
  test('multiply blending darkens colors', () => {
    // Test multiply math
  });
});

// Palette tests
describe('Palettes', () => {
  test('saves and loads palettes from localStorage', () => {
    // Test persistence
  });
});
```

### 15.2 Integration Tests

```typescript
// Eyedropper functionality
test('eyedropper samples correct pixel color', () => {
  // Canvas setup
  // Eyedropper click
  // Assert color matches
});

// Overlay color updates
test('updating overlay color reflects in canvas', () => {
  // Select overlay
  // Change color
  // Assert canvas renders new color
});
```

### 15.3 Visual Regression Tests

```typescript
// Screenshot tests for color picker UI
// Verify palette display consistency
// Check contrast in different themes
```

---

## Conclusion

This color management system is designed specifically for manga workflows while providing professional-grade color tools. The emphasis on screentones, grayscale tones, and quick palette access makes it intuitive for manga artists while the advanced features (blending modes, eyedropper, history) provide power users with full control.

**Key strengths:**
- Manga-optimized with screentone palettes
- Fast color access through recent colors & presets
- Professional blending modes for effects
- Accessibility-conscious (contrast checking, grayscale preview)
- Keyboard-friendly for workflow speed
- Extensible for future features (CMYK, advanced patterns, etc.)

**Next steps:**
1. Prototype HSV color picker on canvas
2. Create screentone preset library
3. Integrate with existing overlay system
4. Add eyedropper tool
5. Implement blending mode controls
6. Gather artist feedback and iterate

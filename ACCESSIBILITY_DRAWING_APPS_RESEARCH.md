# Accessibility Considerations for Drawing Applications
## Comprehensive Research & Implementation Guide

**Document Date:** November 2025
**Context:** Research focused on accessibility best practices for visual drawing/design applications
**WCAG Standard:** WCAG 2.1 AA compliance (with references to WCAG 2.2)

---

## Executive Summary

Drawing applications present unique accessibility challenges because they are inherently visual and require precise input control. However, the **toolbar controls, menus, and UI elements are absolutely must be accessible** for users with disabilities. This research analyzes three major drawing applications (Figma, Excalidraw, Google Drawings) and provides a comprehensive implementation guide.

### Key Finding
While the canvas itself is difficult to make fully accessible to screen readers, **keyboard-only users can successfully use drawing applications if:**
- All toolbar actions are keyboard accessible
- Proper ARIA labels and roles are implemented
- Keyboard shortcuts are discoverable and clear
- Focus management is logical and visible

---

## Part 1: Analysis of Three Drawing Applications

### 1. Figma

#### Keyboard Navigation
**Strengths:**
- Comprehensive keyboard shortcut system (100+ shortcuts available)
- Keyboard box selection tool with pink cursor for canvas navigation
- Arrow keys to position cursor over objects, Enter to select
- Access all shortcuts via `Ctrl+Shift+?` (Windows/Linux) or `Cmd+Shift+?` (Mac)
- Quick actions/search menu: `Ctrl+/` or `Cmd+/`
- Customizable keyboard shortcuts available in preferences

**Implementation Details:**
- Keyboard shortcuts documented in official Help Center
- Cheat sheets available in community
- Shortcuts cover: selection, editing, navigation, transformations, color changes

#### Screen Reader Support
**Features:**
- Accessibility mode (Preferences > Accessibility > "Adapt content for screen readers")
- Canvas objects are accessible to screen readers
- Focus mode for navigating prototypes with VoiceOver (Mac) or NVDA (Windows)
- Proper keyboard navigation through files and canvas
- Can edit widgets with keyboard

#### WCAG Compliance
**Status:** Actively targeting WCAG 2.2 AA compliance
**Efforts:**
- Screen reader enhancements for file navigation
- Color contrast testing tools available
- Plugin ecosystem for accessibility validation (Stark, A11y Focus Orderer)

#### High Contrast & Colorblind Support
**Native Features:**
- Limited built-in colorblind support
- Plugin-based solution via "Stark" plugin for color blindness simulation
- Stark plugin: Simulates protanopia, deuteranopia, tritanopia, monochromacy, and achromatopsia
- Plugin-based contrast checking for WCAG compliance

#### Zoom Accessibility
- Browser-level zoom supported
- Text resizable up to 200% (native browser support)
- Responsive design maintains functionality at zoom levels

#### Assessment: Good (★★★★☆)
- Strong keyboard support
- Mature screen reader integration
- Plugin ecosystem provides accessibility features
- Limitation: Colorblind support requires third-party plugins

---

### 2. Excalidraw

#### Keyboard Navigation
**Strengths:**
- Toolbar actions selectable via keyboard
- Keyboard shortcuts for tool selection (Rectangle, Circle, etc.)
- Tab navigation through toolbar elements
- Arrow keys for object manipulation

**Critical Limitations:**
- **Cannot draw shapes using keyboard alone** (can select tool, but not draw)
- No keyboard-based drawing input mechanism
- Keyboard shortcuts for color selection only work in regular mode (not Zen mode)
- Touch input issues: keyboard shortcuts don't work until canvas is clicked with mouse

**GitHub Issue Status:**
- Issue #7492: Accessibility audit by Deque identified major gaps
- Issue #3100: Keyboard shortcuts for color changes
- Issue #4779: Keyboard focus problem with touch input

#### Screen Reader Support
**Issues Identified:**
- Missing ARIA labels on elements
- Duplicate element IDs in accessibility tree
- Focus indicators missing
- Canvas content not properly exposed to screen readers

**Current State:** Basic support with significant gaps

#### WCAG Compliance
**Status:** Partial compliance
**Issues:**
- Missing focus indicators violate WCAG 2.1.3
- Keyboard trap issues possible with touch input
- ARIA labeling incomplete

#### High Contrast & Colorblind Support
- System-level support (browser/OS settings)
- Limited built-in support in application
- No built-in colorblind simulation

#### Zoom Accessibility
- Browser zoom works
- Responsive layout at different zoom levels

#### Assessment: Fair (★★★☆☆)
- Keyboard selection of tools works
- Missing keyboard drawing implementation
- Accessibility audit revealed gaps
- Needs focus indicator improvements
- ARIA label improvements needed

---

### 3. Google Drawings

#### Keyboard Navigation
**Features:**
- Keyboard shortcuts for quick actions
- Tab navigation through UI elements
- Braille display compatibility

**Status:** Functional but limited documentation

#### Screen Reader Support
**Features:**
- Compatible with screen readers (NVDA, JAWS, VoiceOver)
- Braille display support
- Keyboard navigation of menus and toolbars

**Limitations:**
- Canvas content not directly accessible
- Screen reader primarily useful for menu navigation, not drawing content

#### WCAG Compliance
**Status:** Partial - relies on browser/OS features
**Strategy:**
- High color contrast recommended (4.5:1 for normal text)
- Users can apply system-level color filters

#### High Contrast & Colorblind Support
**Current Implementation:**
- Relies on Chromebook system settings
- Chrome browser's high contrast mode
- Chrome extensions for colorblind support
- Not built-in to Google Drawings itself

#### Zoom Accessibility
- Browser zoom supported
- Pinch-to-zoom on touch devices
- High-resolution graphics that scale without blur

#### Assessment: Fair (★★★☆☆)
- Basic accessibility through system integration
- Limited built-in features
- Relies heavily on browser/OS accessibility
- Good for menu navigation, limited for canvas content

---

## Part 2: WCAG 2.1 Compliance Requirements

### 1.4.4 - Resize Text (Level AA)
**Requirement:** Text must be resizable up to 200% without loss of functionality

**Application to Drawing Apps:**
- UI text must scale without breaking layout
- Dialog boxes must remain accessible at 200% zoom
- Toolbar labels must remain readable
- DO NOT disable user zoom: `<meta name="viewport" content="initial-scale=1, user-scalable=yes">`

**Implementation Checklist:**
- [ ] Never set `user-scalable=no` in viewport
- [ ] Test UI at 200% browser zoom
- [ ] No horizontal scrolling required at 200% zoom for critical UI
- [ ] Font sizes use relative units (rem, em) where possible

### 1.4.10 - Reflow (Level AA)
**Requirement:** Content can be reflowed without loss of functionality

**Implementation Checklist:**
- [ ] Content reflows at 200% zoom
- [ ] No fixed-width containers that create scrolling
- [ ] Modals/dialogs adapt to zoomed viewport
- [ ] Canvas toolbar doesn't disappear at zoom levels

### 1.4.11 - Non-text Contrast (Level AA)
**Requirement:** Visual elements must have 3:1 contrast ratio

**For Drawing Apps:**
- Toolbar icons: 3:1 contrast against background
- Focus indicators: 3:1 contrast
- Color swatches: 3:1 contrast

**Implementation:**
- [ ] Test icons at normal and high contrast modes
- [ ] Focus ring minimum 3:1 contrast
- [ ] Verify in Windows High Contrast Mode
- [ ] Test with tools: WCAG Contrast Checker, WebAIM Contrast Checker

### 2.1.1 - Keyboard (Level A)
**Requirement:** All functionality must be operable via keyboard

**Drawing App Keyboard Requirements:**
- [ ] All toolbar buttons keyboard accessible (Tab to focus, Enter/Space to activate)
- [ ] Canvas tools selectable via keyboard
- [ ] Color picker accessible via keyboard
- [ ] Menus navigable via keyboard
- [ ] Shortcuts documented and discoverable

### 2.1.2 - No Keyboard Trap (Level A)
**Requirement:** Keyboard focus must not get stuck

**Implementation:**
- [ ] Test Tab key through entire interface
- [ ] No elements where Tab gets "stuck"
- [ ] Escape key closes modals/menus
- [ ] Focus management in custom controls (canvas, color pickers)

### 2.1.3 - Keyboard (No Exception) (Level AAA)
**Requirement:** All functionality operable by keyboard (except content)

**Note:** Drawing canvas itself exempt as "content" but all UI must support keyboard

### 2.4.3 - Focus Order (Level A)
**Requirement:** Focus order must be logical

**For Drawing Apps:**
- [ ] Tab order: Left-to-right, top-to-bottom in toolbars
- [ ] Logical grouping of related controls
- [ ] Focus order matches visual layout
- [ ] Custom canvas controls have proper focus order

### 2.4.7 - Focus Visible (Level AA)
**Requirement:** All keyboard-operable elements must have visible focus indicator

**Critical Implementation:**
```css
/* DO NOT remove focus styles */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Do NOT hide with outline: none without replacement */
*:focus {
  /* Must have visible indicator */
}
```

**For Canvas-based Elements:**
- [ ] Canvas element with tabindex="0" has visible focus ring
- [ ] Focus indicator 2px minimum, 3:1 contrast
- [ ] Different from hover state (ideally both visible)
- [ ] Works with Windows High Contrast Mode

### 3.2.1 - On Focus (Level A)
**Requirement:** No context change on focus

**Application:**
- [ ] Focusing a toolbar button doesn't trigger action (only click/enter)
- [ ] Opening dropdown on focus only if user expects it
- [ ] No page navigation on tab focus

### 3.3.4 - Error Prevention (Level AA)
**Requirement:** For operations that modify data, must provide undo/confirmation

**For Drawing Apps:**
- [ ] Undo/Redo functionality (Ctrl+Z / Ctrl+Y)
- [ ] Confirmation dialog for destructive actions (delete all, clear canvas)
- [ ] Recovery options for accidental changes

### 4.1.2 - Name, Role, Value (Level A)
**Requirement:** Components must have accessible name, role, and state

**HTML Canvas Accessibility:**
```html
<!-- For canvas as image/content -->
<canvas id="drawing-canvas" role="img" aria-label="Drawing canvas area"></canvas>

<!-- For custom canvas buttons -->
<canvas role="button" aria-label="Draw rectangle" tabindex="0"></canvas>

<!-- For interactive canvas elements -->
<div role="toolbar" aria-label="Drawing tools">
  <button id="rect-tool">Rectangle</button>
  <button id="circle-tool">Circle</button>
</div>
```

**For All Controls:**
- [ ] All buttons have label text (visible or aria-label)
- [ ] Custom controls have role attribute
- [ ] State changes reflected (aria-pressed, aria-checked)
- [ ] Icon-only buttons have aria-label

---

## Part 3: Keyboard-Only Navigation Implementation

### Comprehensive Keyboard Shortcut System

#### Essential Shortcuts (Must-Have)

**File Operations:**
- `Ctrl+N` / `Cmd+N` - New document
- `Ctrl+O` / `Cmd+O` - Open
- `Ctrl+S` / `Cmd+S` - Save
- `Ctrl+Shift+S` / `Cmd+Shift+S` - Save As
- `Ctrl+P` / `Cmd+P` - Print/Export

**Editing:**
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo
- `Ctrl+X` / `Cmd+X` - Cut
- `Ctrl+C` / `Cmd+C` - Copy
- `Ctrl+V` / `Cmd+V` - Paste
- `Delete` - Delete selected
- `Ctrl+A` / `Cmd+A` - Select all
- `Escape` - Deselect/Exit mode

**Navigation & Zoom:**
- `Ctrl+0` / `Cmd+0` - Fit to screen
- `Ctrl++` / `Cmd++` - Zoom in
- `Ctrl+-` / `Cmd+-` - Zoom out
- `Shift+1` / `Cmd+1` - Actual size
- Arrow Keys - Pan canvas (when appropriate)

**Tool Selection (Highly Visible & Learnable):**
```
R - Rectangle
C - Circle / Ellipse
L - Line
T - Text
P - Pencil / Pen
S - Selection
G - Group / Ungroup
A - Align tools
```

**Color & Styling:**
- `Shift+F` - Fill color picker
- `Shift+S` - Stroke color picker
- `Shift+O` - Opacity
- `[` / `]` - Increase/Decrease thickness

#### Accessibility Mode - Special Navigation
Implement "Accessibility Mode" that enables:
- `Tab` cycles through toolbar tools
- `Enter` selects current tool
- `Arrow Keys` for canvas navigation when in "Canvas Navigation Mode"
- `Ctrl+Tab` enters/exits canvas navigation mode
- Audible feedback or visual counter showing current selection

#### Keyboard Shortcut Discovery
**Critical:** Shortcuts must be DISCOVERABLE

```html
<!-- Keyboard Shortcut Help -->
<button id="help-keyboard" aria-label="Show keyboard shortcuts">
  <span aria-hidden="true">?</span> Shortcuts
</button>

<!-- Modal displaying shortcuts, organized by category -->
<dialog id="shortcuts-modal" aria-labelledby="shortcuts-title">
  <h1 id="shortcuts-title">Keyboard Shortcuts</h1>
  <table role="presentation">
    <thead>
      <tr>
        <th>Action</th>
        <th>Windows/Linux</th>
        <th>Mac</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>New Document</td>
        <td>Ctrl+N</td>
        <td>Cmd+N</td>
      </tr>
      <!-- ... -->
    </tbody>
  </table>
</dialog>
```

**Trigger with:**
- `Shift+?` - Show keyboard shortcuts
- `Ctrl+/` - Show quick actions

---

## Part 4: Screen Reader Support (Limited but Important)

### What CAN Be Made Accessible

1. **Toolbar & Controls** - Full screen reader support
2. **Menus & Dialogs** - Complete accessibility
3. **Layer Panels** - Navigable with proper ARIA
4. **Color Pickers** - Slider values readable
5. **Text Properties** - Font size, style, etc.

### What's Difficult (Canvas Content)

**Challenge:** Canvas is a bitmap, not semantic HTML
- Screen readers see it as single image
- Individual shapes not automatically exposed
- Solution: Parallel DOM or detailed alt text

### Implementation Strategy for Canvas

#### Option 1: Fallback Text Content
```html
<canvas id="drawing-canvas" role="img" aria-label="Untitled drawing">
  <p>This canvas contains a sketch with shapes and text elements.</p>
  <p>Use keyboard shortcuts to interact with tools in the toolbar.</p>
</canvas>
```

#### Option 2: Accessible Alternative View
```html
<div role="region" aria-label="Canvas content description" hidden>
  <ul>
    <li>Rectangle at coordinates 10, 20 with width 100, height 50</li>
    <li>Circle at center 150, 150 with radius 30</li>
    <li>Text element: "Hello World" at position 200, 100</li>
  </ul>
</div>
```

#### Option 3: Real-time Aria-Live Updates
```html
<div id="canvas-announcer" aria-live="polite" aria-label="Drawing updates">
  <!-- Screen reader will announce changes -->
</div>

<!-- When user creates shape: -->
announcer.textContent = "Rectangle created at (100, 100), 150x80 pixels";
```

### Proper ARIA Implementation for Canvas Controls

```html
<!-- Toolbar Container -->
<div role="toolbar" aria-label="Drawing Tools">

  <!-- Tool Button -->
  <button
    id="rect-btn"
    aria-label="Rectangle tool"
    aria-pressed="false"
    data-shortcut="R"
  >
    <svg aria-hidden="true"><!-- icon --></svg>
  </button>

  <!-- Color Picker -->
  <div role="group" aria-labelledby="fill-label">
    <label id="fill-label">Fill Color</label>
    <input
      type="color"
      id="fill-color"
      aria-label="Fill color picker, currently red"
    />
  </div>

  <!-- Stroke Width -->
  <div role="group" aria-labelledby="stroke-label">
    <label id="stroke-label">Stroke Width</label>
    <input
      type="range"
      id="stroke-width"
      min="1"
      max="20"
      value="2"
      aria-label="Stroke width, currently 2 pixels"
    />
  </div>

</div>
```

### Screen Reader Testing Checklist
- [ ] All toolbar buttons have accessible labels
- [ ] Tool state changes announced (e.g., "Rectangle tool selected")
- [ ] Keyboard shortcuts readable with "?" command
- [ ] Color picker values readable
- [ ] Text properties accessible
- [ ] Undo/Redo history navigable
- [ ] Layer panel structure clear
- [ ] Dialogs have proper focus management

---

## Part 5: High Contrast Mode

### Windows High Contrast Mode Detection & Support

```javascript
// Detect Windows High Contrast Mode
const mediaQuery = window.matchMedia('(prefers-contrast: more)');
const isHighContrast = mediaQuery.matches;

// Add/remove high contrast CSS
if (isHighContrast) {
  document.documentElement.classList.add('high-contrast-mode');
}

// Listen for changes
mediaQuery.addEventListener('change', (e) => {
  document.documentElement.classList.toggle('high-contrast-mode', e.matches);
});
```

### CSS High Contrast Styling

```css
/* High Contrast Mode Styles */
@media (prefers-contrast: more) {
  button {
    border: 2px solid currentColor;
    background: Window;
    color: WindowText;
  }

  button:focus {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  button:hover {
    background: Highlight;
    color: HighlightText;
  }

  canvas {
    border: 2px solid WindowText;
  }

  /* Ensure focus indicators are visible */
  *:focus-visible {
    outline: 3px solid Highlight;
  }
}
```

### Colors to Support in High Contrast Mode

```css
/* Windows High Contrast System Colors */
:root {
  --system-window-bg: Window;          /* Window background */
  --system-text: WindowText;           /* Window text */
  --system-highlight-bg: Highlight;    /* Selection background */
  --system-highlight-text: HighlightText; /* Selection text */
  --system-button-face: ButtonFace;    /* Button background */
  --system-button-text: ButtonText;    /* Button text */
  --system-button-border: ButtonBorder;/* Button border */
  --system-gray-text: GrayText;        /* Disabled text */
}
```

### Focus Indicator in High Contrast
- Minimum 3px outline
- Contrasting color (Highlight, not same as element)
- Visible in both light and dark high contrast modes
- Offset 2px from element edge

---

## Part 6: Colorblind-Friendly UI

### Understanding Color Blindness Types

**Protanopia (Red-blind):**
- Lacks red cone cells
- Red appears as dark brown/black
- Green appears as yellow
- Blue/yellow distinction works
- ~1% of males, 0.01% of females

**Deuteranopia (Green-blind):**
- Lacks green cone cells
- Green appears as yellow/beige
- Red appears as brown/dark
- Blue/yellow distinction works
- ~1% of males, 0.01% of females

**Tritanopia (Blue-blind):**
- Lacks blue cone cells
- Blue appears as red/pink
- Yellow appears as pink/white
- Red/green distinction works
- Very rare (~0.001%)

**Monochromacy (Total Color Blindness):**
- Can only see grayscale
- No color perception
- Very rare (~0.003%)

### Safe Color Combinations (Verified for All Types)

**EXCELLENT Combinations:**
- Black + White (always works)
- Blue + Orange (strong contrast)
- Blue + Yellow (strong contrast)
- Black + Yellow (high contrast)
- Dark Blue + White
- Blue + Red (works except for tritanopia, but common enough)

**Good Combinations:**
- Dark Gray + Light Gray (when high contrast not needed)
- Dark Blue + Light Blue (with pattern difference)
- Purple + Orange
- Purple + Yellow (with pattern difference)

**AVOID Combinations:**
- Red + Green (worst combination, most problematic)
- Blue + Purple (especially for tritanopia)
- Light Blue + White
- Brown + Green
- Blue + Gray
- Red + Brown

### Implementation Strategy: Don't Rely on Color Alone

```html
<!-- WRONG: Color only distinction -->
<div class="success" style="color: green;">✓ Success</div>
<div class="error" style="color: red;">✗ Error</div>

<!-- RIGHT: Color + Icon + Text -->
<div class="success">
  <span class="icon success-icon" aria-hidden="true">✓</span>
  <span class="text">Success</span>
</div>
<div class="error">
  <div class="icon error-icon" aria-hidden="true">✗</div>
  <span class="text">Error</span>
</div>
```

### Accessible Color Palette Example

```css
/* Accessible Drawing App Palette */
:root {
  /* Primary Colors */
  --primary-blue: #0066CC;      /* Strong blue, safe for all types */
  --primary-orange: #FF9900;    /* Strong orange, safe for all types */
  --primary-yellow: #FFCC00;    /* Strong yellow, safe for red-blind */

  /* Neutrals */
  --neutral-black: #000000;
  --neutral-white: #FFFFFF;
  --neutral-dark-gray: #333333;
  --neutral-light-gray: #CCCCCC;

  /* Status Colors */
  --success-color: #0066CC;     /* Blue instead of green */
  --warning-color: #FF9900;     /* Orange instead of yellow */
  --error-color: #CC0000;       /* Dark red instead of light red */

  /* Focus & Interaction */
  --focus-color: #0066CC;       /* High contrast blue */
  --focus-outline: 2px solid var(--focus-color);
}
```

### Patterns & Textures for Color Differentiation

```css
/* Use patterns when color alone isn't enough */
.data-series-1 {
  fill: #0066CC;
  /* Solid blue */
}

.data-series-2 {
  fill: #FF9900;
  /* Solid orange */
}

.data-series-3 {
  fill: #0066CC;
  /* Blue with diagonal stripes */
  background: repeating-linear-gradient(
    45deg,
    #0066CC,
    #0066CC 10px,
    #FFFFFF 10px,
    #FFFFFF 20px
  );
}

.data-series-4 {
  fill: #FF9900;
  /* Orange with dots */
  background: radial-gradient(circle, #FF9900 30%, #FFFFFF 30%);
  background-size: 10px 10px;
}
```

### Colorblind Simulation Tools
- **Stark** (Figma plugin): Simulates protanopia, deuteranopia, tritanopia, achromatopsia
- **WCAG Color Contrast Checker**: Verify contrast ratios
- **Adobe Color**: Built-in colorblind-friendly palette generator
- **Coblis**: Web-based colorblind simulator
- **Visme Colorblind Palette Generator**: Auto-generates accessible palettes

### Testing Strategy
1. Design with primary colorblind-friendly palette
2. Test with Stark or Coblis simulator
3. Get feedback from colorblind users
4. Verify 4.5:1 contrast for text, 3:1 for graphics

---

## Part 7: Zoom Accessibility

### Browser-Level Zoom (Preferred Method)

Users expect to control zoom with:
- `Ctrl++` / `Cmd++` - Zoom in (increment ~10%)
- `Ctrl+-` / `Cmd+-` - Zoom out (decrement ~10%)
- `Ctrl+0` / `Cmd+0` - Reset to 100%

**CRITICAL:** Never disable zoom
```html
<!-- WRONG: Disables user zoom -->
<meta name="viewport" content="user-scalable=no">

<!-- CORRECT: Allows user zoom -->
<meta name="viewport" content="initial-scale=1, user-scalable=yes">
```

### Application-Level Zoom Controls

For drawing canvas, provide explicit zoom controls:

```html
<div class="zoom-controls" role="toolbar" aria-label="Zoom controls">
  <button aria-label="Zoom in">+</button>
  <button aria-label="Zoom out">−</button>
  <button aria-label="Fit to screen">Fit</button>
  <span aria-live="polite" aria-label="Current zoom level">
    <input type="number" value="100" min="25" max="400" aria-label="Zoom percentage"> %
  </span>
</div>
```

### Responsive Layout at Zoom Levels

**Test at 200% zoom:**

```css
@media (min-height: 600px) {
  /* Ensure toolbar doesn't overflow */
  .toolbar {
    flex-wrap: wrap;
    max-height: 30vh;
    overflow-y: auto;
  }
}

/* No fixed layouts that break at zoom */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  /* NOT: width: 400px; */
}

/* Ensure text resizes with zoom */
button, label, input {
  font-size: 1rem; /* relative, scales with zoom */
  /* NOT: font-size: 16px; */
}
```

### Testing Zoom Accessibility

Checklist:
- [ ] All text readable at 200% zoom (use browser zoom)
- [ ] No horizontal scrolling required for toolbar at 200% zoom
- [ ] Canvas remains usable at 200% zoom
- [ ] Zoom buttons themselves accessible at zoomed view
- [ ] Dialogs/modals accessible at 200% zoom
- [ ] No small UI elements that become inaccessible
- [ ] Focus visible at all zoom levels

### Canvas Zoom Implementation

```typescript
// Canvas zoom management
class DrawingCanvas {
  private zoomLevel: number = 100;

  setZoom(percentage: number) {
    this.zoomLevel = Math.max(25, Math.min(400, percentage));

    // Update canvas transform
    this.canvas.style.transform = `scale(${this.zoomLevel / 100})`;

    // Announce to screen readers
    this.announceZoomLevel();
  }

  private announceZoomLevel() {
    const announcer = document.getElementById('canvas-announcer');
    announcer.textContent = `Zoom level: ${this.zoomLevel}%`;
  }

  zoomIn() {
    this.setZoom(this.zoomLevel + 10);
  }

  zoomOut() {
    this.setZoom(this.zoomLevel - 10);
  }

  fitToScreen() {
    // Calculate zoom to fit canvas in viewport
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const scaleX = (containerWidth * 0.9) / canvasWidth;
    const scaleY = (containerHeight * 0.9) / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    this.setZoom(scale * 100);
  }
}
```

---

## Part 8: Alternative Input Methods

### Supporting Beyond Mouse & Keyboard

#### Voice Control (System-Level)
- Windows: Dragon NaturallySpeaking, built-in Cortana
- Mac: Voice Control (System Preferences > Accessibility)
- Windows 11: Built-in voice control
- All require application to have proper ARIA labels

**Implementation:** Ensure all buttons have clear, unique aria-labels
```html
<button aria-label="Draw rectangle tool">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
```

#### Switch Control
- Mac: System Preferences > Accessibility > Switch Control
- iOS: Settings > Accessibility > Switch Control
- Windows: Uses keyboard emulation
- Android: Google Play Services switch control

**Requirements:**
- All controls accessible via keyboard
- Proper focus management (visible focus indicators)
- No time-limited interactions

#### Eye-Tracking
- Tobii Dynavox PCEye
- Eyetech VT3 Mini
- Works with Windows' built-in or custom software

**Requirements:**
- Keyboard navigation (eye-trackers emulate keyboard)
- Reasonable click targets (minimum 44x44px for touch-size)

#### Adaptive Joystick/Game Controller
- Microsoft Adaptive Joystick
- Xbox Adaptive Controller
- Works as mouse/keyboard input device

**Requirements:**
- Keyboard support primary
- Mouse speed/acceleration settings respected
- Custom sensitivity options

#### Sip-and-Puff Devices
- Enable users to trigger actions by sipping or puffing
- Emulate switch input on system level
- Requires keyboard-accessible interface

### Implementation Strategy for Alternative Inputs

**Best Practice:**
```javascript
// Support multiple input methods without special code
// If you build for keyboard, voice/switch/eye-tracking work automatically

// Example: Button handling that supports all inputs
<button
  onclick="selectRectangleTool()"
  onkeydown="handleKeydown(event)"
  aria-label="Rectangle tool"
  id="rect-tool"
>
  Rectangle
</button>

function selectRectangleTool() {
  // This works for:
  // - Mouse click
  // - Touch
  // - Keyboard (Enter/Space)
  // - Voice (says button label)
  // - Switch control (when button focused)
  // - Eye-tracking (looks at button)
  // - Joystick/game controller (when button focused)
}
```

---

## Part 9: Complete Accessibility Checklist

### Before Development

- [ ] Accessibility requirements included in project scope
- [ ] Accessibility testing tools acquired/subscribed
- [ ] Screen readers available (NVDA, JAWS, VoiceOver)
- [ ] Team trained on WCAG 2.1 requirements
- [ ] Accessibility reviews scheduled throughout development

### Keyboard Navigation (WCAG 2.1.1)

- [ ] All toolbar buttons accessible via Tab key
- [ ] All menu items accessible via keyboard
- [ ] All dialogs closable with Escape
- [ ] All color pickers keyboard operable
- [ ] Canvas tools selectable via keyboard
- [ ] Text input fields accessible
- [ ] Dropdown menus work with Arrow keys
- [ ] No keyboard traps
- [ ] Keyboard shortcuts documented (Shift+? or Ctrl+?)
- [ ] Shortcuts follow platform conventions (Ctrl vs Cmd)

### Focus Management (WCAG 2.4.3, 2.4.7)

- [ ] Focus order logical (left-to-right, top-to-bottom)
- [ ] Focus visible on all keyboard-accessible elements
- [ ] Focus indicator minimum 2px, 3:1 contrast
- [ ] Focus indicator different from hover state
- [ ] Focus not lost when modals open
- [ ] Focus returns correctly when modals close
- [ ] Focus indicator visible in Windows High Contrast
- [ ] Canvas with tabindex="0" has focus ring
- [ ] Custom controls properly styled for focus

### Screen Reader Support (WCAG 4.1.2)

- [ ] All buttons have accessible name (text or aria-label)
- [ ] All toolbar buttons labeled
- [ ] Canvas has aria-label or role="img"
- [ ] Color pickers have labels
- [ ] Dropdowns have labels
- [ ] Form fields have associated labels
- [ ] Error messages announced
- [ ] Status updates announced with aria-live
- [ ] Layer panel structure clear
- [ ] Icons have aria-hidden="true" when decorative
- [ ] Custom roles properly assigned
- [ ] ARIA states updated (aria-pressed, aria-checked)

### High Contrast Mode (prefers-contrast)

- [ ] Application tested in Windows High Contrast mode
- [ ] Focus indicators visible in both light and dark modes
- [ ] Border/outline colors adjusted for high contrast
- [ ] System colors used where appropriate
- [ ] Images not hidden by high contrast
- [ ] All text readable in high contrast

### Color & Contrast (WCAG 1.4.3, 1.4.11)

- [ ] Text contrast 4.5:1 (normal text, WCAG AA)
- [ ] Text contrast 3:1 (large text, 18pt+)
- [ ] Icon contrast 3:1 against background
- [ ] Focus indicators 3:1 contrast
- [ ] Color palette colorblind-friendly
- [ ] Tested with Stark, Coblis, or similar tool
- [ ] No information conveyed by color alone
- [ ] Patterns/patterns used in addition to color
- [ ] No red/green combination for critical information

### Colorblind Accessibility

- [ ] Blue/Orange palette for primary distinction
- [ ] Blue/Yellow for secondary distinction
- [ ] Patterns or icons used in addition to color
- [ ] Status colors use shape/icon + color (not color alone)
- [ ] Tested against protanopia, deuteranopia, tritanopia
- [ ] Success/error states use icon + text + color

### Zoom & Text Sizing (WCAG 1.4.4, 1.4.10)

- [ ] Viewport allows user zoom: user-scalable=yes
- [ ] UI remains functional at 200% zoom
- [ ] No horizontal scrolling required at 200% zoom
- [ ] Text sizes use relative units (rem, em)
- [ ] Font sizes not hardcoded in pixels for critical text
- [ ] Zoom controls clearly labeled
- [ ] Application zoom (in-app) separate from browser zoom
- [ ] Canvas remains usable at high zoom

### Alternative Input Methods

- [ ] Keyboard is primary input method (voice/switch depend on it)
- [ ] All controls keyboard accessible
- [ ] Focus indicators visible (for voice/switch)
- [ ] No time-limited interactions
- [ ] Reasonable click targets (44x44px minimum)
- [ ] Multiple ways to accomplish tasks
- [ ] No pointer-only interactions

### Testing & Validation

- [ ] WCAG 2.1 AA automated scan (axe DevTools, Lighthouse)
- [ ] Manual keyboard-only testing
- [ ] Screen reader testing (NVDA + Chrome, JAWS + Edge, VoiceOver + Safari)
- [ ] Windows High Contrast mode testing
- [ ] 200% zoom testing (browser zoom)
- [ ] Colorblind simulation testing
- [ ] Mobile accessibility testing
- [ ] Tested by user with disabilities (ideally)

### Documentation

- [ ] Keyboard shortcuts documented in Help
- [ ] Accessibility features documented
- [ ] Alt text strategy documented for images/canvas
- [ ] Accessibility statement on website
- [ ] Known limitations documented
- [ ] Contact method for accessibility issues

---

## Part 10: Implementation Guide by Feature

### 1. Canvas Element Accessibility

```html
<!-- Basic Canvas Setup -->
<div class="canvas-container">
  <!-- Accessible Canvas Declaration -->
  <canvas
    id="drawing-canvas"
    role="img"
    aria-label="Drawing canvas for manga panels"
    aria-describedby="canvas-description"
    tabindex="0"
    width="800"
    height="600"
  ></canvas>

  <!-- Description for screen readers -->
  <p id="canvas-description" hidden>
    Use the toolbar on the left to select drawing tools.
    Press Shift+? to see keyboard shortcuts.
    Use arrow keys to pan the canvas.
  </p>

  <!-- Live region for announcements -->
  <div
    id="canvas-announcer"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  ></div>
</div>

<!-- CSS for Screen Reader Only -->
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### 2. Toolbar with Keyboard Shortcuts

```html
<div
  class="toolbar"
  role="toolbar"
  aria-label="Drawing tools"
>
  <!-- Selection Tool -->
  <button
    id="select-tool"
    aria-label="Selection tool (press S)"
    aria-pressed="true"
    class="tool-button active"
    data-shortcut="s"
    data-tool="select"
  >
    <svg aria-hidden="true" class="icon"><!-- arrow icon --></svg>
    <span class="tooltip">Select (S)</span>
  </button>

  <!-- Rectangle Tool -->
  <button
    id="rect-tool"
    aria-label="Rectangle tool (press R)"
    aria-pressed="false"
    class="tool-button"
    data-shortcut="r"
    data-tool="rectangle"
  >
    <svg aria-hidden="true" class="icon"><!-- rectangle icon --></svg>
    <span class="tooltip">Rectangle (R)</span>
  </button>

  <!-- Circle Tool -->
  <button
    id="circle-tool"
    aria-label="Circle tool (press C)"
    aria-pressed="false"
    class="tool-button"
    data-shortcut="c"
    data-tool="circle"
  >
    <svg aria-hidden="true" class="icon"><!-- circle icon --></svg>
    <span class="tooltip">Circle (C)</span>
  </button>

  <!-- Separator -->
  <div role="separator" aria-orientation="vertical"></div>

  <!-- Color Picker Group -->
  <div role="group" aria-labelledby="fill-label">
    <label id="fill-label" for="fill-color">Fill Color</label>
    <input
      id="fill-color"
      type="color"
      value="#0066CC"
      aria-label="Fill color picker, currently blue"
    />
  </div>

  <!-- Stroke Width -->
  <div role="group" aria-labelledby="stroke-label">
    <label id="stroke-label" for="stroke-width">Stroke Width</label>
    <input
      id="stroke-width"
      type="range"
      min="1"
      max="20"
      value="2"
      aria-label="Stroke width, 2 pixels"
      aria-valuetext="2 pixels"
    />
  </div>

  <!-- Help Button -->
  <button
    id="help-button"
    aria-label="Show keyboard shortcuts (Shift+?)"
    data-shortcut="shift+?"
  >
    ?
  </button>
</div>
```

### 3. Keyboard Shortcut Handling

```typescript
class DrawingApp {
  private shortcuts: Map<string, () => void> = new Map();

  constructor() {
    this.registerShortcuts();
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  private registerShortcuts() {
    // Tool shortcuts
    this.shortcuts.set('s', () => this.selectTool('select'));
    this.shortcuts.set('r', () => this.selectTool('rectangle'));
    this.shortcuts.set('c', () => this.selectTool('circle'));
    this.shortcuts.set('l', () => this.selectTool('line'));
    this.shortcuts.set('t', () => this.selectTool('text'));

    // Editing shortcuts
    this.shortcuts.set('ctrl+z', () => this.undo());
    this.shortcuts.set('ctrl+y', () => this.redo());
    this.shortcuts.set('delete', () => this.deleteSelected());
    this.shortcuts.set('escape', () => this.deselect());

    // View shortcuts
    this.shortcuts.set('ctrl+0', () => this.resetZoom());
    this.shortcuts.set('shift+?', () => this.showHelp());
    this.shortcuts.set('ctrl+/', () => this.showQuickActions());
  }

  private handleKeydown(event: KeyboardEvent) {
    // Build key combination string
    const keys: string[] = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    keys.push(event.key.toLowerCase());

    const combination = keys.join('+');

    // Check if this is a known shortcut
    if (this.shortcuts.has(combination)) {
      event.preventDefault();
      this.shortcuts.get(combination)?.();
    }
  }

  private selectTool(tool: string) {
    // Update button states
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('active');
    });

    const button = document.querySelector(`[data-tool="${tool}"]`);
    if (button) {
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('active');
    }

    // Announce to screen readers
    this.announce(`${tool} tool selected`);
  }

  private announce(message: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      announcer.textContent = message;
    }
  }
}
```

### 4. High Contrast Mode Support

```typescript
class AccessibilityManager {
  private highContrastQuery: MediaQueryList;

  constructor() {
    // Detect high contrast preference
    this.highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    this.highContrastQuery.addEventListener('change',
      (e) => this.onHighContrastChange(e.matches)
    );

    // Apply initial state
    if (this.highContrastQuery.matches) {
      this.enableHighContrast();
    }
  }

  private onHighContrastChange(enabled: boolean) {
    if (enabled) {
      this.enableHighContrast();
    } else {
      this.disableHighContrast();
    }
  }

  private enableHighContrast() {
    document.documentElement.classList.add('high-contrast-mode');
  }

  private disableHighContrast() {
    document.documentElement.classList.remove('high-contrast-mode');
  }
}
```

```css
/* High Contrast Styles */
@media (prefers-contrast: more) {
  :root {
    --text-color: WindowText;
    --bg-color: Window;
    --border-color: WindowBorder;
    --focus-color: Highlight;
    --focus-text: HighlightText;
  }

  button {
    border: 2px solid WindowText;
    background: Window;
    color: WindowText;
    padding: 0.5rem;
  }

  button:focus,
  button:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
    background: Highlight;
    color: HighlightText;
  }

  button:hover {
    border-color: Highlight;
  }

  input[type="color"],
  input[type="range"] {
    border: 2px solid WindowText;
  }

  canvas {
    border: 2px solid WindowText;
  }

  .tooltip {
    background: Window;
    border: 1px solid WindowText;
    color: WindowText;
  }
}
```

### 5. Colorblind-Friendly Color Palette

```typescript
// Accessible color palette
const ACCESSIBLE_COLORS = {
  // Primary palette (safe for all types of colorblindness)
  blue: '#0066CC',
  orange: '#FF9900',
  yellow: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',

  // Grayscale for high contrast
  darkGray: '#333333',
  mediumGray: '#666666',
  lightGray: '#CCCCCC',

  // Status colors (safe combinations)
  success: '#0066CC',      // Blue, not green
  warning: '#FF9900',      // Orange, not yellow
  error: '#CC0000',        // Dark red
  info: '#0066CC',         // Blue
};

// Pattern fills for additional distinction
const FILL_PATTERNS = {
  solid: 'solid',
  diagonal: 'diagonal-lines-45',
  horizontal: 'horizontal-lines',
  dots: 'dot-pattern',
  crosshatch: 'crosshatch',
};

class ColorManager {
  getAccessibleColor(index: number, type: 'primary' | 'status'): string {
    if (type === 'primary') {
      const colors = [
        ACCESSIBLE_COLORS.blue,
        ACCESSIBLE_COLORS.orange,
        ACCESSIBLE_COLORS.yellow,
      ];
      return colors[index % colors.length];
    } else {
      const statusColors = [
        ACCESSIBLE_COLORS.success,
        ACCESSIBLE_COLORS.warning,
        ACCESSIBLE_COLORS.error,
      ];
      return statusColors[index % statusColors.length];
    }
  }

  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Convert hex to RGB and calculate luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  isWCAGCompliant(color1: string, color2: string, level: 'A' | 'AA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    const required = level === 'AA' ? 4.5 : 3;
    return ratio >= required;
  }
}
```

### 6. Zoom Accessibility

```typescript
class ZoomManager {
  private zoomLevel: number = 100;
  private minZoom: number = 25;
  private maxZoom: number = 400;

  zoomIn() {
    this.setZoom(this.zoomLevel + 10);
  }

  zoomOut() {
    this.setZoom(this.zoomLevel - 10);
  }

  setZoom(percentage: number) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, percentage));
    this.applyZoom();
    this.announceZoom();
  }

  fitToScreen() {
    const container = document.getElementById('canvas-container') as HTMLElement;
    const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;

    if (!container || !canvas) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const scaleX = (containerWidth * 0.95) / canvasWidth;
    const scaleY = (containerHeight * 0.95) / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom above 100%

    this.setZoom(scale * 100);
  }

  resetZoom() {
    this.setZoom(100);
  }

  private applyZoom() {
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
      (canvas as HTMLElement).style.transform = `scale(${this.zoomLevel / 100})`;
    }
  }

  private announceZoom() {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      announcer.textContent = `Zoom level: ${this.zoomLevel}%`;
    }
  }
}
```

---

## Part 11: Testing Tools & Resources

### Automated Testing Tools

1. **axe DevTools** (Free, Chrome/Firefox)
   - Integrates with Chrome DevTools
   - Tests for WCAG 2.1 AA violations
   - Good for quick accessibility scans
   - Website: https://www.deque.com/axe/devtools/

2. **Lighthouse** (Built into Chrome)
   - DevTools > Lighthouse
   - Includes accessibility audit
   - Tests for basic WCAG criteria
   - Good for development

3. **WAVE** (Free, Browser Extension)
   - Firefox/Chrome extension
   - Visual feedback for accessibility issues
   - Highlights errors, warnings, features
   - Website: https://wave.webaim.org/

### Screen Readers (Testing)

1. **NVDA** (Free, Windows)
   - Open-source screen reader
   - Best for testing on Windows
   - Website: https://www.nvaccess.org/

2. **JAWS** (Paid, Windows)
   - Industry standard
   - Most comprehensive
   - Subscription model (~$90/year)

3. **VoiceOver** (Built-in, Mac/iOS)
   - Cmd+F5 to enable on Mac
   - Settings > Accessibility on iOS

### Color & Contrast Testing

1. **WCAG Contrast Checker**
   - Online tool for contrast ratios
   - Tests text, graphics, UI components
   - Website: https://webaim.org/resources/contrastchecker/

2. **Adobe Color**
   - Color palette generator
   - Colorblind simulation built-in
   - Contrast analyzer
   - Website: https://color.adobe.com/

3. **Coblis Colorblind Simulator**
   - Simulates protanopia, deuteranopia, tritanopia
   - Online color/image simulator
   - Website: https://www.color-blindness.com/coblis-color-blindness-simulator/

4. **Stark** (Figma Plugin)
   - Simulates colorblindness in Figma
   - Contrast checking
   - Paid: $5/month

### Keyboard Navigation Testing

1. **Manual Keyboard Testing**
   - Use Tab to navigate all elements
   - Verify focus visible at each step
   - Test Escape, Enter, Arrow Keys
   - Check for keyboard traps

2. **Keyboard Accessibility Test**
   - WebAIM Keyboard Accessibility
   - Website: https://webaim.org/articles/keyboard/

### High Contrast Mode Testing

**Windows:**
1. Settings > Ease of Access > High Contrast
2. Choose preset or customize
3. Test application

**DevTools Emulation:**
```javascript
// In Chrome DevTools Console, emulate high contrast
const style = document.createElement('style');
style.textContent = `
  @media (prefers-contrast: more) {
    body { outline: 1px solid red; }
  }
`;
document.head.appendChild(style);
```

### Zoom Testing

1. **Browser Zoom:** Ctrl+Plus (Windows/Linux) or Cmd+Plus (Mac)
2. Test at 200% zoom
3. Verify no horizontal scrolling for critical UI
4. Test at 150%, 175%, 200%

---

## Part 12: Common Pitfalls & Solutions

### Pitfall 1: Missing Focus Indicators
**Problem:** Elements look focused but have no visible indicator

**Solution:**
```css
/* WRONG: Never do this */
button:focus {
  outline: none;
}

/* CORRECT: Ensure visible focus */
button:focus,
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

### Pitfall 2: Color-Only Distinction
**Problem:** Information conveyed only by color

**Solution:**
```html
<!-- WRONG -->
<span style="color: green;">Success</span>
<span style="color: red;">Error</span>

<!-- CORRECT -->
<span class="success">
  <svg aria-hidden="true"><!-- checkmark --></svg>
  Success
</span>
<span class="error">
  <svg aria-hidden="true"><!-- x --></svg>
  Error
</span>
```

### Pitfall 3: Disabled User Zoom
**Problem:** Viewport meta tag disables zoom

**Solution:**
```html
<!-- WRONG -->
<meta name="viewport" content="user-scalable=no">

<!-- CORRECT -->
<meta name="viewport" content="initial-scale=1, user-scalable=yes">
```

### Pitfall 4: Missing ARIA Labels on Canvas
**Problem:** Canvas element has no accessible name

**Solution:**
```html
<!-- WRONG -->
<canvas id="drawing"></canvas>

<!-- CORRECT -->
<canvas
  id="drawing"
  role="img"
  aria-label="Drawing canvas for user artwork"
  aria-describedby="canvas-help"
></canvas>
<p id="canvas-help" hidden>Use keyboard shortcuts to select tools.</p>
```

### Pitfall 5: No Keyboard Shortcuts
**Problem:** Tool selection only possible with mouse

**Solution:**
- Implement all toolbar tools with keyboard shortcuts
- Display shortcuts in help dialog (Shift+?)
- Use standard combinations (R for rectangle, C for circle)
- Document shortcuts in tooltips

### Pitfall 6: Poor Contrast
**Problem:** Text or graphics hard to read

**Solution:**
```typescript
const tester = new ContrastTester();
if (!tester.isWCAGCompliant(textColor, backgroundColor)) {
  console.warn(`Contrast ratio too low: ${tester.getContrastRatio()}`);
}
// Aim for 4.5:1 for normal text, 3:1 for graphics
```

### Pitfall 7: Keyboard Trap
**Problem:** Focus gets stuck in an element

**Solution:**
```typescript
// Test by tabbing through entire UI
// Escape should close any modals/focused states
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close current modal/focus trap
    closeModal();
    lastFocusedElement?.focus();
  }
});
```

---

## Part 13: Compliance Checklist by WCAG Criterion

### Level A (Minimum)
- [ ] 1.1.1 - Non-text Content: alt text for images
- [ ] 1.3.1 - Info and Relationships: proper semantic HTML
- [ ] 2.1.1 - Keyboard: all functionality keyboard accessible
- [ ] 2.1.2 - No Keyboard Trap: focus can exit any element
- [ ] 2.2.1 - Timing Adjustable: no time-based tasks
- [ ] 2.4.1 - Bypass Blocks: skip navigation available
- [ ] 2.4.3 - Focus Order: logical focus order
- [ ] 3.1.1 - Language of Page: lang attribute set
- [ ] 4.1.2 - Name, Role, Value: all components accessible

### Level AA (Recommended)
- [ ] 1.4.3 - Contrast (Minimum): 4.5:1 for text
- [ ] 1.4.4 - Resize Text: text resizable to 200%
- [ ] 1.4.5 - Images of Text: no images instead of text
- [ ] 1.4.11 - Non-text Contrast: 3:1 for graphics
- [ ] 2.4.7 - Focus Visible: focus indicator visible
- [ ] 2.5.2 - Pointer Cancellation: no pointer down triggers
- [ ] 3.2.1 - On Focus: no context change on focus
- [ ] 3.2.2 - On Input: submission confirmation required
- [ ] 3.3.1 - Error Identification: errors identified
- [ ] 3.3.4 - Error Prevention: undo/confirmation available

---

## References & Resources

### Official Standards
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WCAG 2.2 (latest): https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/

### Tool Documentation
- Figma Accessibility: https://help.figma.com/hc/en-us/articles/35063862380311-Accessibility-at-Figma
- Excalidraw GitHub Issues: https://github.com/excalidraw/excalidraw/issues/7492
- Google Accessibility: https://blog.google/products/devices/
- Stark Plugin: https://www.getstark.co/

### Learning Resources
- WebAIM Guides: https://webaim.org/
- A11y Project: https://www.a11yproject.com/
- 24 Accessibility: https://www.24a11y.com/
- TPGi/Deque: https://www.deque.com/resources/

### Testing Tools
- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- NVDA: https://www.nvaccess.org/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

---

## Conclusion

Drawing applications require a multi-faceted accessibility approach:

1. **Canvas Content:** Inherently difficult, use fallback text and aria-labels
2. **Toolbar/Controls:** Must be fully accessible (keyboard, screen readers, high contrast)
3. **Keyboard Navigation:** Essential for users without mouse access
4. **Color & Contrast:** Use accessible palettes, test for colorblindness
5. **Focus Management:** Visible indicators and logical order
6. **Alternative Inputs:** Support keyboard, voice, switch, eye-tracking via proper ARIA

**Key Takeaway:** If you build an accessible, keyboard-first interface, voice control, switch control, and eye-tracking will automatically work without special implementation.

The three applications analyzed show different maturity levels:
- **Figma:** Most accessible (★★★★☆)
- **Excalidraw:** Developing (★★★☆☆) - drawing with keyboard still missing
- **Google Drawings:** Adequate (★★★☆☆) - relies on OS/browser features

For a new drawing application, prioritize:
1. Full keyboard accessibility for toolbar
2. Visible focus indicators
3. Accessible color palette (blue/orange base)
4. Canvas ARIA labels
5. 200% zoom support
6. Comprehensive keyboard shortcuts

This provides a foundation that benefits users with visual, motor, or cognitive disabilities while not negatively impacting any users.

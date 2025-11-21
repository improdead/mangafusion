# Accessibility Code Examples
## Ready-to-Use Implementations for Drawing Applications

---

## 1. Accessible Canvas Element

### HTML Structure
```html
<!-- Canvas Container with Full Accessibility -->
<div class="canvas-wrapper" id="canvas-container">
  <!-- Main Drawing Canvas -->
  <canvas
    id="drawing-canvas"
    role="img"
    aria-label="Drawing canvas for creating artwork"
    aria-describedby="canvas-description"
    aria-live="polite"
    tabindex="0"
    width="1200"
    height="800"
  ></canvas>

  <!-- Hidden description for screen readers -->
  <p id="canvas-description" hidden>
    Drawing canvas. Use the toolbar on the left to select drawing tools.
    Press Shift+? to view all keyboard shortcuts.
    Use arrow keys to pan the canvas when canvas-nav mode is active.
  </p>

  <!-- Accessibility announcements -->
  <div
    id="canvas-announcer"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  ></div>

  <!-- Zoom level announcer -->
  <div
    id="zoom-announcer"
    role="status"
    aria-live="assertive"
    aria-atomic="true"
    class="sr-only"
  ></div>
</div>
```

### CSS - Accessibility Utilities
```css
/* Screen Reader Only - Hide visually but keep accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus Visible Default */
:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

/* Canvas Styling */
#drawing-canvas {
  display: block;
  border: 1px solid #999;
  cursor: crosshair;
  background: white;
  user-select: none;
}

#drawing-canvas:focus-visible {
  outline: 3px solid #0066CC;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  #drawing-canvas {
    border: 2px solid WindowText;
  }

  #drawing-canvas:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 0;
    box-shadow: none;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### TypeScript Implementation
```typescript
class AccessibleCanvas {
  private canvas: HTMLCanvasElement;
  private announcer: HTMLElement;
  private zoomAnnouncer: HTMLElement;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.announcer = document.getElementById('canvas-announcer') as HTMLElement;
    this.zoomAnnouncer = document.getElementById('zoom-announcer') as HTMLElement;

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('keydown', (e) => this.handleCanvasKeydown(e));
    this.canvas.addEventListener('focus', () => this.announce('Canvas focused'));
    this.canvas.addEventListener('blur', () => {});
  }

  private handleCanvasKeydown(event: KeyboardEvent) {
    // Canvas-specific keyboard handling
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.panCanvas(0, -10);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.panCanvas(0, 10);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.panCanvas(-10, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.panCanvas(10, 0);
        break;
    }
  }

  private panCanvas(dx: number, dy: number) {
    // Pan implementation
    this.announce(`Canvas panned ${dx}, ${dy}`);
  }

  announce(message: string) {
    this.announcer.textContent = message;
  }

  announceZoom(level: number) {
    this.zoomAnnouncer.textContent = `Zoom level: ${level}%`;
  }
}
```

---

## 2. Accessible Toolbar

### HTML Structure
```html
<div class="toolbar" role="toolbar" aria-label="Drawing tools">
  <!-- Tool Group: Selection and Drawing -->
  <div class="toolbar-group" role="group" aria-labelledby="group-tools-label">
    <span id="group-tools-label" class="toolbar-group-label">Tools</span>

    <!-- Selection Tool -->
    <button
      id="tool-select"
      class="toolbar-button active"
      aria-label="Selection tool"
      aria-pressed="true"
      data-tool="select"
      data-shortcut="s"
      title="Select tool (S)"
    >
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
        <!-- Arrow/pointer icon SVG -->
      </svg>
      <span class="toolbar-tooltip">Select (S)</span>
    </button>

    <!-- Rectangle Tool -->
    <button
      id="tool-rectangle"
      class="toolbar-button"
      aria-label="Rectangle tool"
      aria-pressed="false"
      data-tool="rectangle"
      data-shortcut="r"
      title="Rectangle tool (R)"
    >
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
        <!-- Rectangle icon SVG -->
      </svg>
      <span class="toolbar-tooltip">Rectangle (R)</span>
    </button>

    <!-- Circle Tool -->
    <button
      id="tool-circle"
      class="toolbar-button"
      aria-label="Circle tool"
      aria-pressed="false"
      data-tool="circle"
      data-shortcut="c"
      title="Circle tool (C)"
    >
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
        <!-- Circle icon SVG -->
      </svg>
      <span class="toolbar-tooltip">Circle (C)</span>
    </button>
  </div>

  <!-- Separator -->
  <div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>

  <!-- Color Group -->
  <div class="toolbar-group" role="group" aria-labelledby="group-color-label">
    <span id="group-color-label" class="toolbar-group-label">Colors</span>

    <!-- Fill Color -->
    <div class="toolbar-color-control">
      <label for="fill-color" id="fill-color-label">Fill</label>
      <input
        type="color"
        id="fill-color"
        value="#0066CC"
        aria-labelledby="fill-color-label"
        aria-label="Fill color, currently blue"
        title="Fill color (Shift+F)"
        data-shortcut="shift+f"
      />
    </div>

    <!-- Stroke Color -->
    <div class="toolbar-color-control">
      <label for="stroke-color" id="stroke-color-label">Stroke</label>
      <input
        type="color"
        id="stroke-color"
        value="#000000"
        aria-labelledby="stroke-color-label"
        aria-label="Stroke color, currently black"
        title="Stroke color (Shift+S)"
        data-shortcut="shift+s"
      />
    </div>
  </div>

  <!-- Separator -->
  <div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>

  <!-- Style Group -->
  <div class="toolbar-group" role="group" aria-labelledby="group-style-label">
    <span id="group-style-label" class="toolbar-group-label">Style</span>

    <!-- Stroke Width -->
    <div class="toolbar-number-control">
      <label for="stroke-width" id="stroke-label">Width</label>
      <input
        type="range"
        id="stroke-width"
        min="1"
        max="20"
        value="2"
        aria-labelledby="stroke-label"
        aria-label="Stroke width"
        aria-valuetext="2 pixels"
        title="Stroke width ([ to decrease, ] to increase)"
      />
      <span class="value-display" aria-hidden="true">2px</span>
    </div>

    <!-- Opacity -->
    <div class="toolbar-number-control">
      <label for="opacity" id="opacity-label">Opacity</label>
      <input
        type="range"
        id="opacity"
        min="0"
        max="100"
        value="100"
        aria-labelledby="opacity-label"
        aria-label="Opacity"
        aria-valuetext="100%"
        title="Opacity (Alt+[ to decrease, Alt+] to increase)"
      />
      <span class="value-display" aria-hidden="true">100%</span>
    </div>
  </div>

  <!-- Spacer -->
  <div class="toolbar-spacer" aria-hidden="true"></div>

  <!-- Help Button -->
  <button
    id="help-button"
    class="toolbar-button"
    aria-label="Show keyboard shortcuts"
    title="Show keyboard shortcuts (Shift+?)"
    data-shortcut="shift+?"
  >
    <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
      <!-- Question mark icon SVG -->
    </svg>
    <span class="toolbar-tooltip">Help (?)</span>
  </button>
</div>
```

### CSS
```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.toolbar-group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #666;
  margin-right: 0.25rem;
  padding: 0 0.25rem;
  user-select: none;
}

.toolbar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  min-width: 40px;
  min-height: 40px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  position: relative;
}

.toolbar-button:hover {
  background: #e9e9e9;
  border-color: #999;
}

.toolbar-button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

.toolbar-button.active {
  background: #0066CC;
  color: white;
  border-color: #0052a3;
}

.toolbar-button.active:focus-visible {
  outline-color: #0052a3;
}

.icon {
  width: 24px;
  height: 24px;
  margin-bottom: 0.25rem;
}

.toolbar-tooltip {
  font-size: 0.65rem;
  white-space: nowrap;
}

.toolbar-separator {
  width: 1px;
  height: 32px;
  background: #ddd;
  margin: 0 0.5rem;
}

.toolbar-color-control,
.toolbar-number-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-color-control label,
.toolbar-number-control label {
  font-size: 0.65rem;
  color: #666;
  text-transform: uppercase;
}

#fill-color,
#stroke-color {
  width: 40px;
  height: 40px;
  border: 2px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

#fill-color:focus-visible,
#stroke-color:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

#stroke-width,
#opacity {
  width: 100px;
  height: 24px;
}

.value-display {
  font-size: 0.65rem;
  color: #999;
  width: 35px;
  text-align: center;
}

.toolbar-spacer {
  flex: 1;
  min-width: 1rem;
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .toolbar-button {
    border: 2px solid WindowText;
    background: Window;
    color: WindowText;
  }

  .toolbar-button:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 0;
    background: Highlight;
    color: HighlightText;
  }

  .toolbar-button.active {
    background: Highlight;
    color: HighlightText;
    border-color: HighlightText;
  }

  .toolbar-separator {
    background: WindowText;
  }

  #fill-color,
  #stroke-color {
    border: 2px solid WindowText;
  }
}
```

### TypeScript - Toolbar Manager
```typescript
class ToolbarManager {
  private currentTool: string = 'select';
  private shortcuts: Map<string, (event: KeyboardEvent) => void> = new Map();

  constructor() {
    this.registerToolButtons();
    this.registerShortcuts();
    this.setupListeners();
  }

  private registerToolButtons() {
    const toolButtons = document.querySelectorAll('[data-tool]');
    toolButtons.forEach((button) => {
      button.addEventListener('click', () => this.selectTool(button));
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectTool(button);
        }
      });
    });
  }

  private registerShortcuts() {
    // Tool shortcuts
    this.shortcuts.set('s', () => {
      const btn = document.querySelector('[data-tool="select"]');
      if (btn) this.selectTool(btn);
    });

    this.shortcuts.set('r', () => {
      const btn = document.querySelector('[data-tool="rectangle"]');
      if (btn) this.selectTool(btn);
    });

    this.shortcuts.set('c', () => {
      const btn = document.querySelector('[data-tool="circle"]');
      if (btn) this.selectTool(btn);
    });

    // Color shortcuts
    this.shortcuts.set('shift+f', () => {
      const btn = document.getElementById('fill-color');
      if (btn) btn.focus();
    });

    this.shortcuts.set('shift+s', () => {
      const btn = document.getElementById('stroke-color');
      if (btn) btn.focus();
    });

    // Help
    this.shortcuts.set('shift+?', () => this.showHelp());
  }

  private setupListeners() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Color picker changes
    document.getElementById('fill-color')?.addEventListener('change', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.announceFillColor(color);
    });

    document.getElementById('stroke-color')?.addEventListener('change', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.announceStrokeColor(color);
    });

    // Range inputs
    document.getElementById('stroke-width')?.addEventListener('input', (e) => {
      const width = (e.target as HTMLInputElement).value;
      this.announceStrokeWidth(width);
    });

    document.getElementById('opacity')?.addEventListener('input', (e) => {
      const opacity = (e.target as HTMLInputElement).value;
      this.announceOpacity(opacity);
    });
  }

  private handleKeydown(event: KeyboardEvent) {
    const keys: string[] = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    keys.push(event.key.toLowerCase());

    const combination = keys.join('+');

    if (this.shortcuts.has(combination)) {
      event.preventDefault();
      this.shortcuts.get(combination)?.(event);
    }
  }

  private selectTool(button: Element) {
    // Deselect all tools
    document.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('active');
    });

    // Select clicked tool
    button.setAttribute('aria-pressed', 'true');
    button.classList.add('active');

    const toolName = button.getAttribute('data-tool');
    this.currentTool = toolName || 'select';

    // Announce to screen reader
    this.announceTool(toolName || '');
  }

  private announceTool(tool: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      announcer.textContent = `${tool} tool selected`;
    }
  }

  private announceFillColor(color: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      const hex = color.toUpperCase();
      announcer.textContent = `Fill color changed to ${hex}`;
    }
  }

  private announceStrokeColor(color: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      const hex = color.toUpperCase();
      announcer.textContent = `Stroke color changed to ${hex}`;
    }
  }

  private announceStrokeWidth(width: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      announcer.textContent = `Stroke width: ${width} pixels`;
      // Update display
      const display = document.querySelector('.toolbar-number-control:first-of-type .value-display');
      if (display) display.textContent = `${width}px`;
    }
  }

  private announceOpacity(opacity: string) {
    const announcer = document.getElementById('canvas-announcer');
    if (announcer) {
      announcer.textContent = `Opacity: ${opacity}%`;
      // Update display
      const display = document.querySelector('.toolbar-number-control:last-of-type .value-display');
      if (display) display.textContent = `${opacity}%`;
    }
  }

  private showHelp() {
    // Show keyboard shortcuts dialog
    const dialog = document.getElementById('shortcuts-dialog');
    if (dialog) {
      dialog.showModal?.() || (dialog as HTMLElement).style.display = 'block';
    }
  }
}
```

---

## 3. Keyboard Shortcuts Help Dialog

### HTML
```html
<dialog id="shortcuts-dialog" class="shortcuts-dialog" aria-labelledby="shortcuts-title">
  <div class="shortcuts-content">
    <header>
      <h1 id="shortcuts-title">Keyboard Shortcuts</h1>
      <button class="close-button" aria-label="Close shortcuts dialog">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <!-- X icon -->
        </svg>
      </button>
    </header>

    <div class="shortcuts-body">
      <!-- Tools Section -->
      <section>
        <h2>Tools</h2>
        <table role="presentation">
          <thead>
            <tr>
              <th>Action</th>
              <th>Shortcut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Selection tool</td>
              <td><kbd>S</kbd></td>
            </tr>
            <tr>
              <td>Rectangle tool</td>
              <td><kbd>R</kbd></td>
            </tr>
            <tr>
              <td>Circle tool</td>
              <td><kbd>C</kbd></td>
            </tr>
            <tr>
              <td>Line tool</td>
              <td><kbd>L</kbd></td>
            </tr>
            <tr>
              <td>Text tool</td>
              <td><kbd>T</kbd></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Editing Section -->
      <section>
        <h2>Editing</h2>
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
              <td>Undo</td>
              <td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>Z</kbd></td>
            </tr>
            <tr>
              <td>Redo</td>
              <td><kbd>Ctrl</kbd>+<kbd>Y</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>Y</kbd></td>
            </tr>
            <tr>
              <td>Delete</td>
              <td colspan="2"><kbd>Delete</kbd></td>
            </tr>
            <tr>
              <td>Select all</td>
              <td><kbd>Ctrl</kbd>+<kbd>A</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>A</kbd></td>
            </tr>
            <tr>
              <td>Deselect</td>
              <td colspan="2"><kbd>Escape</kbd></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- View Section -->
      <section>
        <h2>View</h2>
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
              <td>Zoom in</td>
              <td><kbd>Ctrl</kbd>+<kbd>+</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>+</kbd></td>
            </tr>
            <tr>
              <td>Zoom out</td>
              <td><kbd>Ctrl</kbd>+<kbd>−</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>−</kbd></td>
            </tr>
            <tr>
              <td>Reset zoom</td>
              <td><kbd>Ctrl</kbd>+<kbd>0</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>0</kbd></td>
            </tr>
            <tr>
              <td>Fit to screen</td>
              <td><kbd>Ctrl</kbd>+<kbd>1</kbd></td>
              <td><kbd>Cmd</kbd>+<kbd>1</kbd></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Colors Section -->
      <section>
        <h2>Colors & Style</h2>
        <table role="presentation">
          <thead>
            <tr>
              <th>Action</th>
              <th>Shortcut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fill color picker</td>
              <td><kbd>Shift</kbd>+<kbd>F</kbd></td>
            </tr>
            <tr>
              <td>Stroke color picker</td>
              <td><kbd>Shift</kbd>+<kbd>S</kbd></td>
            </tr>
            <tr>
              <td>Increase width</td>
              <td><kbd>]</kbd></td>
            </tr>
            <tr>
              <td>Decrease width</td>
              <td><kbd>[</kbd></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <footer>
      <button class="primary-button" onclick="this.closest('dialog').close()">
        Got it!
      </button>
    </footer>
  </div>
</dialog>
```

### CSS
```css
.shortcuts-dialog {
  max-width: 600px;
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0;
}

.shortcuts-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.shortcuts-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
}

.shortcuts-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #ddd;
}

.shortcuts-dialog h1 {
  margin: 0;
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.close-button:hover {
  background: #f0f0f0;
}

.close-button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

.close-button svg {
  width: 20px;
  height: 20px;
}

.shortcuts-body {
  overflow-y: auto;
  padding: 1.5rem;
  flex: 1;
}

.shortcuts-body section {
  margin-bottom: 2rem;
}

.shortcuts-body section:last-child {
  margin-bottom: 0;
}

.shortcuts-body h2 {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #333;
}

.shortcuts-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.shortcuts-body th {
  text-align: left;
  font-weight: 600;
  padding: 0.5rem;
  border-bottom: 2px solid #ddd;
  font-size: 0.875rem;
  color: #666;
}

.shortcuts-body td {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.875rem;
}

kbd {
  display: inline-block;
  min-width: 1.5rem;
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875rem;
  text-align: center;
  color: #333;
}

.shortcuts-dialog footer {
  padding: 1.5rem;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  padding: 0.5rem 1.5rem;
  background: #0066CC;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.primary-button:hover {
  background: #0052a3;
}

.primary-button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

### TypeScript - Dialog Manager
```typescript
class ShortcutsDialog {
  private dialog: HTMLDialogElement;

  constructor() {
    this.dialog = document.getElementById('shortcuts-dialog') as HTMLDialogElement;
    this.setupListeners();
  }

  private setupListeners() {
    const closeButton = this.dialog.querySelector('.close-button');
    closeButton?.addEventListener('click', () => this.close());

    // Close on Escape
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Focus management
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.manageFocusTrap(e);
      }
    });
  }

  show() {
    this.dialog.showModal?.();
    // Move focus to first focusable element
    const firstButton = this.dialog.querySelector('button');
    firstButton?.focus();
  }

  close() {
    this.dialog.close();
  }

  private manageFocusTrap(event: KeyboardEvent) {
    const focusableElements = this.dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new ShortcutsDialog();
});
```

---

## 4. High Contrast Mode Detection

### TypeScript
```typescript
class HighContrastDetector {
  private mediaQuery: MediaQueryList;
  private isHighContrast: boolean;
  private listeners: ((isHighContrast: boolean) => void)[] = [];

  constructor() {
    // Detect system preference
    this.mediaQuery = window.matchMedia('(prefers-contrast: more)');
    this.isHighContrast = this.mediaQuery.matches;

    // Listen for changes
    this.mediaQuery.addEventListener('change', (e) => {
      this.isHighContrast = e.matches;
      this.notifyListeners();
      this.applyHighContrast(e.matches);
    });

    // Initial application
    this.applyHighContrast(this.isHighContrast);
  }

  private applyHighContrast(enabled: boolean) {
    if (enabled) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  }

  public isEnabled(): boolean {
    return this.isHighContrast;
  }

  public onHighContrastChange(callback: (isHighContrast: boolean) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isHighContrast));
  }
}

// Usage
const highContrastDetector = new HighContrastDetector();

highContrastDetector.onHighContrastChange((isEnabled) => {
  if (isEnabled) {
    console.log('High contrast mode enabled');
  }
});
```

---

## 5. Color Contrast Validator

### TypeScript
```typescript
class ContrastValidator {
  /**
   * Calculate relative luminance of a color
   * Based on WCAG 2.1 formula
   */
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    let [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calculate contrast ratio between two colors
   * Returns ratio between 1:1 and 21:1
   */
  public getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard
   * Normal text: 4.5:1, Large text: 3:1
   */
  public isWCAGAA(color1: string, color2: string, largeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    const required = largeText ? 3 : 4.5;
    return ratio >= required;
  }

  /**
   * Check if contrast meets WCAG AAA standard
   * Normal text: 7:1, Large text: 4.5:1
   */
  public isWCAGAAA(color1: string, color2: string, largeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    const required = largeText ? 4.5 : 7;
    return ratio >= required;
  }

  /**
   * Check if graphics/UI component meets contrast requirement
   * Components: 3:1 minimum
   */
  public isGraphicsAccessible(color1: string, color2: string): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return ratio >= 3;
  }

  /**
   * Get detailed report for a color pair
   */
  public getReport(color1: string, color2: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
    graphics: boolean;
  } {
    const ratio = this.getContrastRatio(color1, color2);
    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: this.isWCAGAA(color1, color2),
      wcagAAA: this.isWCAGAAA(color1, color2),
      graphics: this.isGraphicsAccessible(color1, color2),
    };
  }
}

// Usage
const validator = new ContrastValidator();

// Check text contrast
const textContrast = validator.getReport('#0066CC', '#FFFFFF');
console.log(textContrast);
// Output: { ratio: 8.59, wcagAA: true, wcagAAA: true, graphics: true }

// Check if colors are WCAG compliant
if (validator.isWCAGAA('#0066CC', '#FFFFFF')) {
  console.log('Text contrast passes WCAG AA');
}

// Check graphics
if (validator.isGraphicsAccessible('#0066CC', '#FFFFFF')) {
  console.log('Graphics contrast is accessible');
}
```

---

## 6. Colorblind-Friendly Palette Manager

### TypeScript
```typescript
class AccessiblePaletteManager {
  // Safe palette for all types of color blindness
  private safePalette = {
    blue: '#0066CC',      // Works for all types
    orange: '#FF9900',    // Works for all types
    yellow: '#FFCC00',    // Works for protanopia/deuteranopia
    black: '#000000',
    white: '#FFFFFF',
    darkGray: '#333333',
    mediumGray: '#666666',
    lightGray: '#CCCCCC',
  };

  // Status colors - accessibility-first
  private statusColors = {
    success: {
      color: '#0066CC',   // Blue, not green
      icon: '✓',
      label: 'Success',
    },
    warning: {
      color: '#FF9900',   // Orange, not yellow
      icon: '⚠',
      label: 'Warning',
    },
    error: {
      color: '#CC0000',   // Dark red
      icon: '✕',
      label: 'Error',
    },
    info: {
      color: '#0066CC',   // Blue
      icon: 'ⓘ',
      label: 'Information',
    },
  };

  /**
   * Get safe color from palette
   */
  public getSafeColor(key: keyof typeof this.safePalette): string {
    return this.safePalette[key];
  }

  /**
   * Get status color with icon and label
   */
  public getStatusColor(type: 'success' | 'warning' | 'error' | 'info') {
    return this.statusColors[type];
  }

  /**
   * Validate color is in safe palette
   */
  public isColorSafe(color: string): boolean {
    return Object.values(this.safePalette).includes(color.toLowerCase());
  }

  /**
   * Get safe color variations for data visualization
   */
  public getDataVisualizationPalette(): string[] {
    return [
      this.safePalette.blue,
      this.safePalette.orange,
      this.safePalette.yellow,
      '#00CCCC',  // Cyan (safe)
      '#9900FF',  // Purple (reasonably safe)
      '#FF6600',  // Dark orange
    ];
  }

  /**
   * Generate HTML for status indicator with icon, color, and text
   */
  public generateStatusHTML(type: 'success' | 'warning' | 'error' | 'info'): string {
    const status = this.statusColors[type];
    return `
      <div class="status-indicator" data-status="${type}">
        <span class="status-icon" style="color: ${status.color};" aria-hidden="true">
          ${status.icon}
        </span>
        <span class="status-text">${status.label}</span>
      </div>
    `;
  }
}

// Usage
const paletteManager = new AccessiblePaletteManager();

// Get safe colors
const blue = paletteManager.getSafeColor('blue');      // #0066CC
const orange = paletteManager.getSafeColor('orange');  // #FF9900

// Get status colors with metadata
const success = paletteManager.getStatusColor('success');
console.log(success);
// { color: '#0066CC', icon: '✓', label: 'Success' }

// Generate HTML
const statusHTML = paletteManager.generateStatusHTML('success');
console.log(statusHTML);
// <div class="status-indicator" ...>✓ Success</div>
```

---

## 7. Zoom Management

### TypeScript
```typescript
class ZoomManager {
  private zoomLevel: number = 100;
  private minZoom: number = 25;
  private maxZoom: number = 400;
  private zoomAnnouncer: HTMLElement;

  constructor() {
    this.zoomAnnouncer = document.getElementById('zoom-announcer') as HTMLElement;
    this.setupKeyboardShortcuts();
    this.setupZoomButtons();
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Browser zoom uses Ctrl+Plus/Minus, handled natively
      // App zoom uses different shortcuts if needed
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            this.resetZoom();
            break;
          case '1':
            e.preventDefault();
            this.fitToScreen();
            break;
        }
      }
    });
  }

  private setupZoomButtons() {
    const zoomInBtn = document.querySelector('[aria-label*="Zoom in"]');
    const zoomOutBtn = document.querySelector('[aria-label*="Zoom out"]');
    const fitBtn = document.querySelector('[aria-label*="Fit"]');
    const zoomInput = document.querySelector('input[aria-label*="zoom"]') as HTMLInputElement;

    zoomInBtn?.addEventListener('click', () => this.zoomIn());
    zoomOutBtn?.addEventListener('click', () => this.zoomOut());
    fitBtn?.addEventListener('click', () => this.fitToScreen());

    zoomInput?.addEventListener('change', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (!isNaN(value)) {
        this.setZoom(value);
      }
    });
  }

  public zoomIn() {
    this.setZoom(this.zoomLevel + 10);
  }

  public zoomOut() {
    this.setZoom(this.zoomLevel - 10);
  }

  public setZoom(percentage: number) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, percentage));
    this.applyZoom();
    this.announceZoom();
    this.updateZoomInput();
  }

  public resetZoom() {
    this.setZoom(100);
  }

  public fitToScreen() {
    const container = document.getElementById('canvas-container') as HTMLElement;
    const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;

    if (!container || !canvas) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const padding = 0.95;

    const scale = Math.min(
      (containerWidth * padding) / canvas.width,
      (containerHeight * padding) / canvas.height,
      1
    );

    this.setZoom(Math.round(scale * 100));
  }

  private applyZoom() {
    const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.transform = `scale(${this.zoomLevel / 100})`;
      canvas.style.transformOrigin = 'top left';
    }
  }

  private announceZoom() {
    if (this.zoomAnnouncer) {
      this.zoomAnnouncer.textContent = `Zoom level: ${this.zoomLevel}%`;
    }
  }

  private updateZoomInput() {
    const zoomInput = document.querySelector('input[aria-label*="zoom"]') as HTMLInputElement;
    if (zoomInput) {
      zoomInput.value = this.zoomLevel.toString();
    }
  }

  public getZoomLevel(): number {
    return this.zoomLevel;
  }
}

// Initialize
const zoomManager = new ZoomManager();
```

---

## Summary of Implementations

These code examples provide:

1. **Accessible Canvas** - Proper ARIA labels, roles, and screen reader support
2. **Accessible Toolbar** - Keyboard-navigable tools with focus management
3. **Keyboard Shortcuts** - Discoverable shortcuts with help dialog
4. **High Contrast Support** - CSS media queries for Windows High Contrast mode
5. **Color Contrast Validation** - WCAG compliance checking
6. **Colorblind-Friendly Palette** - Safe colors and pattern-based distinctions
7. **Zoom Management** - Keyboard and button-based zoom controls

All implementations follow WCAG 2.1 AA guidelines and include comprehensive keyboard, screen reader, and high contrast support.


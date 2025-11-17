# MangaFusion Drawing - Keyboard Shortcuts Quick Start Guide
## Implementation Reference for Development Team

**Date:** November 17, 2025
**Status:** Ready for Implementation
**Version:** 1.0

---

## Quick Summary

This document provides a quick-start reference for implementing the standardized keyboard shortcuts in MangaFusion's drawing feature. For detailed analysis and research, see `KEYBOARD_SHORTCUTS_STANDARD.md`.

---

## Files Created

1. **KEYBOARD_SHORTCUTS_STANDARD.md** (36KB)
   - Complete research and analysis document
   - Comparative analysis from 5 major drawing applications
   - Full implementation guidelines
   - Platform-specific adjustments
   - Testing checklist

2. **lib/drawing/constants/keyboardShortcuts.ts** (12KB)
   - TypeScript constants file for implementation
   - Ready-to-use shortcut definitions
   - Helper functions for shortcut handling
   - Fully typed and documented

3. **KEYBOARD_SHORTCUTS_QUICK_START.md** (This file)
   - Developer quick reference
   - Implementation checklist
   - Most common patterns

---

## Implementation Phases

### Phase 1: MVP (Critical Shortcuts) - Week 1

These are the absolute must-have shortcuts for MVP launch:

```typescript
// Tools (Single Key - 100% Industry Standard)
B = Brush
E = Eraser
I = Eyedropper
V = Move
T = Text

// Canvas Navigation
Space + Drag = Pan
Ctrl/Cmd + Plus = Zoom In
Ctrl/Cmd + Minus = Zoom Out
1 = Zoom 100%
2 = Fit Canvas

// Undo/Redo
Ctrl/Cmd + Z = Undo
Ctrl/Cmd + Shift + Z = Redo

// Brush Properties
[ = Smaller Size
] = Larger Size

// Layers
Ctrl/Cmd + Shift + N = New Layer
Ctrl/Cmd + J = Duplicate Layer
Delete = Delete Layer

// Files
Ctrl/Cmd + S = Save
Ctrl/Cmd + Shift + E = Export
```

### Phase 2: Important (Week 2)

```typescript
// Additional Tools
S = Selection
K = Fill Bucket
H = Hand Tool

// Brush Fine-Tuning
Shift+[ = Less Hard
Shift+] = More Hard
Alt+[ / ] = Fine-tune Size (1px)

// Opacity Quick Set
0-9 = 10%-100% Opacity

// Colors
D = Default Color (B/W)
X = Swap Colors
Alt + Click = Pick Color

// More Layers
Ctrl/Cmd + E = Merge Down
Ctrl/Cmd + G = Group
Page Up/Down = Switch Layers

// File Ops
Ctrl/Cmd + N = New Project
Ctrl/Cmd + O = Open Project
```

### Phase 3: Polish (Week 3+)

```typescript
// View Options
Tab = Hide Panels
Shift + Tab = Hide All UI
/ = Toggle Grid
' = Toggle Rulers
F = Fullscreen

// Selection
Ctrl/Cmd + A = Select All
Ctrl/Cmd + D = Deselect

// Help
? = Show Shortcuts
F1 = Documentation

// Advanced
R + Drag = Rotate Canvas
Ctrl/Cmd + Alt + Z = Rapid Undo (hold)
```

---

## Code Structure

### File Organization
```
lib/drawing/
├── constants/
│   └── keyboardShortcuts.ts      ← New! Import from this file
├── hooks/
│   └── useKeyboardShortcuts.ts   ← Use provided hook
├── services/
│   └── shortcutHandler.ts        ← Centralized handler
└── ...
```

### Using the Constants
```typescript
// In your drawing component
import {
  TOOL_SHORTCUTS,
  HISTORY_SHORTCUTS,
  BRUSH_SHORTCUTS,
  buildShortcutString,
  matchesShortcut,
  formatShortcutForDisplay,
} from '@/lib/drawing/constants/keyboardShortcuts';

// Handle keyboard event
const handleKeyDown = (event: KeyboardEvent) => {
  const shortcut = buildShortcutString(event);

  // Check for tool shortcuts
  if (TOOL_SHORTCUTS[event.key.toLowerCase()]) {
    const tool = TOOL_SHORTCUTS[event.key.toLowerCase()];
    selectTool(tool);
    event.preventDefault();
  }

  // Check for undo
  if (matchesShortcut(shortcut, HISTORY_SHORTCUTS.UNDO)) {
    undo();
    event.preventDefault();
  }

  // Format for display
  const display = formatShortcutForDisplay(shortcut);
  console.log(`Shortcut: ${display}`);
};
```

---

## Hook Implementation Pattern

```typescript
// In: lib/drawing/hooks/useKeyboardShortcuts.ts

import { useEffect, useCallback } from 'react';
import {
  TOOL_SHORTCUTS,
  HISTORY_SHORTCUTS,
  BRUSH_SHORTCUTS,
  buildShortcutString,
  matchesShortcut,
} from '@/lib/drawing/constants/keyboardShortcuts';
import { useDrawingContext } from './useDrawingContext';

export const useDrawingKeyboardShortcuts = () => {
  const {
    selectTool,
    undo,
    redo,
    adjustBrushSize,
    adjustBrushHardness,
    panCanvas,
  } = useDrawingContext();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    const key = event.key.toLowerCase();
    const shortcut = buildShortcutString(event);

    // Tool shortcuts (B, E, I, V, T, S, K, H)
    if (TOOL_SHORTCUTS[key]) {
      event.preventDefault();
      selectTool(TOOL_SHORTCUTS[key]);
      return;
    }

    // History
    if (matchesShortcut(shortcut, HISTORY_SHORTCUTS.UNDO)) {
      event.preventDefault();
      undo();
      return;
    }

    if (matchesShortcut(shortcut, HISTORY_SHORTCUTS.REDO)) {
      event.preventDefault();
      redo();
      return;
    }

    // Brush size
    if (matchesShortcut(shortcut, BRUSH_SHORTCUTS.DECREASE_SIZE)) {
      event.preventDefault();
      adjustBrushSize('decrease', event.altKey);
      return;
    }

    if (matchesShortcut(shortcut, BRUSH_SHORTCUTS.INCREASE_SIZE)) {
      event.preventDefault();
      adjustBrushSize('increase', event.altKey);
      return;
    }

    // Add more handlers here...
  }, [selectTool, undo, redo, adjustBrushSize, adjustBrushHardness]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
```

---

## Testing Checklist

### Phase 1 Testing (MVP)
- [ ] B activates brush tool
- [ ] E activates eraser tool
- [ ] I activates eyedropper
- [ ] V activates move tool
- [ ] T activates text tool
- [ ] Space+Drag pans canvas
- [ ] Ctrl/Cmd+Plus zooms in
- [ ] Ctrl/Cmd+Minus zooms out
- [ ] 1 resets zoom to 100%
- [ ] 2 fits canvas in view
- [ ] Ctrl/Cmd+Z undoes
- [ ] Ctrl/Cmd+Shift+Z redoes
- [ ] [ decreases brush size
- [ ] ] increases brush size
- [ ] Ctrl/Cmd+Shift+N creates new layer
- [ ] Delete deletes active layer
- [ ] Ctrl/Cmd+S saves project
- [ ] Shortcuts don't interfere with text input
- [ ] Shortcuts work on Windows (Ctrl)
- [ ] Shortcuts work on macOS (Cmd)
- [ ] Shortcuts work on Linux (Ctrl)

### Platform-Specific Testing
- [ ] macOS: Cmd key works instead of Ctrl
- [ ] Windows: Ctrl key works as expected
- [ ] Linux: Ctrl key works as expected
- [ ] iPad: External keyboard shortcuts work
- [ ] Mobile: No false triggers on touch events

### Edge Cases
- [ ] Shortcuts don't trigger while in text input field
- [ ] Shortcuts don't trigger in input dialogs
- [ ] Browser default conflicts handled (Ctrl+S, Ctrl+W)
- [ ] Modifier keys detected correctly
- [ ] Double-modifier combinations work (Shift+Ctrl)
- [ ] Multiple rapid key presses handled
- [ ] Rapid undo (hold Ctrl+Alt+Z) works smoothly

---

## Common Implementation Patterns

### 1. Tool Selection
```typescript
const TOOL_HANDLERS: Record<DrawingTool, () => void> = {
  [DrawingTool.BRUSH]: () => setActiveTool(DrawingTool.BRUSH),
  [DrawingTool.ERASER]: () => setActiveTool(DrawingTool.ERASER),
  [DrawingTool.EYEDROPPER]: () => setActiveTool(DrawingTool.EYEDROPPER),
  // ...
};
```

### 2. Brush Size Adjustment
```typescript
const handleBracketKey = (direction: 'increase' | 'decrease', fine: boolean) => {
  const step = fine ? 1 : 5;
  const newSize = direction === 'increase'
    ? brushSize + step
    : brushSize - step;
  setBrushSize(Math.max(1, Math.min(300, newSize)));
};
```

### 3. Opacity Quick Set
```typescript
const handleNumberKey = (num: string) => {
  if (num === '0') {
    setOpacity(100);
  } else if (num >= '1' && num <= '9') {
    setOpacity(parseInt(num) * 10);
  }
};
```

### 4. Platform Detection
```typescript
const isMac = typeof navigator !== 'undefined'
  && navigator.userAgent.toLowerCase().includes('mac');

const modifierKey = isMac ? 'Cmd' : 'Ctrl';
const displayShortcut = `${modifierKey}+Z`;
```

### 5. Context Menu Prevention
```typescript
// Prevent browser default for shortcuts with conflicts
const CONFLICT_SHORTCUTS = [
  'ctrl+s', 'ctrl+n', 'ctrl+w', 'ctrl+a', 'ctrl+p'
];

const handleKeyDown = (event: KeyboardEvent) => {
  const shortcut = buildShortcutString(event);
  if (CONFLICT_SHORTCUTS.includes(shortcut)) {
    event.preventDefault();
  }
};
```

---

## Accessibility Considerations

### Keyboard-Only Users
- [ ] All functions accessible via keyboard
- [ ] Tab navigation through UI
- [ ] Clear focus indicators
- [ ] Shortcut hints in aria-labels
- [ ] No time-based interactions

### Screen Reader Support
```html
<!-- Include shortcuts in accessible labels -->
<button aria-label="Brush tool (Press B)">
  <BrushIcon />
</button>

<!-- Announce shortcut changes -->
<div role="status" aria-live="polite">
  Shortcut updated: Ctrl+Shift+E for export
</div>
```

### High Contrast Mode
- [ ] Shortcut indicators visible in high contrast
- [ ] Focus indicators meet WCAG standards
- [ ] Tooltip text readable

---

## Browser Conflict Management

### Conflicts to Handle

| Shortcut | Browser Action | Solution |
|----------|---|---|
| Ctrl+S | Save Page | preventDefault + custom save |
| Ctrl+W | Close Tab | warn before close |
| Ctrl+A | Select All | preventDefault + custom select |
| Ctrl+P | Print | preventDefault + custom print |
| Ctrl+N | New Window | preventDefault + custom new project |
| Ctrl+Z | Undo | preventDefault + our undo |
| Alt+F4 | Close Window | Allow (native) |

### Implementation
```typescript
const BROWSER_CONFLICTS = new Set([
  'ctrl+s', 'ctrl+w', 'ctrl+a', 'ctrl+p', 'ctrl+n'
]);

const shouldPreventDefault = (shortcut: string) => {
  return BROWSER_CONFLICTS.has(shortcut.toLowerCase());
};

const handleKeyDown = (event: KeyboardEvent) => {
  const shortcut = buildShortcutString(event);
  if (shouldPreventDefault(shortcut)) {
    event.preventDefault();
  }
};
```

---

## Performance Tips

1. **Debounce Rapid Keypresses**
   - Brush size adjustment can fire multiple times
   - Use debouncing or requestAnimationFrame

2. **Cache Shortcut Lookups**
   - Build shortcut map once, not on every keydown

3. **Avoid Re-renders**
   - Use separate context/reducer for keyboard state
   - Don't update main drawing state on every key

4. **Mobile Optimization**
   - Touch events shouldn't trigger keyboard handlers
   - Check event type before processing

---

## Rollout Strategy

### Week 1 (MVP - Critical)
- Implement Phase 1 shortcuts only
- Test thoroughly on all platforms
- Get user feedback
- Deploy to production

### Week 2 (Enhancement)
- Add Phase 2 shortcuts
- Improve UI tooltips
- Add shortcut help dialog
- Iterate based on feedback

### Week 3+ (Polish)
- Add remaining shortcuts
- Implement customization (future)
- Performance optimization
- Advanced features

---

## Documentation for Users

### In-App Help
```
1. Hover over tool buttons → Shows shortcut
   "Brush (B)"

2. Help menu → "Keyboard Shortcuts"
   Interactive reference

3. Press ? → Shows shortcut cheat sheet

4. Right-click canvas → Shows context menu with shortcuts
```

### Help Dialog Content
```
TOOLS          │ CANVAS NAVIGATION      │ UNDO/REDO
B = Brush      │ Space+Drag = Pan       │ Ctrl+Z = Undo
E = Eraser     │ Ctrl++ = Zoom In       │ Ctrl+Shift+Z = Redo
I = Color Pick │ Ctrl+- = Zoom Out      │
T = Text       │ 1 = 100%, 2 = Fit      │
[+] = Bigger Size | ] = Smaller Size    │
```

---

## Troubleshooting Guide

### "Shortcuts don't work"
1. Check if text input is focused
2. Verify platform-specific modifier (Cmd vs Ctrl)
3. Check browser extensions blocking shortcuts
4. Clear browser cache
5. Test in incognito/private mode

### "Undo/Redo not working"
1. Ensure history limit not exceeded
2. Check history state management
3. Verify event preventDefault is not blocking
4. Check console for errors

### "Tool doesn't activate"
1. Verify correct key mapping
2. Check if focus is on text input
3. Verify tool state updates
4. Check for conflicting shortcuts

### "Mac shortcuts not working"
1. Verify Cmd key detection
2. Check for keyboard layout issues
3. Test with standard US layout
4. Some keys may require different handling

---

## Quick Reference - Copy/Paste

### Most Used Shortcuts (Poster Version)
```
DRAWING TOOLS          CANVAS & VIEW
B = Brush             Space+Drag = Pan
E = Eraser            Ctrl+Z = Undo
I = Color Picker      Ctrl+Shift+Z = Redo
T = Text              [ = Smaller Brush
S = Select            ] = Bigger Brush
                      1 = Zoom 100%
LAYERS                2 = Fit to View
Ctrl+Shift+N = New    Ctrl++ = Zoom In
Ctrl+J = Duplicate    Ctrl+- = Zoom Out
Delete = Remove

FILES
Ctrl+S = Save
Ctrl+Shift+E = Export
Ctrl+N = New Project
```

---

## Additional Resources

- **Full Documentation:** See `KEYBOARD_SHORTCUTS_STANDARD.md`
- **Shortcut Constants:** See `lib/drawing/constants/keyboardShortcuts.ts`
- **Implementation Guide:** See `DRAWING_FEATURE_IMPLEMENTATION_GUIDE.md`
- **UI/UX Reference:** See `DRAWING_TOOLS_COMPARISON.md`

---

**Created:** November 17, 2025
**For:** MangaFusion Development Team
**Status:** Ready for Implementation

/**
 * MangaFusion Drawing - Standardized Keyboard Shortcuts
 *
 * This file defines all keyboard shortcuts for the drawing feature.
 * Based on industry standards from Photoshop, Krita, Clip Studio Paint,
 * Procreate, and Figma.
 *
 * @see KEYBOARD_SHORTCUTS_STANDARD.md for complete documentation
 */

// ============================================================================
// TOOL SHORTCUTS
// ============================================================================

export enum DrawingTool {
  BRUSH = 'brush',
  ERASER = 'eraser',
  EYEDROPPER = 'eyedropper',
  MOVE = 'move',
  HAND = 'hand',
  FILL = 'fill',
  SELECT = 'select',
  TEXT = 'text',
}

export const TOOL_SHORTCUTS: Record<string, DrawingTool> = {
  'b': DrawingTool.BRUSH,
  'e': DrawingTool.ERASER,
  'i': DrawingTool.EYEDROPPER,
  'v': DrawingTool.MOVE,
  'h': DrawingTool.HAND,
  'k': DrawingTool.FILL,
  's': DrawingTool.SELECT,
  't': DrawingTool.TEXT,
};

// ============================================================================
// CANVAS NAVIGATION SHORTCUTS
// ============================================================================

export const ZOOM_SHORTCUTS = {
  IN: ['ctrl+plus', 'cmd+plus', 'ctrl+=', 'cmd+='],
  OUT: ['ctrl+minus', 'cmd+minus', 'ctrl+-', 'cmd+-'],
  ZOOM_100: ['1'],
  ZOOM_FIT: ['2'],
  ZOOM_RESET: ['0'],
} as const;

export const CANVAS_NAVIGATION = {
  PAN: 'space+drag', // Special handling, not key-only
  ROTATE: 'r+drag',   // Special handling, not key-only
} as const;

// ============================================================================
// UNDO/REDO SHORTCUTS
// ============================================================================

export const HISTORY_SHORTCUTS = {
  UNDO: ['ctrl+z', 'cmd+z'],
  REDO: ['ctrl+shift+z', 'cmd+shift+z'],
  UNDO_STEP_BACK: ['ctrl+alt+z', 'cmd+alt+z'], // Rapid undo (hold)
} as const;

// ============================================================================
// BRUSH PROPERTY SHORTCUTS
// ============================================================================

export const BRUSH_SHORTCUTS = {
  DECREASE_SIZE: ['[', 'bracketleft'],
  INCREASE_SIZE: [']', 'bracketright'],
  DECREASE_HARDNESS: ['shift+[', 'shift+bracketleft'],
  INCREASE_HARDNESS: ['shift+]', 'shift+bracketright'],
  FINE_TUNE_SIZE_DOWN: ['alt+[', 'alt+bracketleft'],
  FINE_TUNE_SIZE_UP: ['alt+]', 'alt+bracketright'],
} as const;

export const BRUSH_SIZE_STEP = 5; // pixels per bracket key
export const BRUSH_SIZE_FINE_STEP = 1; // pixels with alt modifier
export const BRUSH_HARDNESS_STEP = 10; // percent
export const BRUSH_MIN_SIZE = 1;
export const BRUSH_MAX_SIZE = 300;
export const BRUSH_MIN_HARDNESS = 0;
export const BRUSH_MAX_HARDNESS = 100;

// ============================================================================
// OPACITY SHORTCUTS
// ============================================================================

export const OPACITY_SHORTCUTS = {
  TEN: ['1'],
  TWENTY: ['2'],
  THIRTY: ['3'],
  FORTY: ['4'],
  FIFTY: ['5'],
  SIXTY: ['6'],
  SEVENTY: ['7'],
  EIGHTY: ['8'],
  NINETY: ['9'],
  FULL: ['0'],
} as const;

// Map number keys to opacity percentages
export const OPACITY_KEY_MAP: Record<string, number> = {
  '0': 100,
  '1': 10,
  '2': 20,
  '3': 30,
  '4': 40,
  '5': 50,
  '6': 60,
  '7': 70,
  '8': 80,
  '9': 90,
};

// For double-tap opacity setting (e.g., 1,5 = 15%)
export const DOUBLE_TAP_OPACITY_TIMEOUT = 500; // milliseconds

// ============================================================================
// COLOR MANAGEMENT SHORTCUTS
// ============================================================================

export const COLOR_SHORTCUTS = {
  RESET_COLORS: ['d'], // Reset to black/white
  SWAP_COLORS: ['x'],  // Swap foreground/background
  EYEDROPPER: ['alt+click'], // Quick color pick while drawing
} as const;

// ============================================================================
// LAYER SHORTCUTS
// ============================================================================

export const LAYER_SHORTCUTS = {
  NEW_LAYER: ['ctrl+shift+n', 'cmd+shift+n'],
  DUPLICATE_LAYER: ['ctrl+j', 'cmd+j'],
  DELETE_LAYER: ['delete', 'backspace'],
  MERGE_DOWN: ['ctrl+e', 'cmd+e'],
  GROUP_LAYERS: ['ctrl+g', 'cmd+g'],
  SELECT_LAYER_ABOVE: ['pageup'],
  SELECT_LAYER_BELOW: ['pagedown'],
  SELECT_TOP_LAYER: ['home'],
  SELECT_BOTTOM_LAYER: ['end'],
  TOGGLE_LAYER_VISIBILITY: ['h'], // When layers panel has focus
  LOCK_UNLOCK_LAYER: ['l'], // When layers panel has focus
} as const;

// ============================================================================
// SELECTION SHORTCUTS
// ============================================================================

export const SELECTION_SHORTCUTS = {
  SELECT_ALL: ['ctrl+a', 'cmd+a'],
  DESELECT: ['ctrl+d', 'cmd+d'],
  INVERT_SELECTION: ['ctrl+shift+i', 'cmd+shift+i'],
  DELETE_SELECTION: ['delete', 'backspace'],
} as const;

// ============================================================================
// FILE OPERATION SHORTCUTS
// ============================================================================

export const FILE_SHORTCUTS = {
  NEW_PROJECT: ['ctrl+n', 'cmd+n'],
  OPEN_PROJECT: ['ctrl+o', 'cmd+o'],
  SAVE_PROJECT: ['ctrl+s', 'cmd+s'],
  SAVE_AS: ['ctrl+shift+s', 'cmd+shift+s'],
  EXPORT_AS: ['ctrl+shift+e', 'cmd+shift+e'],
  PRINT: ['ctrl+p', 'cmd+p'],
  CLOSE_PROJECT: ['ctrl+w', 'cmd+w'],
} as const;

// ============================================================================
// VIEW & DISPLAY SHORTCUTS
// ============================================================================

export const VIEW_SHORTCUTS = {
  TOGGLE_GRID: ['/'],
  TOGGLE_RULERS: ["'"],
  FULLSCREEN: ['f'],
  HIDE_ALL_PANELS: ['shift+tab'],
  HIDE_TOOL_AND_OPTION_PANELS: ['tab'],
  TOGGLE_PRESENTATION_MODE: ['f5'],
  INCREASE_UI_SCALE: ['ctrl+plus', 'cmd+plus'],
  DECREASE_UI_SCALE: ['ctrl+minus', 'cmd+minus'],
  RESET_UI_SCALE: ['ctrl+0', 'cmd+0'],
} as const;

// ============================================================================
// HELP & ACCESSIBILITY SHORTCUTS
// ============================================================================

export const HELP_SHORTCUTS = {
  SHOW_KEYBOARD_SHORTCUTS: ['?'],
  OPEN_DOCUMENTATION: ['f1'],
  COMMAND_PALETTE: ['ctrl+k', 'cmd+k'],
} as const;

// ============================================================================
// SHORTCUT CATEGORIES
// ============================================================================

export enum ShortcutCategory {
  TOOLS = 'tools',
  NAVIGATION = 'navigation',
  HISTORY = 'history',
  BRUSH = 'brush',
  OPACITY = 'opacity',
  COLOR = 'color',
  LAYERS = 'layers',
  SELECTION = 'selection',
  FILE = 'file',
  VIEW = 'view',
  HELP = 'help',
}

// Comprehensive shortcut registry
export interface ShortcutDefinition {
  id: string;
  category: ShortcutCategory;
  name: string;
  description: string;
  shortcuts: string[];
  platforms?: ('mac' | 'windows' | 'linux' | 'ipad')[];
  conflictingBrowserShortcuts?: string[];
  isAccessible?: boolean; // Can be used with keyboard-only
  priority?: 'critical' | 'important' | 'nice-to-have';
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  // Tools (Critical)
  {
    id: 'tool.brush',
    category: ShortcutCategory.TOOLS,
    name: 'Brush Tool',
    description: 'Activate the brush tool for drawing',
    shortcuts: ['b'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'tool.eraser',
    category: ShortcutCategory.TOOLS,
    name: 'Eraser Tool',
    description: 'Activate the eraser tool',
    shortcuts: ['e'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'tool.eyedropper',
    category: ShortcutCategory.TOOLS,
    name: 'Eyedropper / Color Picker',
    description: 'Activate color picker tool or sample color while drawing',
    shortcuts: ['i', 'alt+click'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'tool.move',
    category: ShortcutCategory.TOOLS,
    name: 'Move Tool',
    description: 'Activate the move/transform tool',
    shortcuts: ['v'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'tool.text',
    category: ShortcutCategory.TOOLS,
    name: 'Text Tool',
    description: 'Activate the text tool',
    shortcuts: ['t'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'tool.hand',
    category: ShortcutCategory.TOOLS,
    name: 'Hand Tool (Pan)',
    description: 'Activate the hand tool to pan canvas',
    shortcuts: ['h'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'tool.fill',
    category: ShortcutCategory.TOOLS,
    name: 'Fill Bucket',
    description: 'Activate the fill bucket tool',
    shortcuts: ['k'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'tool.select',
    category: ShortcutCategory.TOOLS,
    name: 'Selection Tool',
    description: 'Activate the rectangular selection tool',
    shortcuts: ['s'],
    priority: 'important',
    isAccessible: true,
  },

  // Navigation (Critical)
  {
    id: 'nav.pan',
    category: ShortcutCategory.NAVIGATION,
    name: 'Pan Canvas',
    description: 'Hold Space and drag to pan the canvas',
    shortcuts: ['space+drag'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'nav.zoom_in',
    category: ShortcutCategory.NAVIGATION,
    name: 'Zoom In',
    description: 'Zoom in to the canvas',
    shortcuts: ['ctrl+plus', 'cmd+plus'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'nav.zoom_out',
    category: ShortcutCategory.NAVIGATION,
    name: 'Zoom Out',
    description: 'Zoom out from the canvas',
    shortcuts: ['ctrl+minus', 'cmd+minus'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'nav.zoom_100',
    category: ShortcutCategory.NAVIGATION,
    name: 'Zoom to 100%',
    description: 'Reset zoom to 100% view',
    shortcuts: ['1'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'nav.zoom_fit',
    category: ShortcutCategory.NAVIGATION,
    name: 'Fit Canvas in View',
    description: 'Scale canvas to fit in viewport',
    shortcuts: ['2'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'nav.rotate',
    category: ShortcutCategory.NAVIGATION,
    name: 'Rotate Canvas',
    description: 'Hold R and drag to rotate canvas (30 degree increments)',
    shortcuts: ['r+drag'],
    priority: 'important',
    isAccessible: true,
  },

  // History (Critical)
  {
    id: 'history.undo',
    category: ShortcutCategory.HISTORY,
    name: 'Undo',
    description: 'Undo the last action',
    shortcuts: ['ctrl+z', 'cmd+z'],
    priority: 'critical',
    isAccessible: true,
    conflictingBrowserShortcuts: ['ctrl+z'],
  },
  {
    id: 'history.redo',
    category: ShortcutCategory.HISTORY,
    name: 'Redo',
    description: 'Redo the last undone action',
    shortcuts: ['ctrl+shift+z', 'cmd+shift+z'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'history.undo_rapid',
    category: ShortcutCategory.HISTORY,
    name: 'Rapid Undo (Hold)',
    description: 'Hold to rapidly undo multiple steps',
    shortcuts: ['ctrl+alt+z', 'cmd+alt+z'],
    priority: 'important',
    isAccessible: true,
  },

  // Brush Properties
  {
    id: 'brush.size_decrease',
    category: ShortcutCategory.BRUSH,
    name: 'Decrease Brush Size',
    description: 'Decrease brush size by 5 pixels',
    shortcuts: ['['],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'brush.size_increase',
    category: ShortcutCategory.BRUSH,
    name: 'Increase Brush Size',
    description: 'Increase brush size by 5 pixels',
    shortcuts: [']'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'brush.hardness_decrease',
    category: ShortcutCategory.BRUSH,
    name: 'Decrease Brush Hardness',
    description: 'Decrease brush hardness by 10%',
    shortcuts: ['shift+['],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'brush.hardness_increase',
    category: ShortcutCategory.BRUSH,
    name: 'Increase Brush Hardness',
    description: 'Increase brush hardness by 10%',
    shortcuts: ['shift+]'],
    priority: 'important',
    isAccessible: true,
  },

  // Opacity
  {
    id: 'opacity.set',
    category: ShortcutCategory.OPACITY,
    name: 'Set Opacity (Quick)',
    description: 'Press number 0-9 to set opacity (0=100%, 1=10%, etc)',
    shortcuts: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    priority: 'important',
    isAccessible: true,
  },

  // Colors
  {
    id: 'color.reset',
    category: ShortcutCategory.COLOR,
    name: 'Reset Colors',
    description: 'Reset to default colors (black foreground, white background)',
    shortcuts: ['d'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'color.swap',
    category: ShortcutCategory.COLOR,
    name: 'Swap Foreground/Background',
    description: 'Swap foreground and background colors',
    shortcuts: ['x'],
    priority: 'important',
    isAccessible: true,
  },

  // Layers
  {
    id: 'layer.new',
    category: ShortcutCategory.LAYERS,
    name: 'New Layer',
    description: 'Create a new layer',
    shortcuts: ['ctrl+shift+n', 'cmd+shift+n'],
    priority: 'critical',
    isAccessible: true,
  },
  {
    id: 'layer.duplicate',
    category: ShortcutCategory.LAYERS,
    name: 'Duplicate Layer',
    description: 'Duplicate the active layer',
    shortcuts: ['ctrl+j', 'cmd+j'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'layer.delete',
    category: ShortcutCategory.LAYERS,
    name: 'Delete Layer',
    description: 'Delete the active layer',
    shortcuts: ['delete', 'backspace'],
    priority: 'important',
    isAccessible: true,
  },
  {
    id: 'layer.merge_down',
    category: ShortcutCategory.LAYERS,
    name: 'Merge Down',
    description: 'Merge active layer with layer below',
    shortcuts: ['ctrl+e', 'cmd+e'],
    priority: 'important',
    isAccessible: true,
  },

  // Files
  {
    id: 'file.new',
    category: ShortcutCategory.FILE,
    name: 'New Project',
    description: 'Create a new drawing project',
    shortcuts: ['ctrl+n', 'cmd+n'],
    priority: 'critical',
    isAccessible: true,
    conflictingBrowserShortcuts: ['ctrl+n'],
  },
  {
    id: 'file.save',
    category: ShortcutCategory.FILE,
    name: 'Save Project',
    description: 'Save the current project',
    shortcuts: ['ctrl+s', 'cmd+s'],
    priority: 'critical',
    isAccessible: true,
    conflictingBrowserShortcuts: ['ctrl+s'],
  },
  {
    id: 'file.export',
    category: ShortcutCategory.FILE,
    name: 'Export As',
    description: 'Export drawing as PNG/JPEG/WebP',
    shortcuts: ['ctrl+shift+e', 'cmd+shift+e'],
    priority: 'important',
    isAccessible: true,
  },

  // Help
  {
    id: 'help.shortcuts',
    category: ShortcutCategory.HELP,
    name: 'Show Keyboard Shortcuts',
    description: 'Display all available keyboard shortcuts',
    shortcuts: ['?'],
    priority: 'nice-to-have',
    isAccessible: true,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize shortcut string for comparison
 * e.g., "Ctrl+Z" -> "ctrl+z"
 */
export function normalizeShortcut(shortcut: string): string {
  return shortcut.toLowerCase().replace(/cmd/gi, 'ctrl');
}

/**
 * Check if a shortcut string matches normalized shortcuts
 */
export function matchesShortcut(
  eventShortcut: string,
  definedShortcuts: string[]
): boolean {
  const normalized = normalizeShortcut(eventShortcut);
  return definedShortcuts.some((s) => normalizeShortcut(s) === normalized);
}

/**
 * Build shortcut string from keyboard event
 * Returns format like "ctrl+shift+z" or "cmd+z"
 */
export function buildShortcutString(event: KeyboardEvent): string {
  const parts: string[] = [];

  // Determine if it's Ctrl/Cmd
  if (event.ctrlKey || event.metaKey) {
    parts.push(event.metaKey ? 'cmd' : 'ctrl');
  }

  // Add Shift if held
  if (event.shiftKey) {
    parts.push('shift');
  }

  // Add Alt if held
  if (event.altKey) {
    parts.push('alt');
  }

  // Add the key itself
  let key = event.key.toLowerCase();
  if (key === '+') key = 'plus';
  if (key === '-') key = 'minus';
  if (key === '[') key = 'bracketleft';
  if (key === ']') key = 'bracketright';
  if (key === '{') key = 'shift+bracketleft';
  if (key === '}') key = 'shift+bracketright';
  if (key === ' ') key = 'space';

  parts.push(key);

  return parts.join('+');
}

/**
 * Get human-readable shortcut display
 * e.g., "Ctrl+Z" or "Cmd+Shift+Z"
 */
export function formatShortcutForDisplay(shortcut: string, isMac = false): string {
  const parts = shortcut.split('+');

  return parts
    .map((part) => {
      if (part === 'ctrl') return isMac ? '' : 'Ctrl'; // Empty for Mac (replaced with Cmd)
      if (part === 'cmd') return isMac ? 'Cmd' : '';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return isMac ? 'Opt' : 'Alt';
      if (part === 'plus') return '+';
      if (part === 'minus') return '−';
      if (part === 'bracketleft') return '[';
      if (part === 'bracketright') return ']';
      if (part === 'space') return 'Space';
      if (part === 'enter') return 'Enter';
      if (part === 'delete') return 'Delete';
      if (part === 'backspace') return 'Backspace';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .filter((p) => p.length > 0)
    .join(isMac ? '+' : '+');
}

/**
 * Check if this shortcut conflicts with browser defaults
 */
export function hasConflict(shortcutId: string): string[] {
  const def = SHORTCUT_REGISTRY.find((s) => s.id === shortcutId);
  return def?.conflictingBrowserShortcuts || [];
}

/**
 * Get all shortcuts by category
 */
export function getShortcutsByCategory(
  category: ShortcutCategory
): ShortcutDefinition[] {
  return SHORTCUT_REGISTRY.filter((s) => s.category === category);
}

/**
 * Find shortcut definition by ID
 */
export function getShortcutById(id: string): ShortcutDefinition | undefined {
  return SHORTCUT_REGISTRY.find((s) => s.id === id);
}

/**
 * Get all critical shortcuts (MVP)
 */
export function getCriticalShortcuts(): ShortcutDefinition[] {
  return SHORTCUT_REGISTRY.filter((s) => s.priority === 'critical');
}

/**
 * Get all accessible shortcuts (keyboard-only users)
 */
export function getAccessibleShortcuts(): ShortcutDefinition[] {
  return SHORTCUT_REGISTRY.filter((s) => s.isAccessible !== false);
}

export default {
  TOOL_SHORTCUTS,
  ZOOM_SHORTCUTS,
  HISTORY_SHORTCUTS,
  BRUSH_SHORTCUTS,
  OPACITY_SHORTCUTS,
  LAYER_SHORTCUTS,
  SELECTION_SHORTCUTS,
  FILE_SHORTCUTS,
  VIEW_SHORTCUTS,
  HELP_SHORTCUTS,
  SHORTCUT_REGISTRY,
  normalizeShortcut,
  matchesShortcut,
  buildShortcutString,
  formatShortcutForDisplay,
  hasConflict,
  getShortcutsByCategory,
  getShortcutById,
  getCriticalShortcuts,
  getAccessibleShortcuts,
};

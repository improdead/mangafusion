# Undo/Redo Implementation Examples

Complete code examples ready for integration into MangaFusion.

## 1. Quick Start Implementation

### 1.1 Minimal Command Pattern (Fastest Integration)

```typescript
// /lib/undo-redo/command.ts
export interface ICommand {
  id: string;
  description: string;
  execute(): void;
  undo(): void;
}

export class CommandStack {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxSize: number = 100;

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo on new action

    // Enforce max history size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

### 1.2 Quick Integration into Studio Editor

```typescript
// /pages/studio/[id].tsx - Add to top of component

import { CommandStack, ICommand } from '../../lib/undo-redo/command';

export default function Studio() {
  const commandStack = useRef(new CommandStack());
  // ... existing code ...

  // Create command helper
  const executeCommand = (description: string, execute: () => void, undo: () => void) => {
    const command: ICommand = {
      id: Math.random().toString(36),
      description,
      execute,
      undo,
    };
    commandStack.current.execute(command);
  };

  // Update drag handler to use commands
  const onDragEnd = (overlayId: string) => {
    if (!dragState.current || !currentPage) return;

    const state = dragState.current;
    if (state.startX !== state.currentX || state.startY !== state.currentY) {
      executeCommand(
        `Move overlay on page ${currentPage.id}`,
        () => {
          const overlay = currentOverlays.find(o => o.id === overlayId);
          if (overlay) {
            overlay.x = state.currentX;
            overlay.y = state.currentY;
          }
        },
        () => {
          const overlay = currentOverlays.find(o => o.id === overlayId);
          if (overlay) {
            overlay.x = state.startX;
            overlay.y = state.startY;
          }
        }
      );
    }
    dragState.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        commandStack.current.undo();
        // Trigger re-render by updating state
        setOverlays({...overlays});
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        commandStack.current.redo();
        setOverlays({...overlays});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlays]);

  return (
    <Layout title="Studio Editor - MangaFusion">
      {/* ... existing UI ... */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {
            commandStack.current.undo();
            setOverlays({...overlays});
          }}
          disabled={!commandStack.current.canUndo()}
          className="px-3 py-1 text-sm rounded border disabled:opacity-50"
        >
          ↶ Undo
        </button>
        <button
          onClick={() => {
            commandStack.current.redo();
            setOverlays({...overlays});
          }}
          disabled={!commandStack.current.canRedo()}
          className="px-3 py-1 text-sm rounded border disabled:opacity-50"
        >
          ↷ Redo
        </button>
      </div>
      {/* ... rest of UI ... */}
    </Layout>
  );
}
```

---

## 2. Production-Ready Implementation

### 2.1 Commands for MangaFusion Overlays

```typescript
// /lib/undo-redo/commands/overlay-commands.ts

import { Overlay } from '../../store/editor-store';

export interface BaseCommandOptions {
  id?: string;
  description: string;
  timestamp?: number;
}

export abstract class BaseCommand implements ICommand {
  id: string;
  description: string;
  timestamp: number;

  constructor(options: BaseCommandOptions) {
    this.id = options.id || Math.random().toString(36).slice(2);
    this.description = options.description;
    this.timestamp = options.timestamp || Date.now();
  }

  abstract execute(): void;
  abstract undo(): void;
}

// Move Overlay
export class MoveOverlayCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlayId: string,
    private fromX: number,
    private fromY: number,
    private toX: number,
    private toY: number,
    private getOverlay: (pageId: string, overlayId: string) => Overlay | undefined,
    private updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => void
  ) {
    super({
      description: `Move overlay on page ${pageId}`,
    });
  }

  execute(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      x: this.toX,
      y: this.toY,
    });
  }

  undo(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      x: this.fromX,
      y: this.fromY,
    });
  }

  // For command merging (consecutive drags)
  canMerge(other: any): boolean {
    return (
      other instanceof MoveOverlayCommand &&
      this.pageId === other.pageId &&
      this.overlayId === other.overlayId &&
      Math.abs(this.timestamp - other.timestamp) < 500
    );
  }

  merge(other: MoveOverlayCommand): void {
    this.toX = other.toX;
    this.toY = other.toY;
    this.timestamp = other.timestamp;
  }
}

// Resize Overlay
export class ResizeOverlayCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlayId: string,
    private fromW: number,
    private fromH: number,
    private toW: number,
    private toH: number,
    private updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => void
  ) {
    super({
      description: `Resize overlay on page ${pageId}`,
    });
  }

  execute(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      w: this.toW,
      h: this.toH,
    });
  }

  undo(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      w: this.fromW,
      h: this.fromH,
    });
  }

  canMerge(other: any): boolean {
    return (
      other instanceof ResizeOverlayCommand &&
      this.pageId === other.pageId &&
      this.overlayId === other.overlayId &&
      Math.abs(this.timestamp - other.timestamp) < 500
    );
  }

  merge(other: ResizeOverlayCommand): void {
    this.toW = other.toW;
    this.toH = other.toH;
    this.timestamp = other.timestamp;
  }
}

// Edit Text
export class EditTextCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlayId: string,
    private fromText: string,
    private toText: string,
    private updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => void
  ) {
    super({
      description: `Edit text on page ${pageId}`,
    });
  }

  execute(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      text: this.toText,
    });
  }

  undo(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      text: this.fromText,
    });
  }
}

// Add Overlay
export class AddOverlayCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlay: Overlay,
    private addOverlay: (pageId: string, overlay: Overlay) => void,
    private removeOverlay: (pageId: string, overlayId: string) => void
  ) {
    super({
      description: `Add ${overlay.type} on page ${pageId}`,
    });
  }

  execute(): void {
    this.addOverlay(this.pageId, this.overlay);
  }

  undo(): void {
    this.removeOverlay(this.pageId, this.overlay.id);
  }
}

// Delete Overlay
export class DeleteOverlayCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlay: Overlay,
    private index: number,
    private removeOverlay: (pageId: string, overlayId: string) => void,
    private insertOverlay: (pageId: string, overlay: Overlay, index: number) => void
  ) {
    super({
      description: `Delete overlay on page ${pageId}`,
    });
  }

  execute(): void {
    this.removeOverlay(this.pageId, this.overlay.id);
  }

  undo(): void {
    this.insertOverlay(this.pageId, this.overlay, this.index);
  }
}

// Change Property
export class ChangePropertyCommand extends BaseCommand {
  constructor(
    private pageId: string,
    private overlayId: string,
    private property: keyof Overlay,
    private fromValue: any,
    private toValue: any,
    private updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => void
  ) {
    super({
      description: `Change ${property} on page ${pageId}`,
    });
  }

  execute(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      [this.property]: this.toValue,
    });
  }

  undo(): void {
    this.updateOverlay(this.pageId, this.overlayId, {
      [this.property]: this.fromValue,
    });
  }
}
```

### 2.2 Enhanced Command Stack with Merging

```typescript
// /lib/undo-redo/command-stack.ts

export interface ICommand {
  id: string;
  description: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  canMerge?(other: ICommand): boolean;
  merge?(other: ICommand): void;
}

export class CommandStack {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxSize: number = 100;
  private maxMemoryMB: number = 50;
  private totalMemoryBytes: number = 0;

  execute(command: ICommand): void {
    // Try to merge with last command
    const lastCommand = this.undoStack[this.undoStack.length - 1];
    if (lastCommand && lastCommand.canMerge?.(command)) {
      lastCommand.merge?.(command);
      return;
    }

    // Execute the command
    command.execute();

    // Add to undo stack
    this.undoStack.push(command);
    this.totalMemoryBytes += this.estimateCommandSize(command);

    // Clear redo on new action
    this.redoStack = [];

    // Enforce size limits
    this.enforceMemoryLimits();
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;

    command.undo();
    this.redoStack.push(command);
    this.totalMemoryBytes -= this.estimateCommandSize(command);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;

    command.execute();
    this.undoStack.push(command);
    this.totalMemoryBytes += this.estimateCommandSize(command);

    this.enforceMemoryLimits();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoDescription(): string {
    const cmd = this.undoStack[this.undoStack.length - 1];
    return cmd ? `Undo: ${cmd.description}` : 'Nothing to undo';
  }

  getRedoDescription(): string {
    const cmd = this.redoStack[this.redoStack.length - 1];
    return cmd ? `Redo: ${cmd.description}` : 'Nothing to redo';
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.totalMemoryBytes = 0;
  }

  private estimateCommandSize(command: ICommand): number {
    return JSON.stringify(command).length;
  }

  private enforceMemoryLimits(): void {
    const maxBytes = this.maxMemoryMB * 1024 * 1024;

    while (this.totalMemoryBytes > maxBytes && this.undoStack.length > 1) {
      const removed = this.undoStack.shift();
      if (removed) {
        this.totalMemoryBytes -= this.estimateCommandSize(removed);
      }
    }
  }

  getStats() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      memoryMB: (this.totalMemoryBytes / (1024 * 1024)).toFixed(2),
    };
  }
}
```

### 2.3 React Hook for Command Executor

```typescript
// /lib/hooks/useCommandStack.ts

import { useRef, useCallback } from 'react';
import { CommandStack, ICommand } from '../undo-redo/command-stack';

export function useCommandStack() {
  const stackRef = useRef(new CommandStack());

  const execute = useCallback((command: ICommand) => {
    stackRef.current.execute(command);
  }, []);

  const undo = useCallback(() => {
    stackRef.current.undo();
  }, []);

  const redo = useCallback(() => {
    stackRef.current.redo();
  }, []);

  const canUndo = useCallback(() => {
    return stackRef.current.canUndo();
  }, []);

  const canRedo = useCallback(() => {
    return stackRef.current.canRedo();
  }, []);

  const getUndoDescription = useCallback(() => {
    return stackRef.current.getUndoDescription();
  }, []);

  const getRedoDescription = useCallback(() => {
    return stackRef.current.getRedoDescription();
  }, []);

  const clear = useCallback(() => {
    stackRef.current.clear();
  }, []);

  const getStats = useCallback(() => {
    return stackRef.current.getStats();
  }, []);

  return {
    execute,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription,
    clear,
    getStats,
  };
}
```

---

## 3. UI Components

### 3.1 Undo/Redo Toolbar

```typescript
// /components/UndoRedoToolbar.tsx

import React from 'react';

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  undoDescription?: string;
  redoDescription?: string;
  stats?: {
    undoCount: number;
    redoCount: number;
    memoryMB: string;
  };
}

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoDescription = 'Undo',
  redoDescription = 'Redo',
  stats,
}: UndoRedoToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-white p-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="px-3 py-1.5 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        title={`${undoDescription} (Ctrl+Z)`}
      >
        ↶
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="px-3 py-1.5 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        title={`${redoDescription} (Ctrl+Shift+Z)`}
      >
        ↷
      </button>

      {stats && (
        <div className="ml-auto text-xs text-gray-500 space-x-2">
          <span>Undo: {stats.undoCount}</span>
          <span>Redo: {stats.redoCount}</span>
          <span>Memory: {stats.memoryMB}MB</span>
        </div>
      )}
    </div>
  );
}
```

### 3.2 Updated Studio Page with Toolbar

```typescript
// /pages/studio/[id].tsx (simplified integration)

import { useCommandStack } from '../../lib/hooks/useCommandStack';
import { UndoRedoToolbar } from '../../components/UndoRedoToolbar';
import {
  MoveOverlayCommand,
  ResizeOverlayCommand,
  DeleteOverlayCommand,
  AddOverlayCommand,
} from '../../lib/undo-redo/commands/overlay-commands';

export default function Studio() {
  const router = useRouter();
  const { id } = router.query;

  const [pages, setPages] = useState<Page[]>([]);
  const [overlays, setOverlays] = useState<Record<string, Overlay[]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<{ pageId: string; overlayId: string } | null>(null);

  const commandStack = useCommandStack();
  const dragState = useRef<any>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (commandStack.canUndo()) {
          commandStack.undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        if (commandStack.canRedo()) {
          commandStack.redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandStack]);

  const currentPage = useMemo(() => pages[currentIdx], [pages, currentIdx]);
  const currentOverlays = useMemo(
    () => (currentPage ? overlays[currentPage.id] || [] : []),
    [overlays, currentPage]
  );

  // Drag handlers with commands
  const onDragEnd = (overlayId: string) => {
    if (!dragState.current || !currentPage) return;

    const { startX, startY, currentX, currentY } = dragState.current;

    if (startX !== currentX || startY !== currentY) {
      const command = new MoveOverlayCommand(
        currentPage.id,
        overlayId,
        startX,
        startY,
        currentX,
        currentY,
        (pageId, overlayId) => overlays[pageId]?.find(o => o.id === overlayId),
        (pageId, overlayId, updates) => {
          setOverlays(prev => ({
            ...prev,
            [pageId]: prev[pageId].map(o =>
              o.id === overlayId ? { ...o, ...updates } : o
            ),
          }));
        }
      );

      commandStack.execute(command);
    }

    dragState.current = null;
  };

  const addOverlay = (type: string) => {
    if (!currentPage) return;

    const overlay: Overlay = {
      id: Math.random().toString(36).slice(2),
      type: type as any,
      x: 40,
      y: 40,
      w: 200,
      h: 80,
      text: '',
      fontSize: 18,
      color: '#000000',
      stroke: '#ffffff',
    };

    const command = new AddOverlayCommand(
      currentPage.id,
      overlay,
      (pageId, overlay) => {
        setOverlays(prev => ({
          ...prev,
          [pageId]: [...(prev[pageId] || []), overlay],
        }));
      },
      (pageId, overlayId) => {
        setOverlays(prev => ({
          ...prev,
          [pageId]: prev[pageId].filter(o => o.id !== overlayId),
        }));
      }
    );

    commandStack.execute(command);
  };

  const deleteSelected = () => {
    if (!currentPage || !selected) return;

    const overlay = currentOverlays.find(o => o.id === selected.overlayId);
    if (!overlay) return;

    const index = currentOverlays.indexOf(overlay);

    const command = new DeleteOverlayCommand(
      currentPage.id,
      overlay,
      index,
      (pageId, overlayId) => {
        setOverlays(prev => ({
          ...prev,
          [pageId]: prev[pageId].filter(o => o.id !== overlayId),
        }));
      },
      (pageId, overlay, index) => {
        setOverlays(prev => {
          const newOverlays = [...prev[pageId]];
          newOverlays.splice(index, 0, overlay);
          return { ...prev, [pageId]: newOverlays };
        });
      }
    );

    commandStack.execute(command);
    setSelected(null);
  };

  return (
    <Layout title="Studio Editor - MangaFusion">
      <UndoRedoToolbar
        canUndo={commandStack.canUndo()}
        canRedo={commandStack.canRedo()}
        onUndo={() => commandStack.undo()}
        onRedo={() => commandStack.redo()}
        undoDescription={commandStack.getUndoDescription()}
        redoDescription={commandStack.getRedoDescription()}
        stats={commandStack.getStats()}
      />

      <div className="flex h-[calc(100vh-120px)]">
        {/* Pages sidebar */}
        <aside className="w-56 border-r bg-white p-3 overflow-y-auto">
          <h3 className="font-semibold mb-2">Pages</h3>
          {/* ... page list ... */}
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          {currentPage && (
            <div
              className="relative bg-white shadow-xl"
              style={{ width: 682, height: 1024 }}
            >
              <img
                src={currentPage.imageUrl}
                className="absolute inset-0 w-full h-full"
                alt="page"
              />

              {currentOverlays.map(overlay => (
                <div
                  key={overlay.id}
                  className={`absolute ${selected?.overlayId === overlay.id ? 'ring-2 ring-purple-500' : ''}`}
                  style={{
                    left: overlay.x,
                    top: overlay.y,
                    width: overlay.w,
                    height: overlay.h,
                  }}
                  onClick={() =>
                    setSelected({ pageId: currentPage.id, overlayId: overlay.id })
                  }
                  onPointerDown={(e) => {
                    dragState.current = {
                      startX: overlay.x,
                      startY: overlay.y,
                      currentX: overlay.x,
                      currentY: overlay.y,
                    };
                  }}
                  onPointerMove={(e) => {
                    if (dragState.current) {
                      dragState.current.currentX += (e as any).movementX || 0;
                      dragState.current.currentY += (e as any).movementY || 0;
                      // Update UI optimistically
                    }
                  }}
                  onPointerUp={() => onDragEnd(overlay.id)}
                >
                  {/* Overlay rendering */}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Tools */}
        <aside className="w-80 border-l bg-white p-4 space-y-4 overflow-y-auto">
          <button
            onClick={() => addOverlay('text')}
            className="w-full py-2 bg-blue-500 text-white rounded"
          >
            Add Text
          </button>

          <button
            onClick={() => addOverlay('bubble')}
            className="w-full py-2 bg-blue-500 text-white rounded"
          >
            Add Bubble
          </button>

          {selected && (
            <button
              onClick={deleteSelected}
              className="w-full py-2 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          )}
        </aside>
      </div>
    </Layout>
  );
}
```

---

## 4. Testing Examples

```typescript
// /tests/undo-redo.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { CommandStack } from '../lib/undo-redo/command-stack';
import { ICommand } from '../lib/undo-redo/command-stack';

describe('Command Stack', () => {
  let commandStack: CommandStack;

  beforeEach(() => {
    commandStack = new CommandStack();
  });

  it('should execute commands', () => {
    let value = 0;
    const command: ICommand = {
      id: '1',
      description: 'Increment',
      timestamp: Date.now(),
      execute: () => (value = 1),
      undo: () => (value = 0),
    };

    commandStack.execute(command);
    expect(value).toBe(1);
  });

  it('should undo commands', () => {
    let value = 0;
    const command: ICommand = {
      id: '1',
      description: 'Increment',
      timestamp: Date.now(),
      execute: () => (value = 1),
      undo: () => (value = 0),
    };

    commandStack.execute(command);
    commandStack.undo();
    expect(value).toBe(0);
  });

  it('should redo commands', () => {
    let value = 0;
    const command: ICommand = {
      id: '1',
      description: 'Increment',
      timestamp: Date.now(),
      execute: () => (value = 1),
      undo: () => (value = 0),
    };

    commandStack.execute(command);
    commandStack.undo();
    commandStack.redo();
    expect(value).toBe(1);
  });

  it('should clear redo on new command', () => {
    let value = 0;
    const cmd1: ICommand = {
      id: '1',
      description: 'Set to 1',
      timestamp: Date.now(),
      execute: () => (value = 1),
      undo: () => (value = 0),
    };
    const cmd2: ICommand = {
      id: '2',
      description: 'Set to 2',
      timestamp: Date.now() + 1,
      execute: () => (value = 2),
      undo: () => (value = 1),
    };

    commandStack.execute(cmd1);
    commandStack.undo();
    expect(commandStack.canRedo()).toBe(true);

    commandStack.execute(cmd2);
    expect(commandStack.canRedo()).toBe(false);
  });

  it('should merge similar commands', () => {
    let value = 0;
    const cmd1: ICommand = {
      id: '1',
      description: 'Add 1',
      timestamp: Date.now(),
      execute: () => (value += 1),
      undo: () => (value -= 1),
      canMerge: (other) => other.id === 'add',
      merge: () => { /* merge logic */ },
    };

    commandStack.execute(cmd1);
    expect(value).toBe(1);
  });
});
```

---

## 5. Integration Checklist

- [ ] Copy command-stack.ts to /lib/undo-redo/
- [ ] Copy command.ts to /lib/undo-redo/
- [ ] Copy overlay-commands.ts to /lib/undo-redo/commands/
- [ ] Copy useCommandStack.ts to /lib/hooks/
- [ ] Copy UndoRedoToolbar.tsx to /components/
- [ ] Update /pages/studio/[id].tsx with integration
- [ ] Add keyboard shortcut handlers
- [ ] Test with manual drag/move operations
- [ ] Verify undo/redo in browser DevTools
- [ ] Test memory usage with large histories
- [ ] Add debouncing for rapid operations

---

## 6. Common Patterns

### 6.1 Debounced Command Execution

```typescript
// For drag operations - don't create command on every move
const debouncedExecute = useRef<NodeJS.Timeout>();

const onPointerMove = (e: React.PointerEvent) => {
  dragState.current.currentX += (e as any).movementX;
  dragState.current.currentY += (e as any).movementY;

  // Clear existing timeout
  if (debouncedExecute.current) {
    clearTimeout(debouncedExecute.current);
  }

  // Create command only on movement end
  debouncedExecute.current = setTimeout(() => {
    const command = new MoveOverlayCommand(...);
    commandStack.execute(command);
  }, 300);
};
```

### 6.2 Grouped Operations

```typescript
// Group multiple operations into single undo
const groupedUndo = () => {
  const startCount = commandStack.undoCount;

  // Do multiple operations
  operation1();
  operation2();
  operation3();

  // User only needs one undo to revert all three
};
```

### 6.3 Conditional Undo

```typescript
// Only add to history if something actually changed
const conditionalExecute = (command: ICommand, hasChanged: boolean) => {
  if (hasChanged) {
    commandStack.execute(command);
  } else {
    command.execute(); // Execute but don't add to history
  }
};
```


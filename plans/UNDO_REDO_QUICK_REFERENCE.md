# Undo/Redo System - Quick Reference Guide

## At a Glance

| Aspect | Recommendation | Why |
|--------|-----------------|-----|
| **Pattern** | Command Pattern | Small memory, explicit, debuggable |
| **History Structure** | Undo Tree (branching) | Never lose work, support exploration |
| **Memory Strategy** | Hybrid (delta + snapshots) | Fast undo/redo + efficient memory |
| **Serialization** | JSON + Brotli compression | Compact, human-readable, compressible |
| **Storage** | IndexedDB | Fast local storage, supports large files |
| **Memory Limit** | 50-100MB | Handles 1000+ operations with branches |
| **Snapshot Interval** | Every 20-30 commands | Balance between speed and memory |

---

## File Structure for Implementation

```
/lib
  /undo-redo
    command-stack.ts           (Core command executor)
    command.ts                 (Interfaces & base class)
    history-manager.ts         (Undo tree implementation)
    memory-manager.ts          (Memory limit enforcement)
    /commands
      overlay-commands.ts      (Move, Resize, Add, Delete, Edit)
      batch-command.ts         (Group multiple commands)
  /hooks
    useCommandStack.ts         (React hook)
    useCommandExecutor.ts      (Higher-level hook)
  /persistence
    indexed-db-store.ts        (Save/load projects)
    compression.ts             (Gzip/Brotli compression)
  /store
    editor-store.ts            (Zustand store with history)
/components
  UndoRedoToolbar.tsx          (UI for undo/redo buttons)
  HistoryViewer.tsx            (Optional: show history tree)
```

---

## Command Pattern Quick Implementation

### Minimal Version (Copy-Paste Ready)

```typescript
// Step 1: Define command interface
interface ICommand {
  id: string;
  description: string;
  execute(): void;
  undo(): void;
}

// Step 2: Create command stack
class CommandStack {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];

  execute(cmd: ICommand) {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
    }
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
    }
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
}

// Step 3: Create concrete commands
class MoveOverlayCommand implements ICommand {
  id = Math.random().toString(36);
  description = 'Move overlay';

  constructor(
    private overlay: any,
    private fromX: number,
    private fromY: number,
    private toX: number,
    private toY: number
  ) {}

  execute() {
    this.overlay.x = this.toX;
    this.overlay.y = this.toY;
  }

  undo() {
    this.overlay.x = this.fromX;
    this.overlay.y = this.fromY;
  }
}

// Step 4: Use in component
const stack = new CommandStack();

// When user drags overlay
const onDragEnd = (overlay, fromX, fromY, toX, toY) => {
  const command = new MoveOverlayCommand(overlay, fromX, fromY, toX, toY);
  stack.execute(command);
};

// Keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      stack.undo();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Common Use Cases & Solutions

### Use Case 1: Drag Overlay

**Problem:** Every pixel movement creates separate undo step

**Solution:** Merge commands

```typescript
class MoveCommand implements ICommand {
  canMerge(other: ICommand): boolean {
    return other instanceof MoveCommand &&
           this.overlayId === other.overlayId &&
           Date.now() - other.timestamp < 500; // Within 500ms
  }

  merge(other: MoveCommand) {
    this.toX = other.toX;
    this.toY = other.toY;
  }
}
```

### Use Case 2: Add Multiple Overlays at Once

**Problem:** Want single undo for multiple operations

**Solution:** Batch command

```typescript
class BatchCommand implements ICommand {
  constructor(
    private commands: ICommand[]
  ) {}

  execute() {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo() {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// Usage
const batch = new BatchCommand([
  new AddOverlayCommand(overlay1),
  new AddOverlayCommand(overlay2),
  new AddOverlayCommand(overlay3),
]);
stack.execute(batch); // Single undo reverts all 3
```

### Use Case 3: Conditional Undo

**Problem:** Don't want to record if nothing changed

**Solution:** Check before executing

```typescript
const moveOverlay = (id, fromX, fromY, toX, toY) => {
  // Only create command if position actually changed
  if (fromX === toX && fromY === toY) {
    return; // Don't add to history
  }

  const command = new MoveOverlayCommand(
    id, fromX, fromY, toX, toY
  );
  stack.execute(command);
};
```

### Use Case 4: Memory Limits

**Problem:** History grows too large

**Solution:** Prune old branches

```typescript
class CommandStack {
  private maxMemoryMB = 50;
  private totalMemoryBytes = 0;

  execute(cmd: ICommand) {
    cmd.execute();
    this.undoStack.push(cmd);

    this.totalMemoryBytes += JSON.stringify(cmd).length;

    // Enforce limit
    if (this.totalMemoryBytes > this.maxMemoryMB * 1024 * 1024) {
      // Remove oldest
      const removed = this.undoStack.shift();
      if (removed) {
        this.totalMemoryBytes -= JSON.stringify(removed).length;
      }
    }
  }
}
```

### Use Case 5: Branching History

**Problem:** Want to preserve all edits, not lose work on undo

**Solution:** Undo tree

```typescript
interface HistoryNode {
  command: ICommand;
  children: HistoryNode[];
  parent?: HistoryNode;
}

class HistoryManager {
  private currentNode: HistoryNode | null = null;

  execute(command: ICommand) {
    command.execute();

    const newNode: HistoryNode = {
      command,
      children: [],
      parent: this.currentNode,
    };

    if (this.currentNode) {
      this.currentNode.children.push(newNode);
    }
    this.currentNode = newNode;
  }

  undo() {
    if (this.currentNode?.parent) {
      this.currentNode.command.undo();
      this.currentNode = this.currentNode.parent;
    }
  }

  getRedoBranches() {
    return this.currentNode?.children || [];
  }
}
```

---

## Keyboard Shortcuts

### Standard Shortcuts

```typescript
// Undo: Ctrl+Z or Cmd+Z
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
  e.preventDefault();
  commandStack.undo();
}

// Redo: Ctrl+Shift+Z or Cmd+Shift+Z
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
  e.preventDefault();
  commandStack.redo();
}

// Alternative Redo: Ctrl+Y or Cmd+Y
if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
  e.preventDefault();
  commandStack.redo();
}

// With Branches: Show dropdown for multiple redo options
if (commandStack.canRedo() && commandStack.getRedoBranches().length > 1) {
  // Show UI with options
}
```

---

## Performance Checklist

- [ ] Commands < 1KB each
- [ ] Execute/undo < 5ms
- [ ] Merge consecutive drag operations
- [ ] Create snapshots every 20-30 commands
- [ ] Enforce 50-100MB memory limit
- [ ] Compress history with Brotli for storage
- [ ] Use IndexedDB, not localStorage
- [ ] Lazy-load history snapshots
- [ ] Profile memory with DevTools

---

## Testing Template

```typescript
describe('Undo/Redo', () => {
  let stack: CommandStack;

  beforeEach(() => {
    stack = new CommandStack();
  });

  test('execute changes state', () => {
    const cmd = createTestCommand();
    stack.execute(cmd);
    expect(state).toEqual(expectedAfterExecute);
  });

  test('undo reverts state', () => {
    stack.execute(createTestCommand());
    stack.undo();
    expect(state).toEqual(originalState);
  });

  test('redo restores state', () => {
    stack.execute(createTestCommand());
    stack.undo();
    stack.redo();
    expect(state).toEqual(expectedAfterExecute);
  });

  test('merges consecutive commands', () => {
    stack.execute(createDragCommand1());
    stack.execute(createDragCommand2());
    expect(stack.undoCount).toBe(1); // Merged
  });

  test('clears redo on new action', () => {
    stack.execute(cmd1);
    stack.undo();
    stack.execute(cmd2);
    expect(stack.canRedo()).toBe(false);
  });

  test('enforces memory limits', () => {
    for (let i = 0; i < 1000; i++) {
      stack.execute(createCommand());
    }
    expect(stack.getMemoryUsageMB()).toBeLessThan(50);
  });
});
```

---

## Debugging Tips

### Check Command Execution

```typescript
// Add logging
class CommandStack {
  execute(cmd: ICommand) {
    console.log(`Executing: ${cmd.description}`, cmd);
    cmd.execute();
    this.undoStack.push(cmd);
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (cmd) {
      console.log(`Undoing: ${cmd.description}`);
      cmd.undo();
    }
  }
}
```

### Verify State Consistency

```typescript
// Before undo
console.log('State before undo:', state);
stack.undo();
// After undo
console.log('State after undo:', state);

// They should be inverses
```

### Profile Memory Usage

```typescript
// In DevTools Console
const stats = commandStack.getStats();
console.table({
  Commands: stats.undoCount + stats.redoCount,
  Memory: stats.memoryMB,
  Snapshots: stats.snapshotCount,
});
```

### Test with Large Projects

```typescript
// Stress test
const generateTestCommands = (count: number) => {
  const commands = [];
  for (let i = 0; i < count; i++) {
    commands.push(
      new MoveOverlayCommand(
        `overlay-${i % 100}`,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      )
    );
  }
  return commands;
};

// Execute 1000 commands and measure
console.time('Execute 1000 commands');
for (const cmd of generateTestCommands(1000)) {
  commandStack.execute(cmd);
}
console.timeEnd('Execute 1000 commands');

// Measure memory
console.log('Memory usage:', commandStack.getStats().memoryMB, 'MB');
```

---

## Integration Timeline

**Quick Start (1-2 hours):**
- Copy minimal CommandStack
- Add 3-4 overlay commands
- Add keyboard shortcuts
- Test basic undo/redo

**Production (4-6 hours):**
- Add command merging
- Implement memory limits
- Add UI toolbar with stats
- Test edge cases

**Advanced (2-3 days):**
- Implement undo tree
- Add persistence to IndexedDB
- Compression for storage
- History visualization UI

---

## Library Recommendations

### If you want ready-made solutions:

**1. Immer + Custom Hooks** (Recommended)
- Immutable state updates
- Built for React
- Pairs well with Zustand

```typescript
import produce from 'immer';

const newState = produce(state, draft => {
  draft.overlays[0].x = 100;
});
```

**2. Zustand + Temporal Middleware**
- Time-travel debugging
- State snapshots
- Devtools integration

```typescript
import { create } from 'zustand';

const useStore = create((set) => ({
  // ... state ...
}));

// With history
useStore.temporal = {
  undo: () => { /* */ },
  redo: () => { /* */ },
};
```

**3. Redux Toolkit**
- Built-in Immer integration
- Redux DevTools (perfect for debugging)
- Time-travel debugging

```typescript
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: editorReducer,
  // Devtools shows full history
});
```

---

## Common Mistakes to Avoid

❌ **DON'T:** Store references in commands
```typescript
// BAD - reference may change
class DeleteCommand {
  constructor(overlay) {
    this.overlay = overlay; // Object reference!
  }
}
```

✓ **DO:** Store immutable data
```typescript
// GOOD - store properties
class DeleteCommand {
  constructor(overlayId, overlayData) {
    this.overlayId = overlayId;
    this.overlayData = overlayData; // Snapshot
  }
}
```

---

❌ **DON'T:** Create command every pixel
```typescript
// BAD - 100 commands for single drag
onPointerMove = (e) => {
  const cmd = new MoveCommand(...);
  stack.execute(cmd); // Every move event!
}
```

✓ **DO:** Merge or debounce
```typescript
// GOOD - merge on-the-fly
execute(cmd) {
  if (lastCmd.canMerge(cmd)) {
    lastCmd.merge(cmd);
    return;
  }
  // ... normal execute
}
```

---

❌ **DON'T:** Ignore memory
```typescript
// BAD - infinite history growth
execute(cmd) {
  this.history.push(cmd);
  // No cleanup
}
```

✓ **DO:** Enforce limits
```typescript
// GOOD - memory aware
execute(cmd) {
  this.history.push(cmd);
  if (this.getMemoryMB() > 50) {
    this.pruneOldest();
  }
}
```

---

## References

- **Design Patterns:** https://refactoring.guru/design-patterns/command
- **React Hooks:** https://react.dev/reference/react/useRef
- **IndexedDB:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Compression:** https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
- **Zustand:** https://github.com/pmndrs/zustand
- **Immer:** https://immerjs.github.io/immer/


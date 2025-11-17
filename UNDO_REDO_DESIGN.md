# Undo/Redo System Design for MangaFusion Studio Editor

## Executive Summary

This document provides a production-ready technical design for implementing an advanced undo/redo system for the MangaFusion studio editor. The system handles layer manipulation, overlay editing, and drawing operations with support for:

- **Command Pattern** for encapsulated, reversible actions
- **Branching History (Undo Tree)** to preserve all edits
- **Memory Optimization** using delta changes and periodic snapshots
- **Persistence** with JSON serialization and compression
- **Performance** handling for large multi-page projects

---

## 1. Architecture Overview

### 1.1 Core Components

```
┌─────────────────────────────────────────────────────────┐
│                 UI Layer (React Components)              │
│     (Canvas, Toolbars, Selection, Property Panels)      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│            EditorStore (Zustand State)                   │
│    (Current state, layer data, page data)               │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│          CommandExecutor (Command Dispatcher)            │
│    (Execute, track, and dispatch commands)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│          HistoryManager (Undo/Redo Tree)                 │
│    ┌─────────────────────────────────────────────┐      │
│    │ - Command Stack (past branch)               │      │
│    │ - Current Snapshot Cache                    │      │
│    │ - Future Branches (undo tree)                │      │
│    │ - Memory Manager                            │      │
│    └─────────────────────────────────────────────┘      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│        PersistenceManager (Save/Load/Export)             │
│    - Serialize to IndexedDB                             │
│    - Compress history snapshots                         │
│    - Export as project files                            │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Action (e.g., drag overlay)
         ↓
   UI Event Handler
         ↓
   Create Command Object
         ↓
   CommandExecutor.execute(command)
         ↓
   ┌─────────────────────┐
   │ Command.execute()   │───→ Update EditorStore
   └─────────────────────┘
         ↓
   HistoryManager.push(command)
         ↓
   ┌──────────────────────────────┐
   │ Update undo/redo stacks      │
   │ Check memory limits          │
   │ Create snapshots if needed   │
   └──────────────────────────────┘
         ↓
   Persist to IndexedDB
```

---

## 2. Command Pattern Implementation

### 2.1 Command Interface

```typescript
// /lib/undo-redo/command.ts

export interface ICommand {
  /** Unique identifier for this command */
  id: string;

  /** Human-readable description */
  description: string;

  /** Timestamp of execution */
  timestamp: number;

  /** Execute the command and modify state */
  execute(): void;

  /** Undo the command, restoring previous state */
  undo(): void;

  /** Estimate memory size in bytes for this command */
  getMemorySize(): number;

  /** Optional: Merge consecutive similar commands (e.g., drag movements) */
  canMergeWith?(other: ICommand): boolean;

  /** Merge this command with the next one */
  mergeWith?(other: ICommand): void;

  /** Serialize for persistence */
  toJSON(): Record<string, any>;

  /** Deserialize from storage */
  static fromJSON(json: Record<string, any>): ICommand;
}

export abstract class BaseCommand implements ICommand {
  id: string = Math.random().toString(36).slice(2);
  timestamp: number = Date.now();

  constructor(
    public description: string,
    protected store: EditorStore
  ) {}

  abstract execute(): void;
  abstract undo(): void;

  getMemorySize(): number {
    // Estimate: description + id + metadata overhead
    return this.description.length * 2 + 200;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      description: this.description,
      timestamp: this.timestamp,
    };
  }
}
```

### 2.2 Concrete Command Examples

#### 2.2.1 Overlay Movement Command

```typescript
// /lib/undo-redo/commands/MoveOverlayCommand.ts

interface MoveOverlayCommandData {
  pageId: string;
  overlayId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export class MoveOverlayCommand extends BaseCommand {
  private data: MoveOverlayCommandData;

  constructor(data: MoveOverlayCommandData, store: EditorStore) {
    super(`Move overlay on page ${data.pageId}`, store);
    this.data = data;
  }

  execute(): void {
    this.store.updateOverlay(this.data.pageId, this.data.overlayId, {
      x: this.data.toX,
      y: this.data.toY,
    });
  }

  undo(): void {
    this.store.updateOverlay(this.data.pageId, this.data.overlayId, {
      x: this.data.fromX,
      y: this.data.fromY,
    });
  }

  getMemorySize(): number {
    return super.getMemorySize() + 100;
  }

  canMergeWith(other: ICommand): boolean {
    if (!(other instanceof MoveOverlayCommand)) return false;
    // Merge if same overlay on same page and within 500ms
    return (
      this.data.pageId === other.data.pageId &&
      this.data.overlayId === other.data.overlayId &&
      Math.abs(this.timestamp - other.timestamp) < 500
    );
  }

  mergeWith(other: MoveOverlayCommand): void {
    // Update destination to the other command's destination
    this.data.toX = other.data.toX;
    this.data.toY = other.data.toY;
    this.timestamp = other.timestamp;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'MoveOverlay',
      data: this.data,
    };
  }
}
```

#### 2.2.2 Overlay Resize Command

```typescript
// /lib/undo-redo/commands/ResizeOverlayCommand.ts

interface ResizeOverlayCommandData {
  pageId: string;
  overlayId: string;
  fromW: number;
  fromH: number;
  toW: number;
  toH: number;
}

export class ResizeOverlayCommand extends BaseCommand {
  private data: ResizeOverlayCommandData;

  constructor(data: ResizeOverlayCommandData, store: EditorStore) {
    super(`Resize overlay on page ${data.pageId}`, store);
    this.data = data;
  }

  execute(): void {
    this.store.updateOverlay(this.data.pageId, this.data.overlayId, {
      w: this.data.toW,
      h: this.data.toH,
    });
  }

  undo(): void {
    this.store.updateOverlay(this.data.pageId, this.data.overlayId, {
      w: this.data.fromW,
      h: this.data.fromH,
    });
  }

  canMergeWith(other: ICommand): boolean {
    if (!(other instanceof ResizeOverlayCommand)) return false;
    return (
      this.data.pageId === other.data.pageId &&
      this.data.overlayId === other.data.overlayId &&
      Math.abs(this.timestamp - other.timestamp) < 500
    );
  }

  mergeWith(other: ResizeOverlayCommand): void {
    this.data.toW = other.data.toW;
    this.data.toH = other.data.toH;
    this.timestamp = other.timestamp;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'ResizeOverlay',
      data: this.data,
    };
  }
}
```

#### 2.2.3 Overlay Text Edit Command

```typescript
// /lib/undo-redo/commands/EditOverlayTextCommand.ts

interface EditOverlayTextCommandData {
  pageId: string;
  overlayId: string;
  fromText: string;
  toText: string;
  fromFontSize?: number;
  toFontSize?: number;
  fromColor?: string;
  toColor?: string;
}

export class EditOverlayTextCommand extends BaseCommand {
  private data: EditOverlayTextCommandData;

  constructor(data: EditOverlayTextCommandData, store: EditorStore) {
    super(`Edit overlay text on page ${data.pageId}`, store);
    this.data = data;
  }

  execute(): void {
    const updates: any = { text: this.data.toText };
    if (this.data.toFontSize !== undefined) updates.fontSize = this.data.toFontSize;
    if (this.data.toColor !== undefined) updates.color = this.data.toColor;

    this.store.updateOverlay(this.data.pageId, this.data.overlayId, updates);
  }

  undo(): void {
    const updates: any = { text: this.data.fromText };
    if (this.data.fromFontSize !== undefined) updates.fontSize = this.data.fromFontSize;
    if (this.data.fromColor !== undefined) updates.color = this.data.fromColor;

    this.store.updateOverlay(this.data.pageId, this.data.overlayId, updates);
  }

  getMemorySize(): number {
    return super.getMemorySize() +
           this.data.fromText.length * 2 +
           this.data.toText.length * 2 + 50;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'EditOverlayText',
      data: this.data,
    };
  }
}
```

#### 2.2.4 Add Overlay Command

```typescript
// /lib/undo-redo/commands/AddOverlayCommand.ts

export class AddOverlayCommand extends BaseCommand {
  private overlay: Overlay;
  private pageId: string;

  constructor(pageId: string, overlay: Overlay, store: EditorStore) {
    super(`Add ${overlay.type} on page ${pageId}`, store);
    this.pageId = pageId;
    this.overlay = overlay;
  }

  execute(): void {
    this.store.addOverlay(this.pageId, this.overlay);
  }

  undo(): void {
    this.store.removeOverlay(this.pageId, this.overlay.id);
  }

  getMemorySize(): number {
    return super.getMemorySize() + JSON.stringify(this.overlay).length;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'AddOverlay',
      pageId: this.pageId,
      overlay: this.overlay,
    };
  }
}
```

#### 2.2.5 Delete Overlay Command

```typescript
// /lib/undo-redo/commands/DeleteOverlayCommand.ts

export class DeleteOverlayCommand extends BaseCommand {
  private overlay: Overlay;
  private pageId: string;
  private indexInPage: number;

  constructor(pageId: string, overlay: Overlay, store: EditorStore) {
    super(`Delete overlay on page ${pageId}`, store);
    this.pageId = pageId;
    this.overlay = overlay;
    this.indexInPage = store.getOverlays(pageId).indexOf(overlay);
  }

  execute(): void {
    this.store.removeOverlay(this.pageId, this.overlay.id);
  }

  undo(): void {
    // Re-insert at original position
    this.store.insertOverlay(this.pageId, this.overlay, this.indexInPage);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'DeleteOverlay',
      pageId: this.pageId,
      overlay: this.overlay,
      indexInPage: this.indexInPage,
    };
  }
}
```

#### 2.2.6 Batch Command (Macro)

```typescript
// /lib/undo-redo/commands/BatchCommand.ts

export class BatchCommand extends BaseCommand {
  constructor(
    description: string,
    private commands: ICommand[],
    store: EditorStore
  ) {
    super(description, store);
  }

  execute(): void {
    // Commands are already executed when added
    // This is for redo operations
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getMemorySize(): number {
    return this.commands.reduce((sum, cmd) => sum + cmd.getMemorySize(), 200);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'Batch',
      commands: this.commands.map(cmd => cmd.toJSON()),
    };
  }
}
```

---

## 3. History Manager (Undo Tree Implementation)

### 3.1 Undo Tree Data Structure

```typescript
// /lib/undo-redo/history-manager.ts

export interface HistoryNode {
  command: ICommand;
  children: HistoryNode[]; // Branches from this node
  parent?: HistoryNode;    // Link to parent for traversal
}

export class HistoryManager {
  private root: HistoryNode | null = null;
  private currentNode: HistoryNode | null = null;
  private snapshotInterval: number = 20; // Create snapshot every N commands
  private commandsSinceSnapshot: number = 0;
  private snapshots: Map<string, EditorState> = new Map();
  private maxMemoryMB: number = 50;
  private currentMemoryUsage: number = 0;
  private commandRegistry: Map<string, typeof BaseCommand> = new Map();

  constructor(private store: EditorStore) {
    this.registerDefaultCommands();
  }

  /**
   * Execute a command and add it to history
   */
  execute(command: ICommand): void {
    // Execute the command
    command.execute();

    // Try to merge with last command (e.g., consecutive drags)
    if (
      this.currentNode &&
      this.currentNode.command.canMergeWith?.(command)
    ) {
      this.currentNode.command.mergeWith?.(command);
      return; // Don't create new node
    }

    // Create new history node
    const newNode: HistoryNode = {
      command,
      children: [],
      parent: this.currentNode || undefined,
    };

    // Add as child to current node
    if (this.currentNode) {
      this.currentNode.children.push(newNode);
    }

    this.currentNode = newNode;
    this.root = this.root || newNode;

    // Update memory tracking
    this.currentMemoryUsage += command.getMemorySize();

    // Create snapshots at intervals to speed up undo/redo
    this.commandsSinceSnapshot++;
    if (this.commandsSinceSnapshot >= this.snapshotInterval) {
      this.createSnapshot();
      this.commandsSinceSnapshot = 0;
    }

    // Enforce memory limits
    if (this.currentMemoryUsage > this.maxMemoryMB * 1024 * 1024) {
      this.enforceMemoryLimits();
    }
  }

  /**
   * Undo to parent
   */
  undo(): boolean {
    if (!this.currentNode?.parent) return false;

    this.currentNode.command.undo();
    this.currentNode = this.currentNode.parent;
    return true;
  }

  /**
   * Redo to a specific child branch
   */
  redo(childIndex: number = 0): boolean {
    if (!this.currentNode || !this.currentNode.children[childIndex]) {
      return false;
    }

    const child = this.currentNode.children[childIndex];
    child.command.execute();
    this.currentNode = child;
    return true;
  }

  /**
   * Get available redo branches (for UI showing multiple undo paths)
   */
  getRedoBranches(): { command: ICommand; index: number }[] {
    if (!this.currentNode) return [];
    return this.currentNode.children.map((child, index) => ({
      command: child.command,
      index,
    }));
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return !!this.currentNode?.parent;
  }

  /**
   * Check if redo is possible (any branches)
   */
  canRedo(): boolean {
    return !!(this.currentNode?.children.length);
  }

  /**
   * Get the full undo history as a tree structure
   */
  getHistoryTree(): HistoryNode | null {
    return this.root;
  }

  /**
   * Get linear history (path from root to current)
   */
  getLinearHistory(): ICommand[] {
    const history: ICommand[] = [];
    let node = this.currentNode;
    while (node) {
      history.unshift(node.command);
      node = node.parent;
    }
    return history;
  }

  /**
   * Create a memory snapshot at current position
   */
  private createSnapshot(): void {
    if (!this.currentNode) return;
    const snapshot = this.store.getState();
    this.snapshots.set(this.currentNode.command.id, snapshot);
  }

  /**
   * Get snapshot for a command (if available)
   */
  getSnapshot(commandId: string): EditorState | undefined {
    return this.snapshots.get(commandId);
  }

  /**
   * Enforce memory limits by removing old branches
   */
  private enforceMemoryLimits(): void {
    // Strategy: Remove oldest branches first
    const branchScores = this.scoreAllBranches();
    branchScores.sort((a, b) => a.score - b.score);

    for (const { node } of branchScores) {
      if (this.currentMemoryUsage <= this.maxMemoryMB * 1024 * 1024) break;

      // Don't delete current branch
      if (this.isInCurrentPath(node)) continue;

      this.deleteBranch(node);
    }
  }

  /**
   * Score branches for deletion (lower score = delete first)
   * Score based on: recency, proximity to current
   */
  private scoreAllBranches(): { node: HistoryNode; score: number }[] {
    const scores: { node: HistoryNode; score: number }[] = [];
    const walkTree = (node: HistoryNode, depth: number) => {
      const recency = Date.now() - node.command.timestamp;
      const score = recency * depth; // Older and deeper = higher score for deletion
      scores.push({ node, score });
      for (const child of node.children) {
        walkTree(child, depth + 1);
      }
    };

    if (this.root) walkTree(this.root, 1);
    return scores;
  }

  /**
   * Check if node is in current execution path
   */
  private isInCurrentPath(node: HistoryNode): boolean {
    let current = this.currentNode;
    while (current) {
      if (current === node) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Delete a branch and all its children
   */
  private deleteBranch(node: HistoryNode): void {
    const memoryFreed = this.calculateBranchMemory(node);
    this.currentMemoryUsage -= memoryFreed;

    // Remove from parent's children
    if (node.parent) {
      const index = node.parent.children.indexOf(node);
      if (index > -1) {
        node.parent.children.splice(index, 1);
      }
    }

    // Remove snapshots
    this.snapshots.delete(node.command.id);
  }

  /**
   * Calculate total memory of a branch
   */
  private calculateBranchMemory(node: HistoryNode): number {
    let total = node.command.getMemorySize();
    for (const child of node.children) {
      total += this.calculateBranchMemory(child);
    }
    return total;
  }

  /**
   * Register command types for deserialization
   */
  private registerDefaultCommands(): void {
    this.commandRegistry.set('MoveOverlay', MoveOverlayCommand as any);
    this.commandRegistry.set('ResizeOverlay', ResizeOverlayCommand as any);
    this.commandRegistry.set('EditOverlayText', EditOverlayTextCommand as any);
    this.commandRegistry.set('AddOverlay', AddOverlayCommand as any);
    this.commandRegistry.set('DeleteOverlay', DeleteOverlayCommand as any);
    this.commandRegistry.set('Batch', BatchCommand as any);
  }

  /**
   * Serialize history to JSON for persistence
   */
  toJSON(): HistoryState {
    return {
      tree: this.serializeTree(this.root),
      currentPath: this.getLinearHistory().map(cmd => cmd.id),
      snapshots: Array.from(this.snapshots.entries()).map(([id, state]) => ({
        id,
        state,
        compressedSize: JSON.stringify(state).length, // Track compression opportunity
      })),
    };
  }

  /**
   * Recursively serialize tree structure
   */
  private serializeTree(node: HistoryNode | null): any {
    if (!node) return null;
    return {
      command: node.command.toJSON(),
      children: node.children.map(child => this.serializeTree(child)),
    };
  }

  /**
   * Deserialize history from JSON
   */
  fromJSON(data: HistoryState): void {
    // Reconstruct tree
    const buildTree = (data: any): HistoryNode | null => {
      if (!data) return null;

      const CommandClass = this.commandRegistry.get(data.command.type);
      if (!CommandClass) {
        console.warn(`Unknown command type: ${data.command.type}`);
        return null;
      }

      const command = new CommandClass(data.command.data, this.store);
      const node: HistoryNode = {
        command,
        children: data.children.map((child: any) => buildTree(child)).filter(Boolean),
      };

      // Set parent references
      for (const child of node.children) {
        child.parent = node;
      }

      return node;
    };

    this.root = buildTree(data.tree);

    // Set current node based on saved path
    let current = this.root;
    for (const cmdId of data.currentPath) {
      const next = current?.children.find(child => child.command.id === cmdId);
      if (next) current = next;
    }
    this.currentNode = current;

    // Restore snapshots
    for (const snap of data.snapshots) {
      this.snapshots.set(snap.id, snap.state);
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.root = null;
    this.currentNode = null;
    this.snapshots.clear();
    this.currentMemoryUsage = 0;
    this.commandsSinceSnapshot = 0;
  }

  /**
   * Get memory usage statistics
   */
  getStats(): {
    totalCommands: number;
    totalMemoryMB: number;
    snapshotCount: number;
    branchCount: number;
  } {
    const countNodes = (node: HistoryNode | null): number => {
      if (!node) return 0;
      let total = 1;
      for (const child of node.children) {
        total += countNodes(child);
      }
      return total;
    };

    const countBranches = (node: HistoryNode | null): number => {
      if (!node) return 0;
      let total = node.children.length;
      for (const child of node.children) {
        total += countBranches(child);
      }
      return total;
    };

    return {
      totalCommands: countNodes(this.root),
      totalMemoryMB: this.currentMemoryUsage / (1024 * 1024),
      snapshotCount: this.snapshots.size,
      branchCount: countBranches(this.root),
    };
  }
}
```

---

## 4. EditorStore (Zustand Integration)

### 4.1 Store Definition

```typescript
// /lib/store/editor-store.ts

import create from 'zustand';
import { HistoryManager } from '../undo-redo/history-manager';

export interface Overlay {
  id: string;
  type: 'text' | 'bubble' | 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize?: number;
  color?: string;
  stroke?: string;
  imageUrl?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  radius?: number;
}

export interface EditorState {
  // Page data
  pages: Array<{
    id: string;
    pageNumber: number;
    imageUrl: string;
  }>;
  currentPageIdx: number;
  overlays: Record<string, Overlay[]>;

  // Selection
  selected: { pageId: string; overlayId: string } | null;

  // History
  historyManager: HistoryManager;

  // Actions
  updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => void;
  addOverlay: (pageId: string, overlay: Overlay) => void;
  removeOverlay: (pageId: string, overlayId: string) => void;
  insertOverlay: (pageId: string, overlay: Overlay, index: number) => void;
  getOverlays: (pageId: string) => Overlay[];
  setSelected: (selection: { pageId: string; overlayId: string } | null) => void;
  getState: () => EditorState;
  undo: () => void;
  redo: (branchIndex?: number) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getRedoBranches: () => any[];
}

export const useEditorStore = create<EditorState>((set, get) => {
  const historyManager = new HistoryManager(get() as EditorState);

  return {
    pages: [],
    currentPageIdx: 0,
    overlays: {},
    selected: null,
    historyManager,

    updateOverlay: (pageId: string, overlayId: string, updates: Partial<Overlay>) => {
      set(state => ({
        overlays: {
          ...state.overlays,
          [pageId]: state.overlays[pageId].map(o =>
            o.id === overlayId ? { ...o, ...updates } : o
          ),
        },
      }));
    },

    addOverlay: (pageId: string, overlay: Overlay) => {
      set(state => ({
        overlays: {
          ...state.overlays,
          [pageId]: [...(state.overlays[pageId] || []), overlay],
        },
      }));
    },

    removeOverlay: (pageId: string, overlayId: string) => {
      set(state => ({
        overlays: {
          ...state.overlays,
          [pageId]: state.overlays[pageId].filter(o => o.id !== overlayId),
        },
      }));
    },

    insertOverlay: (pageId: string, overlay: Overlay, index: number) => {
      set(state => {
        const newOverlays = [...(state.overlays[pageId] || [])];
        newOverlays.splice(index, 0, overlay);
        return {
          overlays: {
            ...state.overlays,
            [pageId]: newOverlays,
          },
        };
      });
    },

    getOverlays: (pageId: string) => {
      return get().overlays[pageId] || [];
    },

    setSelected: (selection) => {
      set({ selected: selection });
    },

    getState: () => get(),

    undo: () => {
      get().historyManager.undo();
    },

    redo: (branchIndex = 0) => {
      get().historyManager.redo(branchIndex);
    },

    canUndo: () => get().historyManager.canUndo(),

    canRedo: () => get().historyManager.canRedo(),

    getRedoBranches: () => get().historyManager.getRedoBranches(),
  };
});
```

### 4.2 CommandExecutor Hook

```typescript
// /lib/hooks/useCommandExecutor.ts

import { useEditorStore } from '../store/editor-store';
import {
  MoveOverlayCommand,
  ResizeOverlayCommand,
  EditOverlayTextCommand,
  AddOverlayCommand,
  DeleteOverlayCommand,
} from '../undo-redo/commands';

export function useCommandExecutor() {
  const store = useEditorStore();

  return {
    moveOverlay: (pageId: string, overlayId: string, fromX: number, fromY: number, toX: number, toY: number) => {
      const command = new MoveOverlayCommand(
        { pageId, overlayId, fromX, fromY, toX, toY },
        store
      );
      store.historyManager.execute(command);
    },

    resizeOverlay: (pageId: string, overlayId: string, fromW: number, fromH: number, toW: number, toH: number) => {
      const command = new ResizeOverlayCommand(
        { pageId, overlayId, fromW, fromH, toW, toH },
        store
      );
      store.historyManager.execute(command);
    },

    editOverlayText: (pageId: string, overlayId: string, fromText: string, toText: string) => {
      const command = new EditOverlayTextCommand(
        { pageId, overlayId, fromText, toText },
        store
      );
      store.historyManager.execute(command);
    },

    addOverlay: (pageId: string, overlay: any) => {
      const command = new AddOverlayCommand(pageId, overlay, store);
      store.historyManager.execute(command);
    },

    deleteOverlay: (pageId: string, overlayId: string) => {
      const overlay = store.getOverlays(pageId).find(o => o.id === overlayId);
      if (!overlay) return;
      const command = new DeleteOverlayCommand(pageId, overlay, store);
      store.historyManager.execute(command);
    },
  };
}
```

---

## 5. Memory Management Strategy

### 5.1 Delta vs. Snapshot Strategy

```typescript
// /lib/undo-redo/memory-strategy.ts

export enum MemoryStrategy {
  /** Store full state snapshots (memory-heavy, fast recovery) */
  SNAPSHOT = 'snapshot',

  /** Store only delta/commands (memory-light, slower recovery) */
  DELTA = 'delta',

  /** Hybrid: delta with periodic snapshots */
  HYBRID = 'hybrid',
}

export class MemoryManager {
  private strategy: MemoryStrategy;
  private snapshotInterval: number;
  private maxHistorySizeMB: number;

  constructor(
    strategy: MemoryStrategy = MemoryStrategy.HYBRID,
    snapshotInterval: number = 20,
    maxHistorySizeMB: number = 50
  ) {
    this.strategy = strategy;
    this.snapshotInterval = snapshotInterval;
    this.maxHistorySizeMB = maxHistorySizeMB;
  }

  /**
   * Calculate if we should create a snapshot based on strategy
   */
  shouldCreateSnapshot(commandCount: number): boolean {
    switch (this.strategy) {
      case MemoryStrategy.SNAPSHOT:
        return true; // Always snapshot
      case MemoryStrategy.DELTA:
        return false; // Never snapshot
      case MemoryStrategy.HYBRID:
        return commandCount % this.snapshotInterval === 0;
    }
  }

  /**
   * Estimate state serialization size
   */
  estimateStateSize(state: any): number {
    return JSON.stringify(state).length;
  }

  /**
   * Check if we exceed memory limits
   */
  exceedsMemoryLimit(currentUsageMB: number): boolean {
    return currentUsageMB > this.maxHistorySizeMB;
  }

  /**
   * Strategy-specific recommendations for memory optimization
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.strategy === MemoryStrategy.SNAPSHOT) {
      recommendations.push(
        'Using SNAPSHOT strategy - best for fast undo/redo but high memory',
        'Consider switching to HYBRID for better memory usage'
      );
    } else if (this.strategy === MemoryStrategy.DELTA) {
      recommendations.push(
        'Using DELTA strategy - memory efficient but slower recovery',
        'If undo/redo feels slow, increase snapshot frequency'
      );
    } else {
      recommendations.push(
        'Using HYBRID strategy - balanced memory and performance',
        `Taking snapshot every ${this.snapshotInterval} commands`
      );
    }

    return recommendations;
  }
}
```

### 5.2 Memory Limits Configuration

```typescript
// Configuration for different scenarios

export const MEMORY_CONFIGS = {
  // Low-memory devices
  mobile: {
    maxHistorySizeMB: 20,
    snapshotInterval: 10,
    strategy: MemoryStrategy.DELTA,
  },

  // Standard desktop
  desktop: {
    maxHistorySizeMB: 50,
    snapshotInterval: 20,
    strategy: MemoryStrategy.HYBRID,
  },

  // High-memory professional workstations
  professional: {
    maxHistorySizeMB: 200,
    snapshotInterval: 50,
    strategy: MemoryStrategy.HYBRID,
  },

  // For large projects with many pages
  largeProject: {
    maxHistorySizeMB: 100,
    snapshotInterval: 30,
    strategy: MemoryStrategy.HYBRID,
  },
};
```

---

## 6. Persistence & Serialization

### 6.1 IndexedDB Storage

```typescript
// /lib/persistence/indexed-db-store.ts

export class ProjectStore {
  private dbName = 'MangaFusion';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for project metadata
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Store for history snapshots (per project)
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // Store for page data
        if (!db.objectStoreNames.contains('pages')) {
          const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
          pageStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }

  /**
   * Save project with full history
   */
  async saveProject(
    projectId: string,
    state: EditorState,
    history: HistoryState,
    metadata: any
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(
      ['projects', 'history', 'pages'],
      'readwrite'
    );

    // Save project metadata
    transaction
      .objectStore('projects')
      .put({
        id: projectId,
        ...metadata,
        lastModified: Date.now(),
        historyVersion: 1,
      });

    // Compress and save history
    const compressedHistory = await this.compressHistory(history);
    transaction
      .objectStore('history')
      .put({
        id: `history_${projectId}`,
        projectId,
        data: compressedHistory,
        size: compressedHistory.length,
        timestamp: Date.now(),
      });

    // Save page data
    for (const page of state.pages) {
      transaction
        .objectStore('pages')
        .put({
          ...page,
          projectId,
          overlays: state.overlays[page.id],
          lastModified: Date.now(),
        });
    }

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Load project with history
   */
  async loadProject(projectId: string): Promise<{
    state: EditorState;
    history: HistoryState;
    metadata: any;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const project = await this.getFromStore('projects', projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const historyData = await this.getFromStore('history', `history_${projectId}`);
    const history = historyData
      ? await this.decompressHistory(historyData.data)
      : { tree: null, currentPath: [], snapshots: [] };

    const pages = await this.getAllFromStore('pages', 'projectId', projectId);

    const state: EditorState = {
      pages: pages.map(p => ({
        id: p.id,
        pageNumber: p.pageNumber,
        imageUrl: p.imageUrl,
      })),
      overlays: pages.reduce((acc, p) => {
        acc[p.id] = p.overlays || [];
        return acc;
      }, {} as Record<string, Overlay[]>),
      currentPageIdx: 0,
      selected: null,
      historyManager: null as any,
    };

    return { state, history, metadata: project };
  }

  /**
   * Compress history using JSON + gzip (via compression API if available)
   */
  private async compressHistory(history: HistoryState): Promise<Uint8Array> {
    const json = JSON.stringify(history);

    // Use native compression if available (modern browsers)
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      writer.write(new TextEncoder().encode(json));
      writer.close();

      const chunks: Uint8Array[] = [];
      const reader = stream.readable.getReader();
      let result;
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }

      return new Uint8Array(
        chunks.reduce((acc, chunk) => [...acc, ...chunk], [])
      );
    }

    // Fallback: simple compression via removing whitespace
    return new TextEncoder().encode(json);
  }

  /**
   * Decompress history
   */
  private async decompressHistory(data: Uint8Array): Promise<HistoryState> {
    try {
      // Try to decompress if gzip
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        writer.write(data);
        writer.close();

        const chunks: Uint8Array[] = [];
        const reader = stream.readable.getReader();
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        const decompressed = new TextDecoder().decode(
          new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
        );
        return JSON.parse(decompressed);
      }
    } catch (e) {
      // Fallback
    }

    // Fallback: already plain text
    return JSON.parse(new TextDecoder().decode(data));
  }

  /**
   * Helper: get single item from store
   */
  private getFromStore(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const request = this.db
        .transaction([storeName])
        .objectStore(storeName)
        .get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Helper: get all items by index
   */
  private getAllFromStore(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const request = this.db
        .transaction([storeName])
        .objectStore(storeName)
        .index(indexName)
        .getAll(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Export project as downloadable file
   */
  async exportProject(projectId: string): Promise<Blob> {
    const { state, history, metadata } = await this.loadProject(projectId);

    const projectFile = {
      version: '1.0',
      metadata,
      state,
      history,
      exportedAt: new Date().toISOString(),
    };

    return new Blob([JSON.stringify(projectFile, null, 2)], {
      type: 'application/json',
    });
  }

  /**
   * Import project from file
   */
  async importProject(file: File): Promise<string> {
    const json = await file.text();
    const data = JSON.parse(json);

    const projectId = Math.random().toString(36).slice(2);
    await this.saveProject(projectId, data.state, data.history, data.metadata);

    return projectId;
  }
}
```

---

## 7. UI Integration

### 7.1 Updated Studio Editor with Undo/Redo

```typescript
// /pages/studio/[id].tsx (Updated)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useEditorStore } from '../../lib/store/editor-store';
import { useCommandExecutor } from '../../lib/hooks/useCommandExecutor';

export default function Studio() {
  const router = useRouter();
  const { id } = router.query;
  const executor = useCommandExecutor();
  const store = useEditorStore();

  // Local state for drag tracking
  const dragState = useRef<{
    overlayId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const resizeState = useRef<{
    overlayId: string;
    startW: number;
    startH: number;
    currentW: number;
    currentH: number;
  } | null>(null);

  const currentPage = useMemo(
    () => store.pages[store.currentPageIdx],
    [store.pages, store.currentPageIdx]
  );

  const currentOverlays = useMemo(
    () => (currentPage ? store.getOverlays(currentPage.id) : []),
    [currentPage, store.overlays]
  );

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (store.canUndo()) {
          store.undo();
        }
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (store.canRedo()) {
          store.redo();
        }
      }

      // Ctrl+Y or Cmd+Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (store.canRedo()) {
          store.redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  /**
   * Handle overlay drag start
   */
  const onDragStart = (overlayId: string, e: React.PointerEvent) => {
    const overlay = currentOverlays.find(o => o.id === overlayId);
    if (!overlay || !currentPage) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      overlayId,
      startX: overlay.x,
      startY: overlay.y,
      currentX: overlay.x,
      currentY: overlay.y,
    };
  };

  /**
   * Handle overlay drag move
   */
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragState.current || !currentPage) return;

    const movementX = (e as any).movementX || 0;
    const movementY = (e as any).movementY || 0;

    dragState.current.currentX += movementX;
    dragState.current.currentY += movementY;

    // Update UI immediately (optimistic)
    store.updateOverlay(currentPage.id, dragState.current.overlayId, {
      x: dragState.current.currentX,
      y: dragState.current.currentY,
    });
  };

  /**
   * Handle overlay drag end - record command
   */
  const onDragEnd = (e: React.PointerEvent) => {
    if (!dragState.current || !currentPage) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const state = dragState.current;

    // Only record command if position actually changed
    if (state.startX !== state.currentX || state.startY !== state.currentY) {
      executor.moveOverlay(
        currentPage.id,
        state.overlayId,
        state.startX,
        state.startY,
        state.currentX,
        state.currentY
      );
    }

    dragState.current = null;
  };

  /**
   * Handle overlay resize
   */
  const onResizeStart = (overlayId: string, e: React.PointerEvent) => {
    const overlay = currentOverlays.find(o => o.id === overlayId);
    if (!overlay || !currentPage) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = {
      overlayId,
      startW: overlay.w,
      startH: overlay.h,
      currentW: overlay.w,
      currentH: overlay.h,
    };
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeState.current || !currentPage) return;

    const movementX = (e as any).movementX || 0;
    const movementY = (e as any).movementY || 0;

    resizeState.current.currentW = Math.max(40, resizeState.current.currentW + movementX);
    resizeState.current.currentH = Math.max(30, resizeState.current.currentH + movementY);

    // Update UI immediately
    store.updateOverlay(currentPage.id, resizeState.current.overlayId, {
      w: resizeState.current.currentW,
      h: resizeState.current.currentH,
    });
  };

  const onResizeEnd = (e: React.PointerEvent) => {
    if (!resizeState.current || !currentPage) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const state = resizeState.current;

    // Record command if size changed
    if (state.startW !== state.currentW || state.startH !== state.currentH) {
      executor.resizeOverlay(
        currentPage.id,
        state.overlayId,
        state.startW,
        state.startH,
        state.currentW,
        state.currentH
      );
    }

    resizeState.current = null;
  };

  /**
   * Add overlay with command
   */
  const addOverlay = (type: string) => {
    if (!currentPage) return;

    const overlay = {
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

    executor.addOverlay(currentPage.id, overlay);
  };

  /**
   * Delete overlay with command
   */
  const deleteSelected = () => {
    if (!currentPage || !store.selected) return;
    executor.deleteOverlay(currentPage.id, store.selected.overlayId);
    store.setSelected(null);
  };

  return (
    <Layout title="Studio Editor - MangaFusion">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Toolbar */}
        <div className="border-b bg-white p-2 flex items-center gap-2">
          <button
            onClick={() => store.undo()}
            disabled={!store.canUndo()}
            className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-gray-100"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>

          {store.canRedo() && store.getRedoBranches().length > 1 ? (
            <div className="relative group">
              <button
                className="px-3 py-1 text-sm rounded border hover:bg-gray-100"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷ Redo ▼
              </button>
              <div className="absolute hidden group-hover:block bg-white border rounded shadow-lg z-10 min-w-40">
                {store.getRedoBranches().map((branch, idx) => (
                  <button
                    key={idx}
                    onClick={() => store.redo(idx)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {branch.command.description}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => store.redo()}
              disabled={!store.canRedo()}
              className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-gray-100"
              title="Redo (Ctrl+Shift+Z)"
            >
              ↷ Redo
            </button>
          )}

          <div className="border-l mx-2 h-6" />

          <button
            onClick={() => addOverlay('text')}
            className="px-3 py-1 text-sm rounded border hover:bg-gray-100"
          >
            + Text
          </button>

          <button
            onClick={() => addOverlay('bubble')}
            className="px-3 py-1 text-sm rounded border hover:bg-gray-100"
          >
            + Bubble
          </button>

          {store.selected && (
            <>
              <div className="border-l mx-2 h-6" />
              <button
                onClick={deleteSelected}
                className="px-3 py-1 text-sm rounded border hover:bg-red-100 text-red-600"
              >
                Delete
              </button>
            </>
          )}

          {/* History stats */}
          <div className="ml-auto text-xs text-gray-500">
            {(() => {
              const stats = store.historyManager.getStats();
              return `History: ${stats.totalCommands} cmds, ${stats.totalMemoryMB.toFixed(1)}MB`;
            })()}
          </div>
        </div>

        {/* Pages list */}
        <aside className="w-56 border-r bg-white p-3 overflow-y-auto">
          <h3 className="font-semibold mb-2">Pages ({store.pages.length})</h3>
          <div className="space-y-2">
            {store.pages.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => {}}
                className={`block w-full text-left text-sm rounded-lg border p-2 ${
                  idx === store.currentPageIdx
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Page {page.pageNumber}
              </button>
            ))}
          </div>
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
                className="absolute inset-0 w-full h-full object-contain"
                alt="page"
              />

              {currentOverlays.map(overlay => {
                const isSelected = store.selected?.overlayId === overlay.id;
                return (
                  <div
                    key={overlay.id}
                    className={`absolute group ${
                      isSelected ? 'ring-2 ring-purple-500' : ''
                    }`}
                    style={{
                      left: overlay.x,
                      top: overlay.y,
                      width: overlay.w,
                      height: overlay.h,
                    }}
                    onClick={() =>
                      store.setSelected({
                        pageId: currentPage.id,
                        overlayId: overlay.id,
                      })
                    }
                    onPointerDown={(e) => onDragStart(overlay.id, e)}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                  >
                    {overlay.type === 'image' && overlay.imageUrl ? (
                      <img
                        src={overlay.imageUrl}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div
                        className={`w-full h-full ${
                          overlay.type === 'bubble' ? 'border-4' : ''
                        }`}
                        style={{
                          color: overlay.color,
                          borderColor: overlay.stroke,
                          backgroundColor:
                            overlay.type === 'bubble' ? 'white' : 'transparent',
                          borderRadius: overlay.radius ?? 0,
                          fontFamily: overlay.fontFamily,
                        }}
                      >
                        <div
                          className="p-2"
                          style={{
                            fontSize: overlay.fontSize,
                            textAlign: overlay.align || 'center',
                          }}
                        >
                          {overlay.text}
                        </div>
                      </div>
                    )}

                    {/* Resize handles */}
                    {isSelected && (
                      <>
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 rounded-sm cursor-nwse-resize"
                          onPointerDown={(e) => onResizeStart(overlay.id, e)}
                          onPointerMove={onResizeMove}
                          onPointerUp={onResizeEnd}
                        />
                        <div
                          className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-sm cursor-nesw-resize"
                          onPointerDown={(e) => onResizeStart(overlay.id, e)}
                          onPointerMove={onResizeMove}
                          onPointerUp={onResizeEnd}
                        />
                        <div
                          className="absolute bottom-0 left-0 w-3 h-3 bg-purple-500 rounded-sm cursor-nesw-resize"
                          onPointerDown={(e) => onResizeStart(overlay.id, e)}
                          onPointerMove={onResizeMove}
                          onPointerUp={onResizeEnd}
                        />
                        <div
                          className="absolute top-0 left-0 w-3 h-3 bg-purple-500 rounded-sm cursor-nwse-resize"
                          onPointerDown={(e) => onResizeStart(overlay.id, e)}
                          onPointerMove={onResizeMove}
                          onPointerUp={onResizeEnd}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Properties panel */}
        <aside className="w-64 border-l bg-white p-4 space-y-4 overflow-y-auto">
          <h3 className="font-semibold">Properties</h3>

          {store.selected ? (
            <>
              <div>
                <label className="text-sm font-medium">Overlay Info</label>
                <p className="text-xs text-gray-500 mt-1">
                  {store.selected.overlayId}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select an overlay to edit</p>
          )}
        </aside>
      </div>
    </Layout>
  );
}
```

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

```typescript
// /lib/undo-redo/performance.ts

export class PerformanceOptimizer {
  /**
   * Batch multiple commands into a single undo step
   * Useful for operations that modify multiple overlays
   */
  static createBatch(
    description: string,
    commands: ICommand[],
    store: EditorStore
  ): BatchCommand {
    return new BatchCommand(description, commands, store);
  }

  /**
   * Debounce command creation (e.g., for drag operations)
   * Groups rapid changes into a single command
   */
  static debounceCommand<T extends ICommand>(
    createCommand: () => T,
    delay: number = 500
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastCommand: T | null = null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      const newCommand = createCommand();
      lastCommand = newCommand;

      timeoutId = setTimeout(() => {
        if (lastCommand) {
          // Execute the debounced command
          lastCommand.execute();
        }
      }, delay);
    };
  }

  /**
   * Throttle command execution
   * Limits how frequently commands are processed
   */
  static throttleCommand<T extends ICommand>(
    callback: (cmd: T) => void,
    interval: number = 16 // ~60fps
  ): (cmd: T) => void {
    let lastExecutionTime = 0;

    return (cmd: T) => {
      const now = Date.now();
      if (now - lastExecutionTime >= interval) {
        callback(cmd);
        lastExecutionTime = now;
      }
    };
  }

  /**
   * Estimate canvas rendering performance impact
   */
  static estimateRenderPerformance(overlayCount: number): {
    estimatedFPS: number;
    performance: 'excellent' | 'good' | 'acceptable' | 'poor';
  } {
    // Rough estimation based on typical browser canvas performance
    const estimatedFPS = Math.max(1, 60 - overlayCount * 0.5);

    let performance: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (estimatedFPS >= 50) performance = 'excellent';
    else if (estimatedFPS >= 40) performance = 'good';
    else if (estimatedFPS >= 20) performance = 'acceptable';
    else performance = 'poor';

    return { estimatedFPS, performance };
  }

  /**
   * Recommend memory optimization based on history size
   */
  static recommendMemoryOptimization(stats: {
    totalCommands: number;
    totalMemoryMB: number;
    snapshotCount: number;
    branchCount: number;
  }): string[] {
    const recommendations: string[] = [];

    if (stats.totalMemoryMB > 100) {
      recommendations.push('History is using significant memory. Consider clearing old branches.');
    }

    if (stats.branchCount > 10) {
      recommendations.push(
        'You have many undo branches. Consider consolidating or exporting non-essential branches.'
      );
    }

    if (stats.snapshotCount === 0 && stats.totalCommands > 50) {
      recommendations.push('No snapshots created yet. Consider enabling periodic snapshots for faster undo/redo.');
    }

    return recommendations;
  }
}
```

### 8.2 Rendering Optimization

```typescript
// Component-level optimization for large histories

export function OptimizedOverlay({ overlay, isSelected, ...props }: any) {
  // Memoize to prevent unnecessary re-renders
  return React.memo(() => (
    <div
      className={`absolute ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      style={{
        left: overlay.x,
        top: overlay.y,
        width: overlay.w,
        height: overlay.h,
        willChange: isSelected ? 'transform' : 'auto',
      }}
      {...props}
    >
      {/* Overlay content */}
    </div>
  ), [overlay.x, overlay.y, overlay.w, overlay.h, isSelected]);
}
```

---

## 9. Implementation Checklist

- [ ] Create command interface and base class
- [ ] Implement concrete commands (Move, Resize, Edit, Add, Delete)
- [ ] Implement HistoryManager with undo tree support
- [ ] Integrate Zustand store with history tracking
- [ ] Implement memory manager with delta/snapshot strategy
- [ ] Implement IndexedDB persistence layer
- [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- [ ] Add UI for undo/redo buttons and branch selection
- [ ] Implement command debouncing for drag operations
- [ ] Add history visualization (optional)
- [ ] Add compression for large histories
- [ ] Performance testing with large projects
- [ ] Add error recovery and graceful degradation

---

## 10. Testing Strategy

```typescript
// /tests/undo-redo.test.ts

import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../lib/undo-redo/history-manager';
import { MoveOverlayCommand } from '../lib/undo-redo/commands/MoveOverlayCommand';

describe('Undo/Redo System', () => {
  it('should execute and undo commands', () => {
    // Test basic undo/redo
  });

  it('should create branching history on undo then new action', () => {
    // Test undo tree creation
  });

  it('should merge consecutive similar commands', () => {
    // Test command merging
  });

  it('should enforce memory limits', () => {
    // Test memory management
  });

  it('should serialize and deserialize history', () => {
    // Test persistence
  });

  it('should handle large projects efficiently', () => {
    // Test performance
  });
});
```

---

## 11. References & Resources

- **Command Pattern**: https://refactoring.guru/design-patterns/command
- **Undo/Redo in Games**: https://gdcvault.com/play/1021865/Undo-Redo-and-Replay-in-Games
- **Immer.js**: https://immerjs.github.io/immer/
- **Zustand**: https://github.com/pmndrs/zustand
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Web Compression**: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream


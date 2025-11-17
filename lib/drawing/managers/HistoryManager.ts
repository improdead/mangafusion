/**
 * History Manager
 * Implements undo/redo functionality using the Command Pattern
 */

import { CanvasCommand, CanvasHistory } from '../types';

export class HistoryManager {
  private history: CanvasHistory;

  constructor(maxHistorySize: number = 50) {
    this.history = {
      past: [],
      future: [],
      maxHistorySize,
    };
  }

  /**
   * Add a command to the history
   */
  addCommand(command: CanvasCommand): void {
    // Add to past history
    this.history.past.push(command);

    // Clear future history when a new command is added
    this.history.future = [];

    // Limit history size
    if (this.history.past.length > this.history.maxHistorySize) {
      this.history.past.shift();
    }
  }

  /**
   * Undo the last command
   */
  undo(): void {
    const command = this.history.past.pop();
    if (!command) return;

    // Execute undo
    command.undo();

    // Move to future history
    this.history.future.push(command);
  }

  /**
   * Redo the last undone command
   */
  redo(): void {
    const command = this.history.future.pop();
    if (!command) return;

    // Execute redo
    command.execute();

    // Move back to past history
    this.history.past.push(command);
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.history.future.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history.past = [];
    this.history.future = [];
  }

  /**
   * Get history statistics
   */
  getStats() {
    return {
      pastCount: this.history.past.length,
      futureCount: this.history.future.length,
      maxSize: this.history.maxHistorySize,
    };
  }
}

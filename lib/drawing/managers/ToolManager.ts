/**
 * Tool Manager
 * Manages drawing tools and tool-specific state
 */

import { DrawingTool, BrushOptions } from '../types';

export class ToolManager {
  private currentTool: DrawingTool = DrawingTool.SELECT;
  private brushOptions: BrushOptions = {
    width: 5,
    color: '#000000',
    opacity: 1.0,
  };

  /**
   * Set the current drawing tool
   */
  setCurrentTool(tool: DrawingTool): void {
    this.currentTool = tool;
  }

  /**
   * Get the current drawing tool
   */
  getCurrentTool(): DrawingTool {
    return this.currentTool;
  }

  /**
   * Set brush options
   */
  setBrushOptions(options: Partial<BrushOptions>): void {
    this.brushOptions = {
      ...this.brushOptions,
      ...options,
    };
  }

  /**
   * Get brush options
   */
  getBrushOptions(): BrushOptions {
    return { ...this.brushOptions };
  }

  /**
   * Reset to default tool
   */
  reset(): void {
    this.currentTool = DrawingTool.SELECT;
    this.brushOptions = {
      width: 5,
      color: '#000000',
      opacity: 1.0,
    };
  }
}

/**
 * Canvas Manager
 * Manages the Fabric.js canvas lifecycle and core operations
 */

import { fabric } from 'fabric';
import { CanvasConfig, CanvasState, DrawingTool, BrushOptions } from '../types';
import { HistoryManager } from './HistoryManager';
import { ToolManager } from './ToolManager';

export class CanvasManager {
  private canvas: fabric.Canvas | null = null;
  private config: CanvasConfig;
  private historyManager: HistoryManager;
  private toolManager: ToolManager;
  private isDrawing: boolean = false;
  private lastPosX: number = 0;
  private lastPosY: number = 0;

  constructor(config: Partial<CanvasConfig> = {}) {
    this.config = {
      width: config.width || 1024,
      height: config.height || 1024,
      backgroundColor: config.backgroundColor || '#ffffff',
      enableGrid: config.enableGrid ?? false,
      gridSize: config.gridSize || 20,
      enableSnapToGrid: config.enableSnapToGrid ?? false,
      maxHistorySize: config.maxHistorySize || 50,
    };

    this.historyManager = new HistoryManager(this.config.maxHistorySize);
    this.toolManager = new ToolManager();
  }

  /**
   * Initialize the Fabric.js canvas
   */
  initialize(canvasElement: HTMLCanvasElement): fabric.Canvas {
    if (this.canvas) {
      this.canvas.dispose();
    }

    this.canvas = new fabric.Canvas(canvasElement, {
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      isDrawingMode: false,
      selection: true,
      preserveObjectStacking: true,
    });

    this.setupEventListeners();
    return this.canvas;
  }

  /**
   * Set up canvas event listeners
   */
  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Object modification events for undo/redo
    this.canvas.on('object:added', (e) => {
      if (!e.target) return;
      this.historyManager.addCommand({
        type: 'add',
        execute: () => this.canvas?.add(e.target!),
        undo: () => this.canvas?.remove(e.target!),
        timestamp: Date.now(),
      });
    });

    this.canvas.on('object:modified', (e) => {
      if (!e.target) return;
      const originalState = e.target.toObject();
      this.historyManager.addCommand({
        type: 'modify',
        execute: () => {}, // Already executed
        undo: () => {
          e.target?.set(originalState);
          this.canvas?.renderAll();
        },
        timestamp: Date.now(),
      });
    });

    this.canvas.on('object:removed', (e) => {
      if (!e.target) return;
      this.historyManager.addCommand({
        type: 'remove',
        execute: () => this.canvas?.remove(e.target!),
        undo: () => this.canvas?.add(e.target!),
        timestamp: Date.now(),
      });
    });

    // Mouse events for drawing
    this.canvas.on('mouse:down', (e) => this.handleMouseDown(e));
    this.canvas.on('mouse:move', (e) => this.handleMouseMove(e));
    this.canvas.on('mouse:up', (e) => this.handleMouseUp(e));
  }

  /**
   * Handle mouse down event
   */
  private handleMouseDown(e: fabric.IEvent): void {
    if (!this.canvas) return;
    this.isDrawing = true;
    const pointer = this.canvas.getPointer(e.e);
    this.lastPosX = pointer.x;
    this.lastPosY = pointer.y;
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(e: fabric.IEvent): void {
    if (!this.canvas || !this.isDrawing) return;
    const pointer = this.canvas.getPointer(e.e);
    this.lastPosX = pointer.x;
    this.lastPosY = pointer.y;
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(e: fabric.IEvent): void {
    this.isDrawing = false;
  }

  /**
   * Set the current drawing tool
   */
  setTool(tool: DrawingTool): void {
    if (!this.canvas) return;

    // Disable drawing mode for all tools
    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;

    switch (tool) {
      case DrawingTool.BRUSH:
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        break;

      case DrawingTool.ERASER:
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas);
        break;

      case DrawingTool.SELECT:
        this.canvas.selection = true;
        break;

      case DrawingTool.PAN:
        // Pan tool implementation
        break;

      default:
        break;
    }

    this.toolManager.setCurrentTool(tool);
  }

  /**
   * Set brush options
   */
  setBrushOptions(options: Partial<BrushOptions>): void {
    if (!this.canvas || !this.canvas.freeDrawingBrush) return;

    if (options.width !== undefined) {
      this.canvas.freeDrawingBrush.width = options.width;
    }

    if (options.color !== undefined) {
      this.canvas.freeDrawingBrush.color = options.color;
    }
  }

  /**
   * Add a shape to the canvas
   */
  addShape(type: 'rectangle' | 'circle' | 'line', options: any = {}): void {
    if (!this.canvas) return;

    let shape: fabric.Object | null = null;

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: options.left || 100,
          top: options.top || 100,
          width: options.width || 100,
          height: options.height || 100,
          fill: options.fill || 'transparent',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
        });
        break;

      case 'circle':
        shape = new fabric.Circle({
          left: options.left || 100,
          top: options.top || 100,
          radius: options.radius || 50,
          fill: options.fill || 'transparent',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
        });
        break;

      case 'line':
        shape = new fabric.Line(
          [
            options.x1 || 50,
            options.y1 || 50,
            options.x2 || 200,
            options.y2 || 200,
          ],
          {
            stroke: options.stroke || '#000000',
            strokeWidth: options.strokeWidth || 2,
          }
        );
        break;
    }

    if (shape) {
      this.canvas.add(shape);
      this.canvas.setActiveObject(shape);
      this.canvas.renderAll();
    }
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    if (!this.canvas) return;
    this.canvas.clear();
    this.canvas.backgroundColor = this.config.backgroundColor;
    this.canvas.renderAll();
  }

  /**
   * Undo the last action
   */
  undo(): void {
    this.historyManager.undo();
  }

  /**
   * Redo the last undone action
   */
  redo(): void {
    this.historyManager.redo();
  }

  /**
   * Get the current canvas state
   */
  getState(): CanvasState {
    if (!this.canvas) {
      return {
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        objects: [],
        version: 1,
      };
    }

    return {
      width: this.canvas.width || this.config.width,
      height: this.canvas.height || this.config.height,
      backgroundColor: this.canvas.backgroundColor as string || this.config.backgroundColor,
      objects: this.canvas.getObjects(),
      version: 1,
    };
  }

  /**
   * Load canvas state from JSON
   */
  loadFromJSON(json: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas) {
        reject(new Error('Canvas not initialized'));
        return;
      }

      this.canvas.loadFromJSON(json, () => {
        this.canvas?.renderAll();
        resolve();
      });
    });
  }

  /**
   * Export canvas to JSON
   */
  toJSON(): any {
    if (!this.canvas) return null;
    return this.canvas.toJSON();
  }

  /**
   * Export canvas to data URL
   */
  toDataURL(format: 'png' | 'jpeg' = 'png', quality: number = 1.0): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({
      format,
      quality,
    });
  }

  /**
   * Dispose the canvas
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }

  /**
   * Get the Fabric.js canvas instance
   */
  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }
}

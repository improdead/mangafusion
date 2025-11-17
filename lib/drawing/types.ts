/**
 * Canvas Drawing Types
 * Type definitions for the canvas drawing feature
 */

import { fabric } from 'fabric';

export enum DrawingTool {
  BRUSH = 'brush',
  ERASER = 'eraser',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line',
  SELECT = 'select',
  PAN = 'pan',
}

export interface BrushOptions {
  width: number;
  color: string;
  opacity: number;
}

export interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  objects: any[]; // Fabric.js objects
  version: number;
}

export interface LayerNode {
  id: string;
  type: 'layer' | 'group';
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode: string;
  parentId: string | null;
  childIds: string[];
  fabricObject?: fabric.Object;
  zIndex: number;
}

export interface CanvasCommand {
  type: string;
  execute: () => void;
  undo: () => void;
  timestamp: number;
}

export interface CanvasHistory {
  past: CanvasCommand[];
  future: CanvasCommand[];
  maxHistorySize: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  enableGrid: boolean;
  gridSize: number;
  enableSnapToGrid: boolean;
  maxHistorySize: number;
}

export interface CanvasData {
  id?: string;
  pageId: string;
  canvasData: any; // Serialized Fabric.js JSON
  thumbnailUrl?: string;
  width: number;
  height: number;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefinementOptions {
  style: string;
  strength: number; // 0-1
  controlnetType: 'scribble' | 'canny' | 'depth' | 'hed';
  promptDescription?: string;
  aiProvider: 'segmind' | 'replicate' | 'gemini';
}

export interface RefinementResult {
  id: string;
  canvasId: string;
  pageId: string;
  originalSketchUrl?: string;
  refinedImageUrl: string;
  promptDescription?: string;
  style: string;
  strength: number;
  controlnetType: string;
  aiProvider: string;
  processingTimeMs?: number;
  qualityScore?: number;
  userAccepted: boolean;
  isCurrentVersion: boolean;
  createdAt: Date;
}

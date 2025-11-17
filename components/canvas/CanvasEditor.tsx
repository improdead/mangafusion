/**
 * Canvas Editor Component
 * Main React component for the drawing canvas feature
 */

import React, { useEffect, useRef, useState } from 'react';
import { CanvasManager } from '../../lib/drawing/managers/CanvasManager';
import { DrawingTool } from '../../lib/drawing/types';

interface CanvasEditorProps {
  pageId: string;
  width?: number;
  height?: number;
  initialData?: any;
  onSave?: (data: any) => void;
  onRefine?: (imageData: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  pageId,
  width = 1024,
  height = 1024,
  initialData,
  onSave,
  onRefine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>(DrawingTool.BRUSH);
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new CanvasManager({
      width,
      height,
      backgroundColor: '#ffffff',
      maxHistorySize: 50,
    });

    manager.initialize(canvasRef.current);
    managerRef.current = manager;

    // Load initial data if provided
    if (initialData) {
      manager.loadFromJSON(initialData);
    }

    return () => {
      manager.dispose();
    };
  }, [width, height]);

  // Handle tool change
  const handleToolChange = (tool: DrawingTool) => {
    if (!managerRef.current) return;
    setCurrentTool(tool);
    managerRef.current.setTool(tool);
  };

  // Handle brush size change
  const handleBrushSizeChange = (size: number) => {
    if (!managerRef.current) return;
    setBrushSize(size);
    managerRef.current.setBrushOptions({ width: size });
  };

  // Handle brush color change
  const handleBrushColorChange = (color: string) => {
    if (!managerRef.current) return;
    setBrushColor(color);
    managerRef.current.setBrushOptions({ color });
  };

  // Handle undo
  const handleUndo = () => {
    if (!managerRef.current) return;
    managerRef.current.undo();
  };

  // Handle redo
  const handleRedo = () => {
    if (!managerRef.current) return;
    managerRef.current.redo();
  };

  // Handle clear canvas
  const handleClear = () => {
    if (!managerRef.current) return;
    if (confirm('Are you sure you want to clear the canvas?')) {
      managerRef.current.clear();
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!managerRef.current || !onSave) return;

    const canvasData = managerRef.current.toJSON();
    const thumbnail = managerRef.current.toDataURL('png', 0.5);

    onSave({
      pageId,
      canvasData,
      thumbnailUrl: thumbnail,
      width,
      height,
    });
  };

  // Handle refine (sketch to manga)
  const handleRefine = () => {
    if (!managerRef.current || !onRefine) return;

    const imageData = managerRef.current.toDataURL('png', 1.0);
    onRefine(imageData);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-300">
        {/* Tool buttons */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => handleToolChange(DrawingTool.SELECT)}
            className={`px-3 py-2 rounded ${
              currentTool === DrawingTool.SELECT
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Select (V)"
          >
            <span>✋</span>
          </button>
          <button
            onClick={() => handleToolChange(DrawingTool.BRUSH)}
            className={`px-3 py-2 rounded ${
              currentTool === DrawingTool.BRUSH
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Brush (B)"
          >
            <span>🖌️</span>
          </button>
          <button
            onClick={() => handleToolChange(DrawingTool.ERASER)}
            className={`px-3 py-2 rounded ${
              currentTool === DrawingTool.ERASER
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Eraser (E)"
          >
            <span>🧹</span>
          </button>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600 w-8">{brushSize}</span>
        </div>

        {/* Brush color */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => handleBrushColorChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={handleRefine}
            className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600"
          >
            Refine to Manga
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="border-2 border-gray-400 shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-300 text-sm text-gray-600">
        <div>
          Tool: <span className="font-medium">{currentTool}</span>
        </div>
        <div>
          Page ID: <span className="font-medium">{pageId}</span>
        </div>
        <div>
          Canvas: {width} × {height}px
        </div>
      </div>
    </div>
  );
};

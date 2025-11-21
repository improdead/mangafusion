# Color Picker & Palette UI - React Implementation Guide

This document provides ready-to-use React component code for implementing the color management system in MangaFusion Studio.

---

## 1. Core Color Utilities

### 1.1 Color Class (TypeScript)

```typescript
// lib/color/Color.ts

export interface HSV {
  h: number;  // 0-360 degrees
  s: number;  // 0-100 percent
  v: number;  // 0-100 percent
}

export interface RGB {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
  a?: number; // 0-1 (optional alpha)
}

export class Color {
  private hex: string;
  private alpha: number;

  constructor(hex: string, alpha: number = 1) {
    this.hex = this.normalizeHex(hex);
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  static fromHex(hex: string, alpha: number = 1): Color {
    return new Color(hex, alpha);
  }

  static fromRGB(r: number, g: number, b: number, a: number = 1): Color {
    const hex = '#' + [r, g, b]
      .map(x => Math.round(x).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return new Color(hex, a);
  }

  static fromHSV(h: number, s: number, v: number, a: number = 1): Color {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = (v / 100) - c;

    let r: number, g: number, b: number;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return Color.fromRGB(r, g, b, a);
  }

  private normalizeHex(hex: string): string {
    let h = hex.replace('#', '').toUpperCase();
    if (h.length === 3) {
      h = h.split('').map(x => x + x).join('');
    }
    if (h.length === 8) {
      this.alpha = parseInt(h.slice(6), 16) / 255;
      h = h.slice(0, 6);
    }
    return '#' + h;
  }

  toHex(): string {
    return this.hex;
  }

  toHexAlpha(): string {
    const alpha = Math.round(this.alpha * 255).toString(16).padStart(2, '0');
    return this.hex + alpha;
  }

  toRGB(): RGB {
    const r = parseInt(this.hex.slice(1, 3), 16);
    const g = parseInt(this.hex.slice(3, 5), 16);
    const b = parseInt(this.hex.slice(5, 7), 16);
    return { r, g, b, a: this.alpha };
  }

  toHSV(): HSV {
    const rgb = this.toRGB();
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / delta + 2) * 60;
      else h = ((r - g) / delta + 4) * 60;
    }

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
  }

  toCSS(): string {
    if (this.alpha === 1) {
      return this.hex;
    }
    const rgb = this.toRGB();
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha})`;
  }

  clone(): Color {
    return new Color(this.hex, this.alpha);
  }

  setAlpha(alpha: number): Color {
    return new Color(this.hex, alpha);
  }

  getAlpha(): number {
    return this.alpha;
  }

  getLuminance(): number {
    const rgb = this.toRGB();
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}
```

### 1.2 Color Validation

```typescript
// lib/color/colorValidation.ts

export interface ColorAccessibility {
  luminance: number;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'Fail';
}

export function getContrastRatio(color1: Color, color2: Color): number {
  const l1 = color1.getLuminance();
  const l2 = color2.getLuminance();
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkAccessibility(
  foreground: Color,
  background: Color = Color.fromHex('#FFFFFF')
): ColorAccessibility {
  const contrastRatio = getContrastRatio(foreground, background);

  return {
    luminance: foreground.getLuminance(),
    contrastRatio,
    wcagLevel: contrastRatio >= 7 ? 'AAA' : contrastRatio >= 4.5 ? 'AA' : 'Fail',
  };
}

export function toGrayscale(color: Color): Color {
  const rgb = color.toRGB();
  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return Color.fromRGB(gray, gray, gray, color.getAlpha());
}
```

---

## 2. HSV Color Picker Component

### 2.1 Color Picker Canvas

```typescript
// components/ColorPicker/HSVColorPicker.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Color, HSV, RGB } from '../../lib/color/Color';

interface HSVColorPickerProps {
  color: Color;
  onChange: (color: Color) => void;
}

const HSVColorPicker: React.FC<HSVColorPickerProps> = ({ color, onChange }) => {
  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const hsv = color.toHSV();

  // Draw saturation-value 2D picker
  useEffect(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create gradient for hue
    const hueColor = Color.fromHSV(hsv.h, 100, 100);
    const hueRGB = hueColor.toRGB();

    // Draw saturation gradient (left to right)
    for (let x = 0; x < width; x++) {
      const saturation = (x / width) * 100;

      // Draw value gradient (top to bottom)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `hsl(${hsv.h}, ${saturation}%, 100%)`);
      gradient.addColorStop(1, `hsl(${hsv.h}, ${saturation}%, 0%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 1, height);
    }

    // Draw selection circle
    const x = (hsv.s / 100) * width;
    const y = ((100 - hsv.v) / 100) * height;

    ctx.strokeStyle = hsv.v > 50 ? '#000' : '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, [hsv.h]);

  // Draw hue slider
  useEffect(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create hue gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 30) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw selection indicator
    const hueX = (hsv.h / 360) * width;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hueX - 5, -2, 10, height + 4);
  }, [hsv.h]);

  const handleSVCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = Math.max(0, Math.min(100, (x / canvas.width) * 100));
    const v = Math.max(0, Math.min(100, 100 - (y / canvas.height) * 100));

    const newColor = Color.fromHSV(hsv.h, s, v, color.getAlpha());
    onChange(newColor);
  };

  const handleHueCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const h = Math.max(0, Math.min(360, (x / canvas.width) * 360));

    const newColor = Color.fromHSV(h, hsv.s, hsv.v, color.getAlpha());
    onChange(newColor);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Saturation-Value Picker */}
      <div>
        <label className="text-xs font-semibold text-gray-600">Hue & Value</label>
        <canvas
          ref={svCanvasRef}
          width={200}
          height={200}
          className="w-full border border-gray-300 rounded cursor-crosshair"
          onClick={handleSVCanvasClick}
          onMouseDown={() => setIsDraggingSV(true)}
          onMouseUp={() => setIsDraggingSV(false)}
          onMouseMove={(e) => {
            if (!isDraggingSV) return;
            handleSVCanvasClick(e as any);
          }}
          onMouseLeave={() => setIsDraggingSV(false)}
        />
      </div>

      {/* Hue Slider */}
      <div>
        <label className="text-xs font-semibold text-gray-600">Hue</label>
        <canvas
          ref={hueCanvasRef}
          width={200}
          height={20}
          className="w-full border border-gray-300 rounded cursor-pointer"
          onClick={handleHueCanvasClick}
          onMouseDown={() => setIsDraggingHue(true)}
          onMouseUp={() => setIsDraggingHue(false)}
          onMouseMove={(e) => {
            if (!isDraggingHue) return;
            handleHueCanvasClick(e as any);
          }}
          onMouseLeave={() => setIsDraggingHue(false)}
        />
      </div>
    </div>
  );
};

export default HSVColorPicker;
```

### 2.2 Color Input Fields

```typescript
// components/ColorPicker/ColorInputs.tsx

import React from 'react';
import { Color, HSV, RGB } from '../../lib/color/Color';

interface ColorInputsProps {
  color: Color;
  mode: 'hex' | 'rgb' | 'hsv';
  onModeChange: (mode: 'hex' | 'rgb' | 'hsv') => void;
  onChange: (color: Color) => void;
}

const ColorInputs: React.FC<ColorInputsProps> = ({ color, mode, onModeChange, onChange }) => {
  const hex = color.toHex();
  const rgb = color.toRGB();
  const hsv = color.toHSV();
  const alpha = Math.round(color.getAlpha() * 100);

  const handleHexChange = (value: string) => {
    try {
      const newColor = Color.fromHex(value, color.getAlpha());
      onChange(newColor);
    } catch (e) {
      // Validation error, ignore
    }
  };

  const handleRGBChange = (key: keyof RGB, value: number) => {
    const newColor = Color.fromRGB(
      key === 'r' ? value : rgb.r,
      key === 'g' ? value : rgb.g,
      key === 'b' ? value : rgb.b,
      color.getAlpha()
    );
    onChange(newColor);
  };

  const handleHSVChange = (key: keyof HSV, value: number) => {
    const newColor = Color.fromHSV(
      key === 'h' ? value : hsv.h,
      key === 's' ? value : hsv.s,
      key === 'v' ? value : hsv.v,
      color.getAlpha()
    );
    onChange(newColor);
  };

  const handleAlphaChange = (value: number) => {
    onChange(color.setAlpha(value / 100));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2 border-b">
        {(['hex', 'rgb', 'hsv'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-2 text-sm font-medium transition ${
              mode === m
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Hex Mode */}
      {mode === 'hex' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Hex</label>
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
            placeholder="#000000"
          />
        </div>
      )}

      {/* RGB Mode */}
      {mode === 'rgb' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">RGB</label>
          <div className="grid grid-cols-3 gap-2">
            {['R', 'G', 'B'].map((label, idx) => (
              <div key={label}>
                <label className="text-xs text-gray-500">{label}</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={[rgb.r, rgb.g, rgb.b][idx]}
                  onChange={(e) =>
                    handleRGBChange((['r', 'g', 'b'][idx] as keyof RGB), parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HSV Mode */}
      {mode === 'hsv' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">HSV</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500">Hue (0-360°)</label>
              <input
                type="number"
                min="0"
                max="360"
                value={hsv.h}
                onChange={(e) => handleHSVChange('h', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Saturation (0-100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={hsv.s}
                onChange={(e) => handleHSVChange('s', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Value (0-100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={hsv.v}
                onChange={(e) => handleHSVChange('v', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Opacity */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-600">Opacity</label>
          <span className="text-xs text-gray-500">{alpha}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={alpha}
          onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ColorInputs;
```

---

## 3. Color Palette Components

### 3.1 Screentone Palette

```typescript
// components/ColorPicker/ScreentonePalette.tsx

import React from 'react';
import { Color } from '../../lib/color/Color';

interface ScreentonePreset {
  name: string;
  hex: string;
  opacity: number;
}

interface ScreentonePaletteProps {
  onSelectColor: (color: Color, name: string) => void;
}

const MANGA_SCREENTONES: ScreentonePreset[] = [
  { name: '10%', hex: '#E6E6E6', opacity: 90 },
  { name: '20%', hex: '#CCCCCC', opacity: 80 },
  { name: '30%', hex: '#B3B3B3', opacity: 70 },
  { name: '40%', hex: '#999999', opacity: 60 },
  { name: '50%', hex: '#808080', opacity: 50 },
  { name: '60%', hex: '#666666', opacity: 40 },
  { name: '70%', hex: '#4D4D4D', opacity: 30 },
  { name: '80%', hex: '#333333', opacity: 20 },
  { name: '90%', hex: '#1A1A1A', opacity: 10 },
  { name: '100%', hex: '#000000', opacity: 0 },
];

const ScreentonePalette: React.FC<ScreentonePaletteProps> = ({ onSelectColor }) => {
  return (
    <div className="p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Manga Screentones</h4>

      <div className="grid grid-cols-5 gap-2">
        {MANGA_SCREENTONES.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelectColor(Color.fromHex(preset.hex), preset.name)}
            className="group relative"
            title={preset.name}
          >
            <div
              className="w-full aspect-square rounded border border-gray-300 hover:border-purple-500 transition hover:shadow-md cursor-pointer"
              style={{ backgroundColor: preset.hex }}
            />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition bg-gray-50 px-2 py-1 rounded">
              {preset.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScreentonePalette;
```

### 3.2 Recent Colors Strip

```typescript
// components/ColorPicker/RecentColorsStrip.tsx

import React from 'react';
import { Color } from '../../lib/color/Color';

interface RecentColorsStripProps {
  colors: Color[];
  maxColors?: number;
  onSelectColor: (color: Color) => void;
  onClearHistory: () => void;
}

const RecentColorsStrip: React.FC<RecentColorsStripProps> = ({
  colors,
  maxColors = 16,
  onSelectColor,
  onClearHistory,
}) => {
  const displayColors = colors.slice(0, maxColors);
  const emptySlots = Math.max(0, maxColors - displayColors.length);

  return (
    <div className="p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-700">Recent Colors</h4>
        {colors.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-gray-500 hover:text-red-500 transition"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-8 gap-1">
        {displayColors.map((color, idx) => (
          <button
            key={idx}
            onClick={() => onSelectColor(color)}
            className="aspect-square rounded border border-gray-300 hover:border-purple-500 transition hover:shadow-md cursor-pointer"
            style={{ backgroundColor: color.toCSS() }}
            title={color.toHex()}
          />
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="aspect-square rounded border-2 border-dashed border-gray-200"
          />
        ))}
      </div>
    </div>
  );
};

export default RecentColorsStrip;
```

---

## 4. Complete Color Picker Panel Component

### 4.1 Main Color Manager

```typescript
// components/ColorPicker/ColorManager.tsx

import React, { useState, useCallback } from 'react';
import { Color } from '../../lib/color/Color';
import HSVColorPicker from './HSVColorPicker';
import ColorInputs from './ColorInputs';
import ScreentonePalette from './ScreentonePalette';
import RecentColorsStrip from './RecentColorsStrip';

interface ColorManagerProps {
  initialColor?: string;
  onColorChange: (color: Color) => void;
  showOpacity?: boolean;
  showBlending?: boolean;
  onBlendModeChange?: (mode: string) => void;
  onOpacityChange?: (opacity: number) => void;
}

const ColorManager: React.FC<ColorManagerProps> = ({
  initialColor = '#000000',
  onColorChange,
  showOpacity = true,
  showBlending = true,
  onBlendModeChange,
  onOpacityChange,
}) => {
  const [color, setColor] = useState(() => Color.fromHex(initialColor));
  const [inputMode, setInputMode] = useState<'hex' | 'rgb' | 'hsv'>('hsv');
  const [recentColors, setRecentColors] = useState<Color[]>([]);
  const [blendMode, setBlendMode] = useState('normal');
  const [showHistory, setShowHistory] = useState(false);

  const handleColorChange = useCallback(
    (newColor: Color) => {
      setColor(newColor);
      onColorChange(newColor);

      // Add to recent colors
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toHex() !== newColor.toHex());
        return [newColor, ...filtered].slice(0, 16);
      });
    },
    [onColorChange]
  );

  const handleBlendModeChange = (mode: string) => {
    setBlendMode(mode);
    onBlendModeChange?.(mode);
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(color.toHex());
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
        <h3 className="font-semibold text-gray-900">Color Manager</h3>
      </div>

      {/* Color Preview */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600">Current Color</div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="h-16 rounded border border-gray-300"
              style={{ backgroundColor: color.toCSS() }}
            />
            <div className="flex flex-col justify-between">
              <button
                onClick={handleCopyHex}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
              >
                {color.toHex()}
              </button>
              <button
                onClick={handleCopyHex}
                className="px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 rounded transition"
              >
                Copy Hex
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker Tabs */}
      <div className="flex-1 overflow-y-auto">
        {/* Picker */}
        <div className="border-b border-gray-200">
          <HSVColorPicker color={color} onChange={handleColorChange} />
          <ColorInputs
            color={color}
            mode={inputMode}
            onModeChange={setInputMode}
            onChange={handleColorChange}
          />
        </div>

        {/* Palettes */}
        <div className="border-b border-gray-200">
          <ScreentonePalette
            onSelectColor={(c, name) => {
              handleColorChange(c);
            }}
          />
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div className="border-b border-gray-200">
            <RecentColorsStrip
              colors={recentColors}
              onSelectColor={handleColorChange}
              onClearHistory={() => setRecentColors([])}
            />
          </div>
        )}

        {/* Blending Options */}
        {showBlending && (
          <div className="p-4 space-y-3 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Blending</h4>
            <select
              value={blendMode}
              onChange={(e) => handleBlendModeChange(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="soft-light">Soft Light</option>
              <option value="hard-light">Hard Light</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 space-y-1">
        <p>HSV Color Picker</p>
        <p>Manga-optimized for screentones</p>
      </div>
    </div>
  );
};

export default ColorManager;
```

---

## 5. Integration with Studio

### 5.1 Updated Studio Component

```typescript
// pages/studio/[id].tsx (updated)

import React, { useState, useCallback } from 'react';
import ColorManager from '../components/ColorPicker/ColorManager';
import { Color } from '../lib/color/Color';

// ... existing imports and types ...

type Overlay = {
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
  // NEW: Color management properties
  opacity?: number;
  blendMode?: string;
};

// ... rest of component ...

export default function Studio() {
  // ... existing state ...
  const [selectedOverlay, setSelectedOverlay] = useState<Overlay | null>(null);

  const handleOverlaySelect = useCallback((overlay: Overlay) => {
    setSelectedOverlay(overlay);
  }, []);

  const handleColorChange = useCallback((color: Color) => {
    if (!selectedOverlay || !currentPage) return;

    const updated: Overlay = {
      ...selectedOverlay,
      color: color.toHex(),
      opacity: Math.round(color.getAlpha() * 100),
    };

    const list = currentOverlays.map((o) => (o.id === updated.id ? updated : o));
    setOverlays((prev) => ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
    setSelectedOverlay(updated);
  }, [selectedOverlay, currentPage, currentOverlays]);

  const handleBlendModeChange = useCallback(
    (mode: string) => {
      if (!selectedOverlay || !currentPage) return;

      const updated: Overlay = {
        ...selectedOverlay,
        blendMode: mode,
      };

      const list = currentOverlays.map((o) => (o.id === updated.id ? updated : o));
      setOverlays((prev) => ({ ...prev, [currentPage.id]: list }));
      saveOverlays(currentPage.id, list);
      setSelectedOverlay(updated);
    },
    [selectedOverlay, currentPage, currentOverlays]
  );

  const handleOpacityChange = useCallback(
    (opacity: number) => {
      if (!selectedOverlay || !currentPage) return;

      const updated: Overlay = {
        ...selectedOverlay,
        opacity,
      };

      const list = currentOverlays.map((o) => (o.id === updated.id ? updated : o));
      setOverlays((prev) => ({ ...prev, [currentPage.id]: list }));
      saveOverlays(currentPage.id, list);
      setSelectedOverlay(updated);
    },
    [selectedOverlay, currentPage, currentOverlays]
  );

  return (
    <Layout title="Studio Editor - MangaFusion">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Pages list - existing code */}
        <aside className="w-56 border-r bg-white p-3 overflow-y-auto">
          {/* ... existing code ... */}
        </aside>

        {/* Canvas - existing code */}
        <main className="flex-1 flex items-center justify-center editor-grid">
          {/* ... existing code ... */}
        </main>

        {/* Tools Panel - modified */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-hidden">
          {/* Tabs for different panels */}
          <div className="flex border-b border-gray-200">
            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-purple-500">
              Tools
            </button>
            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              Properties
            </button>
          </div>

          {/* Tools panel content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="font-semibold">Tools</h3>
            {/* ... existing tools code ... */}
          </div>
        </aside>

        {/* NEW: Color Manager Panel */}
        {selectedOverlay && (
          <ColorManager
            initialColor={selectedOverlay.color || '#000000'}
            onColorChange={handleColorChange}
            showOpacity={true}
            showBlending={true}
            onOpacityChange={handleOpacityChange}
            onBlendModeChange={handleBlendModeChange}
          />
        )}
      </div>
    </Layout>
  );
}
```

---

## 6. Eyedropper Tool Component

### 6.1 Eyedropper Implementation

```typescript
// components/ColorPicker/Eyedropper.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Color } from '../../lib/color/Color';

interface EyedropperProps {
  onColorPicked: (color: Color) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const Eyedropper: React.FC<EyedropperProps> = ({ onColorPicked, canvasRef }) => {
  const [isActive, setIsActive] = useState(false);
  const magnifierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef?.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        return;
      }

      // Update magnifier position
      if (magnifierRef.current) {
        magnifierRef.current.style.left = e.clientX + 15 + 'px';
        magnifierRef.current.style.top = e.clientY + 15 + 'px';
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!canvasRef?.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Sample pixel from canvas
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b, a] = imageData.data;

      const color = Color.fromRGB(r, g, b, a / 255);
      onColorPicked(color);
      setIsActive(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setIsActive(false);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [isActive, canvasRef, onColorPicked]);

  return (
    <div>
      <button
        onClick={() => setIsActive(!isActive)}
        className={`px-3 py-2 text-sm rounded border transition ${
          isActive
            ? 'bg-purple-100 border-purple-500 text-purple-600'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        💧 Eyedropper
      </button>

      {isActive && (
        <div
          ref={magnifierRef}
          className="fixed pointer-events-none z-50 w-20 h-20 border-2 border-purple-500 rounded bg-white shadow-lg overflow-hidden"
          style={{ display: 'block' }}
        />
      )}

      {isActive && (
        <div className="fixed inset-0 cursor-crosshair z-40" />
      )}
    </div>
  );
};

export default Eyedropper;
```

---

## 7. Color History & Persistence

### 7.1 Color History Hook

```typescript
// hooks/useColorHistory.ts

import { useState, useEffect } from 'react';
import { Color } from '../lib/color/Color';

interface ColorHistoryOptions {
  maxSize?: number;
  storageKey?: string;
}

export function useColorHistory(options: ColorHistoryOptions = {}) {
  const maxSize = options.maxSize ?? 16;
  const storageKey = options.storageKey ?? 'color_history';

  const [colors, setColors] = useState<Color[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored).map((hex: string) => Color.fromHex(hex));
      }
    } catch (e) {
      console.error('Failed to load color history:', e);
    }
    return [];
  });

  const [pinned, setPinned] = useState<Color[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey + '_pinned');
      if (stored) {
        return JSON.parse(stored).map((hex: string) => Color.fromHex(hex));
      }
    } catch (e) {
      console.error('Failed to load pinned colors:', e);
    }
    return [];
  });

  const addColor = (color: Color) => {
    setColors((prev) => {
      const filtered = prev.filter((c) => c.toHex() !== color.toHex());
      return [color, ...filtered].slice(0, maxSize);
    });
  };

  const pinColor = (color: Color) => {
    setPinned((prev) => {
      if (prev.find((c) => c.toHex() === color.toHex())) {
        return prev.filter((c) => c.toHex() !== color.toHex());
      }
      return [color, ...prev];
    });
  };

  const clearHistory = () => {
    setColors([]);
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(colors.map((c) => c.toHex())));
  }, [colors, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey + '_pinned', JSON.stringify(pinned.map((c) => c.toHex())));
  }, [pinned, storageKey]);

  return {
    colors,
    pinned,
    addColor,
    pinColor,
    clearHistory,
  };
}
```

---

## 8. Palette Management

### 8.1 Palette Storage Hook

```typescript
// hooks/useColorPalettes.ts

import { useState, useEffect } from 'react';
import { Color } from '../lib/color/Color';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  created: number;
  lastModified: number;
}

export function useColorPalettes() {
  const [palettes, setPalettes] = useState<ColorPalette[]>(() => {
    try {
      const stored = localStorage.getItem('color_palettes');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load palettes:', e);
      return [];
    }
  });

  const createPalette = (name: string, colors: Color[]): ColorPalette => {
    const palette: ColorPalette = {
      id: Math.random().toString(36).slice(2),
      name,
      colors: colors.map((c) => c.toHex()),
      created: Date.now(),
      lastModified: Date.now(),
    };

    setPalettes((prev) => [...prev, palette]);
    return palette;
  };

  const updatePalette = (id: string, updates: Partial<ColorPalette>) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, lastModified: Date.now() }
          : p
      )
    );
  };

  const deletePalette = (id: string) => {
    setPalettes((prev) => prev.filter((p) => p.id !== id));
  };

  const exportPalette = (palette: ColorPalette) => {
    const json = JSON.stringify(palette, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${palette.name}.json`;
    a.click();
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('color_palettes', JSON.stringify(palettes));
  }, [palettes]);

  return {
    palettes,
    createPalette,
    updatePalette,
    deletePalette,
    exportPalette,
  };
}
```

---

## 9. Keyboard Shortcuts

### 9.1 Color Picker Shortcuts Hook

```typescript
// hooks/useColorPickerShortcuts.ts

import { useEffect } from 'react';
import { Color } from '../lib/color/Color';

interface ShortcutHandlers {
  onTogglePicker?: () => void;
  onEyedropper?: () => void;
  onSwapColors?: () => void;
  onCopyHex?: () => void;
  onOpacityChange?: (delta: number) => void;
}

export function useColorPickerShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case 'c':
          if (e.ctrlKey || e.metaKey) return; // Allow copy
          e.preventDefault();
          handlers.onTogglePicker?.();
          break;

        case 'e':
          e.preventDefault();
          handlers.onEyedropper?.();
          break;

        case 'r':
          e.preventDefault();
          handlers.onSwapColors?.();
          break;

        case '+':
        case '=':
          e.preventDefault();
          handlers.onOpacityChange?.(10);
          break;

        case '-':
        case '_':
          e.preventDefault();
          handlers.onOpacityChange?.(-10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

---

## 10. Testing Examples

### 10.1 Color Conversion Tests

```typescript
// __tests__/Color.test.ts

import { Color } from '../lib/color/Color';

describe('Color class', () => {
  test('converts hex to RGB', () => {
    const color = Color.fromHex('#FF0000');
    const rgb = color.toRGB();
    expect(rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  test('converts RGB to hex', () => {
    const color = Color.fromRGB(255, 0, 0);
    expect(color.toHex()).toBe('#FF0000');
  });

  test('converts hex to HSV', () => {
    const color = Color.fromHex('#FF0000');
    const hsv = color.toHSV();
    expect(hsv.h).toBe(0);
    expect(hsv.s).toBe(100);
    expect(hsv.v).toBe(100);
  });

  test('converts HSV to hex', () => {
    const color = Color.fromHSV(0, 100, 100);
    expect(color.toHex()).toBe('#FF0000');
  });

  test('handles alpha channel', () => {
    const color = Color.fromHex('#FF0000', 0.5);
    expect(color.getAlpha()).toBe(0.5);
  });
});
```

---

## Usage Summary

To integrate this color picker system into MangaFusion:

1. **Copy color utilities** to `/lib/color/`:
   - `Color.ts` - Main color class
   - `colorValidation.ts` - Accessibility checking

2. **Copy components** to `/components/ColorPicker/`:
   - `HSVColorPicker.tsx`
   - `ColorInputs.tsx`
   - `ScreentonePalette.tsx`
   - `RecentColorsStrip.tsx`
   - `ColorManager.tsx`
   - `Eyedropper.tsx`

3. **Copy hooks** to `/hooks/`:
   - `useColorHistory.ts`
   - `useColorPalettes.ts`
   - `useColorPickerShortcuts.ts`

4. **Update Studio** (`/pages/studio/[id].tsx`):
   - Import ColorManager
   - Add color state management
   - Connect to overlay properties

5. **Install dependencies** (optional):
   - TinyColor2 for additional color utilities
   - No other dependencies required

All components are self-contained and use only React and standard web APIs.

# MangaFusion Sketch-to-Manga Refinement Feature: Complete User Flow Design

**Document Version:** 1.0
**Date:** 2025-11-17
**Status:** Design Phase - Ready for Implementation
**Target Users:** Comic creators, manga artists, storytellers

---

## Executive Summary

This document provides a complete user flow design for MangaFusion's **sketch-to-manga refinement feature**. The feature enables users to:

1. Create hand-drawn or rough sketches
2. Use AI to refine them into polished manga-style artwork
3. Compare original vs. refined versions side-by-side
4. Accept, reject, or retry with different parameters
5. Save refined images directly to their manga pages
6. Perform bulk refinement on multiple pages at once

The design integrates seamlessly with MangaFusion's existing episode viewer and studio editor.

---

## Table of Contents

1. [User Journey Overview](#user-journey-overview)
2. [Complete User Flow Diagram](#complete-user-flow-diagram)
3. [Detailed Flow Sections](#detailed-flow-sections)
   - [Entry Points](#entry-points)
   - [Sketch Creation & Input](#sketch-creation--input)
   - [Refinement Configuration](#refinement-configuration)
   - [AI Processing](#ai-processing)
   - [Result Comparison](#result-comparison)
   - [Action & Save](#action--save)
   - [Bulk Refinement](#bulk-refinement)
4. [Wireframe Designs](#wireframe-designs)
5. [Data Model & Storage](#data-model--storage)
6. [Integration Points](#integration-points)
7. [Implementation Roadmap](#implementation-roadmap)

---

## User Journey Overview

### Primary User Workflows

#### Workflow 1: Single Page Refinement
**User Goal:** Create a polished manga panel from a rough sketch

```
1. User on Episode page
   ↓
2. Click "Refine" on a page (or go to Studio → "Sketch Refine" tab)
   ↓
3. Enter sketch refinement mode with canvas
   ↓
4. Either upload existing sketch OR draw on canvas
   ↓
5. Configure refinement options (prompt, style, strength)
   ↓
6. Click "Refine with AI"
   ↓
7. View progress indicator
   ↓
8. See side-by-side comparison (Original Sketch | Refined Version)
   ↓
9. Choose: Accept / Reject / Retry
   ↓
10. If accepted: Save to page and return to episode/studio
```

**Time:** 2-5 minutes per page
**Interaction Points:** 6
**Success Criteria:** User can see refined image and decide to save it

---

#### Workflow 2: Bulk Refinement
**User Goal:** Refine all 10 pages at once with same parameters

```
1. User on Episode page
   ↓
2. Click "Bulk Refine All Pages" button
   ↓
3. Configure global refinement options
   ↓
4. Click "Start Batch Refinement"
   ↓
5. View batch progress (Page 1/10, 2/10, etc.)
   ↓
6. For each completed page:
   - Review in preview
   - Quick accept/reject/retry
   ↓
7. Summary report (8 accepted, 1 rejected, 1 retry)
   ↓
8. Option to adjust and re-process rejected pages
   ↓
9. Confirm final batch and save all
```

**Time:** 20-30 minutes for 10 pages
**Interaction Points:** 4 per page + 3 batch controls
**Success Criteria:** User can process multiple pages efficiently

---

#### Workflow 3: Studio-Based Refinement
**User Goal:** Replace a page with a refined version while editing

```
1. User in Studio editor
   ↓
2. See new "Sketch Refine" tab in toolbar
   ↓
3. Click to open inline refinement panel
   ↓
4. Upload/draw sketch for current page
   ↓
5. Click "Quick Refine"
   ↓
6. See result in comparison modal
   ↓
7. Accept → Replace current page image
   ↓
8. Continue editing other pages
```

**Time:** 1-3 minutes per page
**Interaction Points:** 4
**Success Criteria:** Seamless integration with existing studio workflow

---

## Complete User Flow Diagram

```
                          ┌─────────────────────────────────┐
                          │   EPISODE PAGE / STUDIO EDITOR   │
                          └────────────┬────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌─────────────────┐  ┌──────────────┐
            │ Single Page   │  │  Bulk Refine    │  │ Studio Tab   │
            │ "Refine" Btn  │  │ "All Pages" Btn │  │ Integration  │
            └───────┬───────┘  └────────┬────────┘  └──────┬───────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                          ┌─────────────▼──────────────┐
                          │   REFINEMENT MODE ENTRY    │
                          │  (Canvas Draw or Upload)   │
                          └─────────────┬──────────────┘
                                        │
                          ┌─────────────▼──────────────────┐
                          │ SKETCH INPUT SCREEN            │
                          │  - Blank canvas               │
                          │  - Upload file (PNG/JPG/SVG) │
                          │  - Drawing tools (brush, undo)│
                          │  - Color palette              │
                          └─────────────┬──────────────────┘
                                        │
                          ┌─────────────▼──────────────────┐
                          │ REFINEMENT OPTIONS PANEL       │
                          │  - Prompt/Description         │
                          │  - Style selector (manga type)│
                          │  - Refinement strength (0-100%)│
                          │  - AI Provider selector        │
                          │  - Advanced: model, temp, seed │
                          └─────────────┬──────────────────┘
                                        │
                          ┌─────────────▼──────────────────┐
                          │  CLICK "REFINE WITH AI"        │
                          │  └─ Progress indicator         │
                          │  └─ Estimated time             │
                          │  └─ Cancel option              │
                          └─────────────┬──────────────────┘
                                        │
                          ┌─────────────▼──────────────────┐
                          │ SIDE-BY-SIDE COMPARISON VIEW   │
                          │  Split | Slider | Fade | Layer│
                          │  Original ▮│▮ Refined          │
                          │  [View Options ▼]              │
                          └─────────────┬──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
            │   ACCEPT     │    │   REJECT     │    │   RETRY     │
            │  Save & Exit │    │  Discard &   │    │ Adjust opts │
            │              │    │  Go Back     │    │ & Re-process│
            └──────┬───────┘    └──────┬───────┘    └──────┬──────┘
                   │                   │                    │
                   │                   └─────────┬──────────┘
                   │                             │
                   └─────────────────┬───────────┘
                                     │
                    ┌────────────────▼──────────────┐
                    │  SAVE CONFIRMATION DIALOG     │
                    │  - Show thumbnail            │
                    │  - Save location indicator   │
                    │  - "Save & Return" btn       │
                    │  - "Save & Edit Overlays"    │
                    │  - "Save & Next Page"        │
                    └────────────────┬──────────────┘
                                     │
                    ┌────────────────▼──────────────┐
                    │  UPDATE DATABASE & REDIRECT  │
                    │  - Update page.imageUrl      │
                    │  - Create version record     │
                    │  - Log refinement metadata   │
                    └────────────────┬──────────────┘
                                     │
                    ┌────────────────▼──────────────┐
                    │  Return to Episode / Studio   │
                    │  Show success toast           │
                    │  Refresh page thumbnail      │
                    └────────────────────────────────┘
```

---

## Detailed Flow Sections

### Entry Points

#### 1. From Episode Page
**Location:** `/episodes/[id]`
**Trigger:** "Refine Sketch" button on each page card

```
Page Card Layout:
┌─────────────────────────┐
│                         │
│   [Page Thumbnail]      │
│   768x1024px            │
│                         │
├─────────────────────────┤
│ Page 03                 │
│ 85% done                │
├─────────────────────────┤
│ [Edit in Studio▼]       │
│ [Refine Sketch    ]     │ ← New Button
│ [Download       ▼]      │
└─────────────────────────┘
```

**Button Styling:**
- Text: "Refine Sketch"
- Icon: Pencil + Sparkles
- Color: Purple-600
- Hover: Purple-700
- Disabled: Gray-400 (if page has error)

**Click Handler:**
```typescript
onClick={() => router.push(`/refine/${pageId}?episodeId=${episodeId}`)}
```

---

#### 2. From Studio Editor Tab
**Location:** `/studio/[id]`
**Trigger:** New "Sketch Refine" tab in tool panel

```
Tool Panel Navigation:
┌─────────────────────────────────┐
│ ✏️ Tools  🎨 Overlays  ✨ Refine │ ← New Tab
├─────────────────────────────────┤
│                                 │
│ Sketch Refinement               │
│ ─────────────────────────────   │
│                                 │
│ [Upload Sketch]                 │
│ or                              │
│ [Draw on Canvas]                │
│                                 │
│ Refinement Options:             │
│ ─────────────────────────────   │
│ Description:                    │
│ [____________..............]    │
│                                 │
│ Style: [Manga ▼]                │
│ Strength: [========] 75%         │
│                                 │
│ [Quick Refine →]                │
│                                 │
└─────────────────────────────────┘
```

**Navigation:**
- Tab bar at top of side panel
- Smooth transition between "Tools", "Overlays", "Refine"
- Icon-based tabs for quick recognition

---

#### 3. Bulk Refinement
**Location:** `/episodes/[id]`
**Trigger:** "Bulk Refine All Pages" button in header

```
Episode Header Layout:
┌────────────────────────────────────────────────┐
│ ← Episode: Shadow Sketch    [Refine All ✨]    │
├────────────────────────────────────────────────┤
│ Progress: 8/10 pages (80%)                      │
│ ███████░░                                       │
└────────────────────────────────────────────────┘
```

**Button Styling:**
- Text: "Refine All Pages"
- Icon: Batch/Multi icon
- Color: Emerald-600
- Position: Top-right of page grid
- Tooltip: "Refine all pages with consistent settings"

---

### Sketch Creation & Input

#### Canvas Drawing Interface

```
SKETCH REFINEMENT CANVAS
┌──────────────────────────────────────────────────────┐
│ ← Back  │  Drawing Tools  │  [Undo] [Redo] [Clear] │
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│                   ┌──────────────────┐               │
│                   │                  │               │
│                   │   CANVAS AREA    │               │
│                   │   768x1024px     │               │
│                   │   White/Gray BG  │               │
│                   │                  │               │
│                   └──────────────────┘               │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Brush: [●●●] | Size: [████] | Opacity: [████████] │
│ Color: [●Black] | [Eraser] | [Layers] | [Zoom: 100%]│
└──────────────────────────────────────────────────────┘
```

**Drawing Tools:**
1. **Brush Tool** (Default)
   - Pressure sensitivity (if pen input available)
   - Adjustable size (2-50px)
   - Adjustable opacity (0-100%)
   - Anti-aliasing enabled

2. **Eraser Tool**
   - Same size/opacity controls
   - Soft eraser (50% default opacity)

3. **Color Picker**
   - Palette grid (8 common colors)
   - Custom color picker
   - Recent colors history

4. **Undo/Redo**
   - Stack up to 50 actions
   - Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z

5. **Clear Canvas**
   - Confirmation dialog
   - "Clear All" or "Load Previous"

**Canvas Specifications:**
- Resolution: 768x1024px (manga page standard)
- Output: PNG (lossless)
- Background: White with subtle grid (1mm, optional toggle)
- Touch support: Yes (stylus + finger for pressure)
- Save to local storage: Auto-save every 30 seconds

---

#### File Upload Interface

```
UPLOAD SKETCH
┌──────────────────────────────────────────────┐
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Drop sketch file here                  │  │
│  │  or                                     │  │
│  │  [Browse Files]                         │  │
│  │                                         │  │
│  │  Supported: PNG, JPG, JPEG, WebP       │  │
│  │  Max size: 10MB                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ✓ Auto-crop to 768x1024 (maintains ratio)   │
│  ✓ Convert to RGB if needed                  │
│  ✓ Enhance contrast for AI processing        │
│                                              │
└──────────────────────────────────────────────┘
```

**Upload Process:**
```typescript
async function uploadSketch(file: File) {
  // 1. Validate file type & size
  if (!isValidImageFormat(file.type)) throw new Error('Invalid format');
  if (file.size > 10 * 1024 * 1024) throw new Error('File too large');

  // 2. Load and process image
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise(resolve => img.onload = resolve);

  // 3. Auto-crop to 768x1024 aspect ratio
  const cropped = autoCropToAspectRatio(img, 768/1024);

  // 4. Convert to canvas
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(cropped, 0, 0, 768, 1024);

  // 5. Enhance contrast for AI
  const processed = await SketchProcessor.preprocessForAI(canvas, {
    enhanceContrast: true,
    removeNoise: false,
    normalizeSize: true
  });

  return processed;
}
```

---

### Refinement Configuration

#### Options Panel

```
REFINEMENT OPTIONS
┌─────────────────────────────────────────┐
│ ✨ Refine with AI                       │
├─────────────────────────────────────────┤
│                                         │
│ 📝 Description (Optional)               │
│ [_____________________________.....]     │
│ Describe what you want in the result    │
│ Examples: "add tears", "dramatic pose" │
│                                         │
│ 🎨 Manga Style                          │
│ [ Shonen     ▼ ] (Dynamic, action)     │
│   Shojo      (Romantic, emotional)     │
│   Seinen     (Mature, realistic)       │
│   Cyberpunk  (Sci-fi, tech)            │
│   Classic    (Traditional manga)        │
│                                         │
│ 💪 Refinement Strength                  │
│ Subtle ◄─────●───────► Dramatic        │
│       25%    50%    75%    100%         │
│ [50%]  ← Strength level indicator      │
│                                         │
│ Advanced Options ▼                      │
│ ─────────────────────────────────────   │
│                                         │
│ AI Provider:                            │
│ ☑ Gemini (Best quality, slower)        │
│ ○ Segmind ControlNet (Fast, cheaper)   │
│                                         │
│ Model: [Auto ▼]                        │
│ Temperature: [████] 0.7                │
│ Seed: [Random] or [12345]              │
│                                         │
│ ☑ Enhance contrast before sending      │
│ ☑ Keep original aspect ratio           │
│                                         │
├─────────────────────────────────────────┤
│ [← Cancel]      [Refine with AI →]     │
└─────────────────────────────────────────┘
```

**Configuration Options:**

1. **Description (Optional)**
   - Max 200 characters
   - Suggestions dropdown
   - Auto-complete based on project style

2. **Manga Style**
   - Preset styles with visual examples
   - Affects prompt generation
   - Default: Auto-detect from episode style

3. **Refinement Strength**
   - Range: 0-100%
   - 0-33%: Subtle touches, minimal changes
   - 34-66%: Moderate enhancement
   - 67-100%: Dramatic transformation
   - Default: 50%

4. **Advanced Options** (Collapsible)
   - AI Provider selector
   - Model version
   - Temperature control (creativity)
   - Seed for reproducibility
   - Preprocessing toggles

**Prompt Generation:**
```typescript
function buildRefinementPrompt(options: RefinementOptions): string {
  const styleGuide = {
    shonen: 'Dynamic, high-energy manga style with dramatic action',
    shojo: 'Emotional, romantic manga style with soft aesthetics',
    seinen: 'Mature, realistic manga style with detailed linework',
    cyberpunk: 'Futuristic manga style with neon colors and tech',
    classic: 'Traditional manga style with clean lines'
  };

  return `You are a professional manga artist. Refine this sketch into a polished manga illustration:

Sketch: [image]

Style: ${styleGuide[options.style]}
Refinement Level: ${options.strength}%
${options.description ? `Additional Instructions: ${options.description}` : ''}

Requirements:
- Preserve all sketch composition and character positions
- Enhance with clean, professional manga linework
- Add appropriate shading and detail
- Maintain manga/anime aesthetics
- Create publication-ready quality
- Aspect ratio: 768x1024px`;
}
```

---

### AI Processing

#### Processing Screen

```
PROCESSING...
┌──────────────────────────────────────────┐
│                                          │
│         Refining your sketch...          │
│                                          │
│              ⟳ ⟳ ⟳                       │
│          Processing (Step 2/4)           │
│                                          │
│  Step 1: Analyze sketch      ✓           │
│  Step 2: Generate base image ⟳ 45%      │
│  Step 3: Add details         —           │
│  Step 4: Final enhancement   —           │
│                                          │
│  Estimated time remaining: 12 seconds    │
│                                          │
│  Provider: Gemini 2.5 Flash              │
│  Model: Vision + Text Generation         │
│                                          │
│                    [Cancel ✕]            │
│                                          │
└──────────────────────────────────────────┘
```

**Processing States:**

1. **Uploading Sketch** (2-5 seconds)
   - Compress sketch to optimal size
   - Convert to base64
   - Send to API

2. **Generating Base Image** (20-40 seconds)
   - AI processes sketch
   - Generates initial refinement
   - Applies style

3. **Adding Details** (10-20 seconds)
   - Second pass refinement
   - Detail enhancement
   - Shading & tone

4. **Final Processing** (5-10 seconds)
   - Quality check
   - Compression
   - Format conversion

**Progress Indicators:**
- Visual step indicator (1/2/3/4)
- Percentage bar per step
- Estimated time remaining
- Current operation description
- Provider/model info
- Cancel button (with confirmation)

**Error Handling:**
```
CONNECTION ERROR
┌──────────────────────────────────────────┐
│                                          │
│  ⚠ Processing failed                     │
│                                          │
│  Error: API request timeout after 60s    │
│                                          │
│  [Retry]  [Cancel]  [Try different API] │
│                                          │
│  Need help? Contact support              │
│  Error ID: #ERR-2025-11-17-0045         │
│                                          │
└──────────────────────────────────────────┘
```

---

### Result Comparison

#### Comparison View Modes

**1. Split View (Default)**
```
┌─────────────────────────────────────────┐
│    Original Sketch  │  Refined Image     │
│                     │                    │
│   ┌─────────────┐   │   ┌─────────────┐ │
│   │             │   │   │             │ │
│   │   SKETCH    │   │   │  REFINED    │ │
│   │             │   │   │             │ │
│   │             │   │   │             │ │
│   └─────────────┘   │   └─────────────┘ │
│                     │                    │
├─────────────────────────────────────────┤
│ [Split] [Slider] [Fade] [Overlay]      │
│ Zoom: [├────●───────] 100%              │
└─────────────────────────────────────────┘
```

**2. Slider View**
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ │
│  │ Refined Image                       │ │
│  │                                     │ │
│  │   ┌──────────────────────┐          │ │
│  │   │   [Refined Half]║    │          │ │
│  │   │                 ║    │          │ │
│  │   │         ← Click to slide      │ │
│  │   │                 ║    │          │ │
│  │   └──────────────────────┘          │ │
│  │          ← Sketch │ Refined →       │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**3. Fade View**
```
┌─────────────────────────────────────────┐
│                                         │
│        [Image with opacity blend]       │
│        Opacity: ◄───●───► (50%)         │
│        Sketch    Blend    Refined       │
│                                         │
│  Show:                                  │
│  ☑ Original Sketch   ☑ Refined Version  │
│                                         │
└─────────────────────────────────────────┘
```

**4. Overlay View**
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ │
│  │ Current: Refined Image (Toggle ▼)   │ │
│  │                                     │ │
│  │   ┌──────────────────────┐          │ │
│  │   │                      │          │ │
│  │   │    [Current View]    │          │ │
│  │   │                      │          │ │
│  │   └──────────────────────┘          │ │
│  │ [Sketch] [Refined] [Difference]     │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│  Click button to toggle between images   │
└─────────────────────────────────────────┘
```

**5. Difference View**
```
┌─────────────────────────────────────────┐
│  Highlight: [Only Changes ▼]            │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  │  Refined version with highlights   │ │
│  │  ▓▓ = Added detail (magenta)       │ │
│  │  ░░ = Changed area (cyan)          │ │
│  │  __ = Unchanged                    │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Comparison UI Controls:**
```
┌─────────────────────────────────────────┐
│ [Split][Slider][Fade][Layer][Diff]     │
│ Zoom: [████████] 100% | Pan: [Reset]   │
│ Details: [Info ▼]                       │
│                                         │
│ Original: 512x768px, PNG, sketch        │
│ Refined:  512x768px, PNG, 45 seconds    │
│ Similarity: 87%  |  Quality Score: A+   │
└─────────────────────────────────────────┘
```

---

#### Detailed Information Panel

```
COMPARISON DETAILS
┌────────────────────────────────┐
│ Processing Details             │
├────────────────────────────────┤
│                                │
│ Processing Time: 47 seconds    │
│ AI Provider: Gemini 2.5 Flash  │
│ Model: Vision                  │
│ Temperature: 0.7               │
│ Seed: 8374621                  │
│                                │
│ Input Sketch:                  │
│ - Resolution: 768x1024         │
│ - File Size: 245KB             │
│ - Format: PNG                  │
│ - Contrast Enhanced: Yes       │
│                                │
│ Refined Output:                │
│ - Resolution: 768x1024         │
│ - File Size: 523KB             │
│ - Format: PNG                  │
│ - Quality Score: 92/100        │
│                                │
│ Visual Similarity: 87%         │
│ Style Match: 94%               │
│ Detail Enhancement: High       │
│                                │
└────────────────────────────────┘
```

---

### Action & Save

#### Decision Point

```
REFINEMENT RESULT
┌──────────────────────────────────────────┐
│                                          │
│  Are you happy with the result?          │
│                                          │
│  [← Back]    [Cancel]    [↻ Retry]      │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│     Are you happy with this              │
│     refined manga panel?                 │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │    [Refined Image Thumbnail]     │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Quality Metrics:                        │
│  Sketch Fidelity: ████░░ 85%            │
│  Manga Style: ████████ 94%              │
│  Detail Level: ███████░ 92%             │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Accept & Save                 │   │
│  │ This looks great! Save to page.  │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ↻ Retry with Different Settings │   │
│  │ Try a different style/strength.  │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ✕ Discard                       │   │
│  │ Not what I expected. Start over. │   │
│  └─────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

**Option 1: Accept & Save**
```
SAVE CONFIRMATION
┌──────────────────────────────────────────┐
│                                          │
│  Saving refined image to page...        │
│                                          │
│  ✓ Upload to cloud storage              │
│  ✓ Update page.imageUrl in database      │
│  ✓ Create version record                │
│  ✓ Log refinement metadata              │
│                                          │
│  [Save & Return to Episode]             │
│  [Save & Edit Overlays in Studio]       │
│  [Save & Refine Next Page]              │
│                                          │
└──────────────────────────────────────────┘
```

**Option 2: Retry**
- Return to refinement options panel
- Pre-fill with previous settings
- Allow adjustments to strength, style, or prompt
- Show comparison with previous attempt

**Option 3: Discard**
- Confirm action (warning)
- Return to episode/studio without saving
- Option to re-open refinement tool

---

### Bulk Refinement

#### Batch Configuration

```
BULK REFINE ALL PAGES
┌──────────────────────────────────────────┐
│ Refine 10 Pages with Consistent Settings │
├──────────────────────────────────────────┤
│                                          │
│ Global Settings:                         │
│                                          │
│ 📝 Description (Optional)                │
│ [_____________________________.....]     │
│ Apply to all pages                       │
│                                          │
│ 🎨 Style: [Manga ▼]                     │
│ Strength: [████████░░░] 70%             │
│                                          │
│ Processing Options:                      │
│ ☑ Use same settings for all pages        │
│ ☑ Auto-accept similar results (>90%)     │
│ ☑ Skip failed pages and continue         │
│ ☐ Generate report when done              │
│ ☐ Email report when complete             │
│                                          │
│ Estimated time: 25-35 minutes           │
│ Cost estimate: ~$2.50                    │
│                                          │
├──────────────────────────────────────────┤
│ [← Cancel]    [Start Bulk Refine →]     │
└──────────────────────────────────────────┘
```

#### Batch Progress View

```
BATCH REFINEMENT IN PROGRESS
┌──────────────────────────────────────────┐
│ ◄ Back                                   │
├──────────────────────────────────────────┤
│                                          │
│ Progress: 4 of 10 pages (40%)            │
│ ████████░░░░░░░░░░░░                    │
│                                          │
│ Estimated time remaining: 15 minutes     │
│ Cost so far: $1.00 / $2.50               │
│                                          │
├──────────────────────────────────────────┤
│ CURRENT: Page 4                          │
│ Status: Generating base image (55%)      │
│ Time elapsed: 35 seconds                 │
│ ⟳ ⟳ ⟳                                    │
│                                          │
├──────────────────────────────────────────┤
│ COMPLETED:                               │
│                                          │
│ ✓ Page 1  [Accepted]     [Retry]        │
│ ✓ Page 2  [Accepted]     [Retry]        │
│ ✓ Page 3  [Manual Review] [→]           │
│ ⟳ Page 4  [In Progress]                 │
│                                          │
│ PENDING:                                 │
│ ○ Pages 5-10                             │
│                                          │
└──────────────────────────────────────────┘
```

**Batch Page Review:**
```
PAGE 3 - REVIEW REQUIRED (Auto-accept threshold not met: 87% confidence)

┌──────────────────────────────────────────┐
│                                          │
│  ┌───────────────────────────────────┐  │
│  │ [Refined Image Thumbnail]         │  │
│  │ 87% quality, 92% style match      │  │
│  └───────────────────────────────────┘  │
│                                          │
│  [View Full] [Compare] [Details]        │
│                                          │
│  Decision:                               │
│  [✓ Accept]  [✕ Reject]  [↻ Retry]     │
│                                          │
│  [↓ Next Review]                         │
│                                          │
└──────────────────────────────────────────┘
```

#### Batch Completion Report

```
BATCH REFINEMENT COMPLETE
┌──────────────────────────────────────────┐
│                                          │
│  All pages processed successfully!       │
│  Total time: 28 minutes                  │
│  Total cost: $2.35                       │
│                                          │
├──────────────────────────────────────────┤
│ SUMMARY                                  │
│                                          │
│ ✓ Accepted:        8 pages (80%)        │
│ ⚠ Needs Review:    1 page  (10%)        │
│ ✕ Rejected:        1 page  (10%)        │
│                                          │
│ Average quality score:  A (92/100)      │
│ Processing time: 28:45 minutes          │
│ Cost per page: $0.235                    │
│                                          │
├──────────────────────────────────────────┤
│ NEXT STEPS                               │
│                                          │
│ 1 page needs review (Page 7)             │
│ 1 page rejected (Page 9 - low quality)   │
│                                          │
│ ☑ Auto-refine rejected pages with        │
│   different style/strength               │
│                                          │
│ Estimated retry time: 5 minutes          │
│                                          │
├──────────────────────────────────────────┤
│ ACTIONS                                  │
│                                          │
│ [✓ Save All] [Review Issues] [Report]   │
│ [← Go to Episode] [→ Edit in Studio]    │
│                                          │
└──────────────────────────────────────────┘
```

---

## Wireframe Designs

### 1. Episode Page with Refine Button

```
EPISODE VIEW - Page Cards with Refinement
┌─────────────────────────────────────────────────────────────────┐
│ ← Create     Episode: Shadow Sketch    [Refine All Pages ✨]    │
├─────────────────────────────────────────────────────────────────┤
│ Progress: 9/10 (90%)  ████████░                                │
│                                                                 │
│ Grid Layout (4 columns):                                       │
│                                                                 │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│ │  Page 01    │  │  Page 02    │  │  Page 03    │  │ Page 04 │ │
│ │             │  │             │  │             │  │         │ │
│ │ [Thumb]     │  │ [Thumb]     │  │ [Thumb]     │  │[Thumb] │ │
│ │             │  │             │  │             │  │         │ │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────┤ │
│ │ 100% done   │  │ 100% done   │  │ ⟳ 75%      │  │ 100%    │ │
│ │             │  │             │  │             │  │         │ │
│ │[✎Studio]    │  │[✎Studio]    │  │[✎Studio]    │  │[✎Edit] │ │
│ │[✨Refine]   │  │[✨Refine]   │  │[✨Refine]   │  │[✨Ref]  │ │
│ │[⬇Download]  │  │[⬇Download]  │  │[⬇Download]  │  │[⬇Down]  │ │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                 │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│ │  Page 05    │  │  Page 06    │  │  Page 07    │  │ Page 08 │ │
│ │             │  │             │  │             │  │         │ │
│ │ [Thumb]     │  │ [Thumb]     │  │ [Thumb]     │  │[Thumb] │ │
│ │             │  │             │  │             │  │         │ │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────┤ │
│ │ 100% done   │  │ 100% done   │  │ 100% done   │  │ 100%    │ │
│ │             │  │             │  │             │  │         │ │
│ │[✎Studio]    │  │[✎Studio]    │  │[✎Studio]    │  │[✎Edit] │ │
│ │[✨Refine]   │  │[✨Refine]   │  │[✨Refine]   │  │[✨Ref]  │ │
│ │[⬇Download]  │  │[⬇Download]  │  │[⬇Download]  │  │[⬇Down]  │ │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                 │
│ ┌─────────────┐  ┌─────────────┐                              │
│ │  Page 09    │  │  Page 10    │                              │
│ │             │  │             │                              │
│ │ [Thumb]     │  │ [Thumb]     │                              │
│ │             │  │             │                              │
│ ├─────────────┤  ├─────────────┤                              │
│ │ ✕ Error     │  │ 100% done   │                              │
│ │             │  │             │                              │
│ │[✎Studio]    │  │[✎Studio]    │                              │
│ │[↻ Retry]    │  │[✨Refine]   │                              │
│ │[⬇Download]  │  │[⬇Download]  │                              │
│ └─────────────┘  └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Refinement Tool Page (New Route: `/refine/[pageId]`)

```
REFINEMENT PAGE - Full Screen Canvas & Options

┌────────────────────────────────────────────────────────────────────┐
│ ← Back | Drawing Toolkit | [Undo] [Redo] [Clear] | [Start Refining]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Canvas Area (60% width)          Options Panel (40% width)       │
│  ┌──────────────────────────┐     ┌──────────────────────────┐    │
│  │                          │     │ Refinement Options       │    │
│  │   Canvas Drawing Area    │     │ ─────────────────────    │    │
│  │   768x1024px             │     │                          │    │
│  │                          │     │ 📝 Description:          │    │
│  │                          │     │ [________________....]   │    │
│  │  ┌────────────────────┐  │     │                          │    │
│  │  │ [Sketch Preview]   │  │     │ 🎨 Style:               │    │
│  │  │ with drawing       │  │     │ [Manga ▼]               │    │
│  │  │                    │  │     │                          │    │
│  │  │                    │  │     │ 💪 Strength:            │    │
│  │  │                    │  │     │ Weak ◄───●──► Strong    │    │
│  │  │                    │  │     │     [50%]               │    │
│  │  │                    │  │     │                          │    │
│  │  └────────────────────┘  │     │ ☑ Advanced Options ▼     │    │
│  │                          │     │                          │    │
│  │ Brush: [●●●] 8px        │     │ Provider:                │    │
│  │ Color: [●Black]         │     │ ☑ Gemini                 │    │
│  │ Opacity: [████] 100%    │     │ ○ Segmind                │    │
│  │                          │     │                          │    │
│  └──────────────────────────┘     │ [Refine with AI ✨]     │    │
│                                   │                          │    │
│                                   └──────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3. Studio Editor with Refinement Tab

```
STUDIO EDITOR - With Sketch Refine Tab
┌──────────────────────────────────────────────────────────────────┐
│ ← Episode | Page 1/10                                            │
├──────────────────────────────────────────────────────────────────┤
│
│ Pages List (20%)    Canvas (55%)           Tools/Refine (25%)    │
│ ┌──────────────┐   ┌────────────────┐   ┌─────────────────────┐ │
│ │ Pages        │   │                │   │ ✎ Tools ✨ Refine   │ │
│ │ ─────────── │   │                │   │ ───────────────     │ │
│ │ [Page 1]★   │   │                │   │                     │ │
│ │  Page 2     │   │  768x1024px    │   │ Sketch Refinement   │ │
│ │  Page 3     │   │  Canvas Area   │   │ ─────────────────   │ │
│ │  Page 4     │   │                │   │                     │ │
│ │  Page 5     │   │  [Image with   │   │ [Upload File]       │ │
│ │  Page 6     │   │   overlays]    │   │ or                  │ │
│ │  Page 7     │   │                │   │ [Draw on Canvas]    │ │
│ │  Page 8     │   │                │   │                     │ │
│ │  Page 9     │   │                │   │ Description:        │ │
│ │  Page 10    │   │                │   │ [________________.] │ │
│ │             │   │                │   │                     │ │
│ │             │   │                │   │ Style: [Manga ▼]    │ │
│ │             │   │                │   │ Power: [████░░] 60% │ │
│ │             │   │                │   │                     │ │
│ │             │   │                │   │ [Quick Refine →]    │ │
│ │             │   │                │   │                     │ │
│ └──────────────┘   │                │   └─────────────────────┘ │
│                    └────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model & Storage

### New Database Schema Extensions

```typescript
// Extend existing Page model
model Page {
  id         String     @id @default(uuid())
  episodeId  String
  pageNumber Int
  status     PageStatus
  imageUrl   String?     // Original generated image
  audioUrl   String?
  seed       Int?
  version    Int?       @default(0)
  error      String?
  overlays   Json?

  // New fields for sketch refinement
  sketchData    Json?           // Canvas state for sketch (base64 + strokes)
  refinementHistory RefinementRecord[]
  currentRefinement RefinementVersion? @relation("CurrentRefinement")
  refinements   RefinementVersion[]    @relation("PageRefinements")

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, pageNumber])
  @@index([episodeId])
  @@index([status])
}

// New model for refinement tracking
model RefinementVersion {
  id              String   @id @default(uuid())
  pageId          String
  page            Page     @relation(name: "PageRefinements", fields: [pageId], references: [id], onDelete: Cascade)
  currentPageRef  Page?    @relation(name: "CurrentRefinement")

  // Refinement metadata
  originalSketchUrl String   // Original sketch image
  refinedImageUrl   String   // Refined result

  // Configuration used
  promptDescription String?
  style             String   // 'shonen' | 'shojo' | 'seinen' | 'cyberpunk' | 'classic'
  strength          Int      // 0-100
  aiProvider        String   // 'gemini' | 'segmind'
  model             String
  temperature       Float
  seed              Int?

  // Metadata
  processingTimeMs  Int      // How long refinement took
  qualityScore      Float    // 0-100
  styleMatch        Float    // 0-100
  similarity        Float    // How similar to original sketch

  createdAt         DateTime @default(now())
  accepted          Boolean  @default(false)
  acceptedAt        DateTime?

  @@index([pageId])
  @@index([createdAt])
  @@index([accepted])
}

// Track bulk refinement jobs
model BulkRefinementJob {
  id            String   @id @default(uuid())
  episodeId     String

  // Configuration
  globalPrompt  String?
  style         String
  strength      Int

  // Progress
  totalPages    Int
  processedCount Int
  acceptedCount Int
  rejectedCount Int

  status        String   // 'queued' | 'running' | 'completed' | 'failed'

  // Results
  startedAt     DateTime?
  completedAt   DateTime?
  totalCost     Float?

  createdAt     DateTime @default(now())

  @@index([episodeId])
  @@index([status])
}
```

### API Endpoints

```typescript
// POST /api/pages/[pageId]/refine
// Request: { sketchImageUrl or sketchBase64, prompt, style, strength, provider }
// Response: { refinedImageUrl, processingTime, qualityScore }

// GET /api/pages/[pageId]/refinements
// Response: { refinements: RefinementVersion[] }

// POST /api/pages/[pageId]/refinements/[refinementId]/accept
// Response: { success, updatedPageUrl }

// POST /api/pages/[pageId]/refinements/[refinementId]/reject
// Response: { success }

// POST /api/episodes/[episodeId]/bulk-refine
// Request: { globalPrompt, style, strength }
// Response: { jobId, estimatedTime, estimatedCost }

// GET /api/bulk-refine-jobs/[jobId]
// Response: { status, progress, processedPages, results[] }

// PUT /api/bulk-refine-jobs/[jobId]/pause
// Pause the bulk job

// PUT /api/bulk-refine-jobs/[jobId]/resume
// Resume the bulk job
```

---

## Integration Points

### 1. Episode Page Integration

**File:** `/pages/episodes/[id].tsx`

```typescript
// New button on PageCard component
<button
  onClick={() => router.push(`/refine/${page.id}?episodeId=${id}`)}
  className="btn-refine"
>
  <svg>✨</svg>
  Refine Sketch
</button>

// Listen for refinement completion via EventSource
// When page image updates, refresh thumbnail
es.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'refinement_complete') {
    // Refresh page data
    setPages(prev => ({
      ...prev,
      [msg.pageId]: {
        ...prev[msg.pageId],
        imageUrl: msg.imageUrl
      }
    }));
  }
};
```

### 2. Studio Editor Integration

**File:** `/pages/studio/[id].tsx`

```typescript
// Add new tab in tool panel
const [toolTab, setToolTab] = useState<'tools' | 'overlays' | 'refine'>('tools');

// Render based on tab
{toolTab === 'refine' && (
  <SketchRefinePanel
    pageId={currentPage.id}
    onRefineComplete={(newImageUrl) => {
      // Update current page
      setPages(prev =>
        prev.map(p =>
          p.id === currentPage.id
            ? { ...p, imageUrl: newImageUrl }
            : p
        )
      );
    }}
  />
)}
```

### 3. Bulk Refinement Integration

**File:** `/pages/episodes/[id].tsx` (New button) & `/pages/bulk-refine/[jobId].tsx` (New page)

```typescript
// On episode page
<button onClick={() => router.push(`/bulk-refine/${id}`)}>
  Refine All Pages
</button>

// New bulk refine page
// Shows progress, allows manual review, generates report
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Backend Setup
- [ ] Extend Prisma schema with `RefinementVersion` and `BulkRefinementJob` models
- [ ] Create `/api/pages/[pageId]/refine` endpoint
- [ ] Implement sketch preprocessing pipeline
- [ ] Set up AI provider integration (Gemini + Segmind)
- [ ] Add progress tracking with EventSource

#### 1.2 Frontend - Refinement Page
- [ ] Create `/pages/refine/[pageId].tsx` page
- [ ] Implement canvas drawing interface
  - Brush tool with size/opacity
  - Eraser tool
  - Color picker
  - Undo/Redo stack
  - Save to localStorage
- [ ] Build refinement options panel
- [ ] Implement file upload with auto-crop

**Deliverables:**
- Working sketch refinement page with canvas
- File upload support
- Options configuration UI
- API integration for refinement

---

### Phase 2: Comparison & Results (Weeks 3-4)

#### 2.1 Result Display
- [ ] Implement split-view comparison
- [ ] Add slider comparison mode
- [ ] Add fade comparison mode
- [ ] Add overlay mode
- [ ] Add difference highlighting
- [ ] Zoom and pan controls
- [ ] Quality metrics display

#### 2.2 Decision & Save
- [ ] Accept button + confirmation
- [ ] Reject with return to options
- [ ] Retry with settings adjustment
- [ ] Save to database
- [ ] Update page thumbnail in episode view
- [ ] Create refinement version record

**Deliverables:**
- Full comparison UI with all modes
- Save pipeline working
- Refinement history tracking
- Episode page updates with refined image

---

### Phase 3: Studio Integration (Weeks 5-6)

#### 3.1 Studio Tab
- [ ] Add "Sketch Refine" tab to studio editor
- [ ] Inline canvas in side panel
- [ ] Quick refine button
- [ ] Integration with current page
- [ ] Replace page image on accept

#### 3.2 Bulk Refinement UI
- [ ] Create bulk refine configuration page
- [ ] Batch progress display
- [ ] Per-page review interface
- [ ] Batch completion report
- [ ] Retry failed pages

**Deliverables:**
- Sketch refine tab in studio working
- Bulk refinement page functional
- Batch job tracking and reporting

---

### Phase 4: Advanced Features (Weeks 7-8)

#### 4.1 Performance & Optimization
- [ ] Canvas optimization (pooling, worker threads)
- [ ] Image compression optimization
- [ ] Streaming progress updates
- [ ] Caching of recent refinements
- [ ] Batch scheduling (off-peak processing)

#### 4.2 User Experience
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+S, etc.)
- [ ] Drag & drop file upload
- [ ] Mobile touch support for canvas
- [ ] Preset templates for quick refining
- [ ] Style reference auto-detection

#### 4.3 Analytics & Logging
- [ ] Track refinement metrics
- [ ] Log processing times
- [ ] Monitor AI provider costs
- [ ] User feedback collection
- [ ] A/B testing different styles

**Deliverables:**
- Optimized performance
- Mobile support
- Analytics dashboard
- Usage reports

---

### Phase 5: Production Ready (Weeks 9-10)

#### 5.1 Testing & QA
- [ ] Unit tests for canvas operations
- [ ] Integration tests for API endpoints
- [ ] E2E tests for full workflows
- [ ] Performance benchmarks
- [ ] Error handling edge cases
- [ ] Cross-browser testing

#### 5.2 Documentation & Deployment
- [ ] User guide for refinement feature
- [ ] API documentation
- [ ] Admin guide for monitoring
- [ ] Deployment procedures
- [ ] Monitoring & alerting setup

**Deliverables:**
- Fully tested feature
- Complete documentation
- Production deployment
- Monitoring in place

---

## Key Design Decisions

### 1. Page Type System

**Decision:** Do NOT create separate "sketch" vs "generated" page types.

**Rationale:**
- Simpler data model
- Pages can switch between AI-generated and refined-sketch versions
- Version history tracks all iterations
- Users can use refinement for any page, not just sketches

**Implementation:**
```typescript
// A single Page can have:
// - imageUrl: current image (could be AI-generated or refined sketch)
// - refinements[]: all refinement attempts
// - refinements[n].originalSketchUrl: the sketch used
// - refinements[n].refinedImageUrl: the result

// Accept a refinement by updating page.imageUrl
```

### 2. Sketch Storage Strategy

**Decision:** Store sketch as base64 in refinements history, not on every page.

**Rationale:**
- Sketches only needed if refining again
- Reduces database size
- Version control through refinement records
- Can rebuild from refinement history

### 3. AI Provider Selection

**Decision:** Support multiple providers, with intelligent fallback.

**Rationale:**
- Gemini for quality (but slower/more expensive)
- Segmind ControlNet for speed/cost
- Users choose based on their priorities
- Fallback if one fails

**Logic:**
```typescript
const providerConfig = {
  gemini: {
    maxQuality: 95,
    speed: 'slow',
    costPerImage: 0.02
  },
  segmind: {
    maxQuality: 85,
    speed: 'fast',
    costPerImage: 0.01
  }
};

// Show cost/time trade-off in UI
// Let user choose based on needs
```

### 4. Comparison View Default

**Decision:** Split view as default, with easy switching.

**Rationale:**
- Most intuitive for side-by-side comparison
- Clear view of both original and refined
- Other modes available for specific use cases
- Synchronized zoom/pan for detailed inspection

### 5. Bulk Refinement Approach

**Decision:** Process one page at a time with immediate review, not all parallel.

**Rationale:**
- Prevents wasting credits on low-quality results
- Allows user to adjust settings between pages
- Easier to debug issues
- Better progress visibility
- Still much faster than manual single refinements

**Flow:**
```
1. Configure global settings
2. For each page:
   a. Queue refinement job
   b. Wait for completion
   c. Show preview
   d. Quick decision (accept/reject/retry)
   e. If rejected, re-queue with adjusted settings
3. Summary report
```

---

## Success Metrics

### User Engagement
- [ ] 40%+ of users attempt sketch refinement
- [ ] Average 3+ pages refined per episode
- [ ] Bulk refine used by 60%+ of power users

### Quality Metrics
- [ ] Average quality score >= 88/100
- [ ] 75%+ first-attempt acceptance rate
- [ ] Average similarity to original sketch >= 85%

### Performance Metrics
- [ ] Canvas drawing @ 60fps
- [ ] Single page refinement < 60 seconds
- [ ] Bulk refinement 10 pages < 35 minutes
- [ ] Comparison view rendering < 500ms

### Cost & Operations
- [ ] Average cost per page < $0.02
- [ ] Error rate < 2%
- [ ] User support issues related to refinement < 5%

---

## Testing Strategy

### Unit Tests
```typescript
// Canvas operations
- Brush stroke generation
- Undo/redo stack
- Color conversion
- Opacity blending

// Sketch preprocessing
- Image resize/crop
- Contrast enhancement
- Noise removal

// Prompt generation
- Style selector accuracy
- Strength factor application
- Custom prompt integration

// Comparison calculation
- Similarity scoring
- Quality metrics
- Style matching
```

### Integration Tests
```typescript
// API endpoints
- Sketch upload and processing
- Refinement with all providers
- Batch job creation and progress
- Result saving to database

// Database
- RefinementVersion creation
- History tracking
- Cleanup of old versions
- Concurrent refinements
```

### E2E Tests
```typescript
// Full workflows
- Upload sketch → Refine → Accept → Verify in episode
- Draw sketch → Refine → Retry with different settings
- Bulk refine 10 pages → Review → Accept all
- Switch between comparison modes
- Download refined image
```

---

## Conclusion

This comprehensive user flow design provides a clear roadmap for implementing MangaFusion's sketch-to-manga refinement feature. The design prioritizes:

1. **User Experience**: Intuitive workflows with multiple entry points and comparison modes
2. **Flexibility**: Support for single and bulk refinement, multiple AI providers
3. **Integration**: Seamless integration with existing episode viewer and studio editor
4. **Performance**: Optimized canvas operations and AI processing
5. **Reliability**: Comprehensive error handling and version tracking

The phased implementation approach allows for iterative development and user feedback incorporation while maintaining a clear path to production readiness.

---

**Document Status:** Ready for Development
**Next Step:** Review with stakeholders, then proceed to Phase 1 implementation
**Last Updated:** 2025-11-17

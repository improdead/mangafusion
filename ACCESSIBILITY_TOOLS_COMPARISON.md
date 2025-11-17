# Drawing Applications Accessibility Comparison
## Figma vs Excalidraw vs Google Drawings

---

## Executive Summary Table

| Feature | Figma | Excalidraw | Google Drawings |
|---------|-------|-----------|-----------------|
| **Keyboard Navigation** | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| **Screen Reader Support** | ★★★★☆ | ★★☆☆☆ | ★★★☆☆ |
| **High Contrast Mode** | ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ |
| **Colorblind Support** | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |
| **Zoom Accessibility** | ★★★★☆ | ★★★☆☆ | ★★★☆☆ |
| **WCAG Compliance** | ★★★★☆ | ★★★☆☆ | ★★★☆☆ |
| **Overall Rating** | ★★★★☆ | ★★★☆☆ | ★★★☆☆ |

---

## 1. Figma - Most Accessible Option

### Keyboard Navigation - Excellent (★★★★★)

#### Strengths
- **100+ keyboard shortcuts** covering all major functions
- **Keyboard box selection** with pink cursor navigation
- **Arrow keys** to position cursor, Enter to select objects
- **Comprehensive shortcut system** documented in Help Center
- **Customizable shortcuts** in preferences
- **Quick actions** via Ctrl+/ (Cmd+/)
- **Access all shortcuts** via Ctrl+Shift+? (Cmd+Shift+?)
- **Tool selection** via single keys (R for rectangle, C for circle, etc.)

#### Key Shortcuts
```
Tool Selection:
R - Rectangle
C - Circle
L - Line
T - Text
P - Pen/Pencil
S - Selection

Navigation:
Ctrl+0 - Fit to screen
Ctrl+1 - Zoom to 100%
Arrow Keys - Pan (with keyboard nav enabled)
Shift+1 - Fit selection

Editing:
Ctrl+Z - Undo
Ctrl+Y - Redo
Ctrl+C - Copy
Ctrl+V - Paste
Delete - Delete selected
Escape - Deselect
```

#### Assessment
- Can use Figma entirely with keyboard
- Drawing shapes possible with keyboard
- Keyboard-only workflow is efficient

### Screen Reader Support - Strong (★★★★☆)

#### Features
- **Accessibility mode** in preferences (Preferences > Accessibility > "Adapt content for screen readers")
- **Canvas objects** accessible to screen readers
- **File navigation** keyboard accessible
- **Layer panel** navigable with screen reader
- **Widget editing** keyboard accessible in prototypes
- **Proper focus management**

#### Screen Reader Testing Results
- NVDA: Works well with Chrome
- JAWS: Full support
- VoiceOver: Works on Mac
- Announcements for: tool selection, object creation, property changes

#### Assessment
- Strong screen reader integration
- Users can navigate and edit with screen reader
- Canvas content limited (as expected)

### High Contrast Mode - Strong (★★★★☆)

#### Native Support
- Responds to Windows High Contrast mode
- UI elements visible in high contrast
- Focus indicators contrast well
- Icons maintain visibility

#### Plugin Ecosystem
- **Stark plugin** ($5/month) provides:
  - Color blindness simulation (protanopia, deuteranopia, tritanopia)
  - Contrast checking tools
  - WCAG compliance reports

#### Assessment
- Good native high contrast support
- Excellent plugin support for enhanced features
- Windows High Contrast mode fully functional

### Colorblind-Friendly UI - Excellent (★★★★★)

#### Native Features
- **Stark plugin** allows colorblind simulation
- Can preview designs as they appear to colorblind users
- **Accessibility plugins** help validate palettes
- **A11y Focus Orderer** (Microsoft plugin) for focus management

#### Supported Simulations
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Achromatopsia (total color blindness)
- Monochromacy

#### How It Works
1. Install Stark plugin
2. Open plugin in design file
3. Select colorblind type to simulate
4. Preview entire design in simulated vision
5. Adjust colors as needed

#### Assessment
- Best colorblind support among the three
- Stark plugin essential for accessibility-focused design
- Can design specifically for colorblind users

### Zoom Accessibility - Strong (★★★★☆)

#### Features
- Browser zoom works naturally
- Application zoom with Ctrl+0 to fit
- Zoom up to 400% supported
- Responsive layout at zoom levels
- Text remains readable at 200% zoom
- Toolbar accessible at high zoom

#### Testing Results
- 150% zoom: Fully functional
- 200% zoom: Minor layout adjustments but usable
- 400% zoom: Some navigation required but accessible

#### Assessment
- Good zoom support
- Layout responsive at all zoom levels
- Browser zoom doesn't break functionality

### WCAG 2.1 Compliance - Strong (★★★★☆)

#### Compliance Target
- **WCAG 2.2 AA** (newer than WCAG 2.1)
- Actively improving toward full compliance
- Regular updates to accessibility features

#### Verified Compliance Areas
- 2.1.1 (Keyboard) - Fully compliant
- 2.4.3 (Focus Order) - Compliant
- 2.4.7 (Focus Visible) - Compliant
- 1.4.3 (Contrast) - Compliant
- 4.1.2 (Name, Role, Value) - Compliant

#### Known Gaps
- Canvas content not fully accessible to screen readers (expected)
- Some advanced features may have limitations

#### Assessment
- Strong WCAG 2.1 AA compliance
- Actively targeting WCAG 2.2
- Excellent overall compliance

### Recommended Setup for Figma

**Essential:**
1. Install **Stark plugin** ($5/month) for colorblind support
2. Use keyboard shortcuts as primary input method
3. Enable Accessibility mode when screen readers needed
4. Test with NVDA or JAWS before publishing designs

**Best Practices:**
- Use high contrast palette by default
- Test with Stark colorblind simulation
- Document accessibility in design specs
- Use keyboard as primary testing method
- Train team on accessibility features

---

## 2. Excalidraw - Developing Accessibility

### Keyboard Navigation - Limited (★★★☆☆)

#### Strengths
- Toolbar actions selectable via keyboard
- Tab through toolbar elements
- Tool shortcuts implemented (R, C, L, etc.)
- Arrow keys for object manipulation
- Escape key works for deselection

#### Critical Limitation
**Cannot draw shapes using keyboard alone**
- Can select tool from toolbar
- Cannot draw the shape after selection
- GitHub Issue #7492 documents this limitation
- Acknowledged as a significant accessibility gap

#### Keyboard Shortcuts Available
```
Tool Selection:
R - Rectangle
C - Circle
L - Line
D - Diamond
A - Arrow
F - Free draw
T - Text
O - Library open
```

#### Issues Identified
- **Issue #7492** (Deque Audit): Missing keyboard drawing capability
- **Issue #3100**: Keyboard shortcuts for colors only work in regular mode, not Zen mode
- **Issue #4779**: Touch input breaks keyboard shortcuts until canvas clicked
- **Missing focus indicators** reported in accessibility audit

#### Assessment
- Toolbar accessible
- Drawing workflow NOT keyboard accessible
- Major gap for keyboard-only users
- Community aware but not yet fixed

### Screen Reader Support - Weak (★★☆☆☆)

#### Issues Identified
From Deque Accessibility Audit (Issue #7492):

1. **Missing ARIA Labels**
   - Many toolbar elements lack aria-label
   - Canvas not properly labeled
   - Color picker not announced

2. **Duplicate Element IDs**
   - Screen reader confusion
   - Accessibility tree invalid
   - Focus management breaks

3. **Missing Focus Indicators**
   - No visible focus on toolbar buttons
   - Hard for keyboard users to see current selection
   - Violates WCAG 2.4.7

4. **Canvas Content Not Exposed**
   - No fallback text
   - No alternate description
   - Expected limitation for canvas-based tool

#### Current Status
- Basic support only
- Multiple issues reported
- Not fully tested with major screen readers

#### Assessment
- Below minimum accessibility standards
- Would require significant improvements for compliance
- Not suitable for screen reader users

### High Contrast Mode - Weak (★★☆☆☆)

#### Support Level
- Depends on system-level support
- Browser high contrast mode works
- Application doesn't explicitly support it
- Icons may not maintain visibility

#### Issues
- No explicit high contrast CSS
- Colors not tested in high contrast
- Focus indicators not optimized for high contrast

#### Assessment
- Relies on browser/OS support
- No built-in optimization
- May not work well with Windows High Contrast

### Colorblind-Friendly UI - Weak (★★☆☆☆)

#### Support Level
- System-level color filters available
- No built-in colorblind simulation
- No palette validation
- No colorblind-specific features

#### Limitations
- Must use OS color filter settings
- No Excalidraw-specific colorblind support
- No in-app simulation tools

#### Assessment
- Reliant on OS features
- No first-party support
- Users must configure externally

### Zoom Accessibility - Moderate (★★★☆☆)

#### Features
- Browser zoom works
- Responsive layout
- No fixed-width constraints (mostly)

#### Testing Results
- 150% zoom: Works
- 200% zoom: Some toolbar wrapping
- Overall functional

#### Issues
- Not specifically optimized for zoom
- May need scroll at very high zoom

#### Assessment
- Functional at 200% zoom
- Could be better optimized
- Browser zoom is primary method

### WCAG 2.1 Compliance - Partial (★★★☆☆)

#### Known Non-Compliance
- **2.1.1 (Keyboard)** - Fails due to no keyboard drawing
- **2.4.7 (Focus Visible)** - Fails due to missing focus indicators
- **4.1.2 (Name, Role, Value)** - Fails due to missing ARIA labels

#### Compliant Areas
- **2.4.3 (Focus Order)** - When focus indicators present
- **1.4.3 (Contrast)** - Generally good (not tested)
- **3.2.1 (On Focus)** - No problematic on-focus changes

#### Assessment
- Significant WCAG 2.1 A failures
- Would require major changes for compliance
- Community aware of issues but no current fix timeline

### Known GitHub Issues

| Issue | Status | Severity | Description |
|-------|--------|----------|-------------|
| #7492 | Open | Critical | Deque audit - accessibility issues |
| #3100 | Open | High | Keyboard shortcuts for colors |
| #4779 | Open | High | Keyboard focus with touch input |
| #5215 | Referenced | Medium | WCAG compliance megathread |

### Recommended Improvement Path

**Phase 1 - Critical (Weeks 1-4)**
1. Add ARIA labels to all toolbar buttons
2. Implement visible focus indicators (2px, 3:1 contrast)
3. Fix duplicate element IDs
4. Create accessibility CSS for high contrast

**Phase 2 - Important (Weeks 5-8)**
1. Implement keyboard drawing mechanism
2. Add canvas description/fallback
3. Test with NVDA and JAWS
4. Document keyboard shortcuts

**Phase 3 - Enhancement (Weeks 9+)**
1. Add colorblind simulation
2. Enhance focus management
3. Implement zoom accessibility
4. Create accessibility documentation

---

## 3. Google Drawings - Basic Accessibility

### Keyboard Navigation - Limited (★★★☆☆)

#### Features
- Keyboard shortcuts available
- Tab navigation through UI
- Basic menu access via keyboard
- Braille display support

#### Limitations
- Limited shortcut documentation
- Canvas drawing requires mouse
- No comprehensive keyboard workflow
- Tool selection not as comprehensive

#### Typical Shortcuts
```
Ctrl+Z - Undo
Ctrl+Y - Redo
Delete - Delete selected
Escape - Deselect
Ctrl+A - Select all
```

#### Assessment
- Basic keyboard support
- Not fully keyboard-optimized
- Mouse required for many tasks

### Screen Reader Support - Moderate (★★★☆☆)

#### Features
- Compatible with NVDA, JAWS, VoiceOver
- Braille display support
- Screen reader can navigate menus
- Good for UI navigation

#### Limitations
- Canvas content not accessible
- Drawing workflow not screen reader friendly
- Limited announcements
- Not specifically optimized for screen readers

#### Assessment
- Works for menu navigation
- Limited for actual drawing tasks
- Adequate for document viewers

### High Contrast Mode - Weak (★★☆☆☆)

#### Support Level
- System-level high contrast works
- No Googl-specific optimization
- Relies on Chrome browser support
- Not specifically tested/optimized

#### How to Enable
- Windows: Settings > Ease of Access > High Contrast
- Chrome: Chrome high contrast mode or extensions
- Chromebook: System accessibility settings

#### Assessment
- Depends on external support
- No built-in optimization
- May require OS-level changes

### Colorblind-Friendly UI - Weak (★★☆☆☆)

#### Support Level
- System-level color filters only
- Chromebook color filter settings
- Chrome extensions available
- No Google Drawings-specific support

#### Limitations
- Must configure at OS/browser level
- No in-app support
- No colorblind simulation within app

#### Assessment
- No first-party support
- Reliant on external tools
- Users must self-configure

### Zoom Accessibility - Moderate (★★★☆☆)

#### Features
- Browser zoom supported
- Pinch-to-zoom on touch
- High-resolution graphics scale well
- Responsive interface

#### Testing Results
- 150% zoom: Good
- 200% zoom: Some toolbar adjustment needed
- Overall functional

#### Assessment
- Works at 200% zoom
- Good responsive design
- No specific zoom controls in app

### WCAG 2.1 Compliance - Partial (★★★☆☆)

#### Strategy
- Relies on Google Workspace accessibility
- Browser/OS features support compliance
- Not specifically optimized for canvas apps

#### Compliant Areas
- Basic keyboard navigation (WCAG 2.1.1)
- Focus order reasonable (WCAG 2.4.3)
- Text contrast good (WCAG 1.4.3)

#### Non-Compliant Areas
- Canvas drawing not keyboard accessible
- Screen reader support limited
- Colorblind support external

#### Assessment
- Partial compliance
- Adequate for basic tasks
- Not optimized for drawing with accessibility

---

## Comparative Analysis

### Keyboard-Only User Experience

| Task | Figma | Excalidraw | Google Drawings |
|------|-------|-----------|-----------------|
| Select tool | ✓ (R, C, etc) | ✓ (R, C, etc) | ⚠️ Menu-based |
| Draw shape | ✓ (Complete) | ✗ (Can't draw) | ✗ (Can't draw) |
| Change color | ✓ (Shift+F/S) | ⚠️ (Menu limited) | ⚠️ (Menu limited) |
| Undo/Redo | ✓ (Full) | ✓ (Full) | ✓ (Full) |
| Pan/Zoom | ✓ (Full) | ✓ (Partial) | ✓ (Partial) |
| **Overall** | **Fully accessible** | **Partially accessible** | **Partially accessible** |

### Screen Reader User Experience

| Task | Figma | Excalidraw | Google Drawings |
|------|-------|-----------|-----------------|
| Navigate toolbar | ✓ (Full) | ⚠️ (Missing labels) | ✓ (Adequate) |
| Understand state | ✓ (Announced) | ✗ (Not announced) | ⚠️ (Limited) |
| Use color picker | ✓ (Accessible) | ✗ (Not labeled) | ⚠️ (Difficult) |
| Manage layers | ✓ (Full) | ⚠️ (Limited) | ⚠️ (Limited) |
| **Overall** | **Good support** | **Poor support** | **Basic support** |

### Colorblind User Experience

| Feature | Figma | Excalidraw | Google Drawings |
|---------|-------|-----------|-----------------|
| Safe color palette | ✓ (Some) | ⚠️ (Default) | ⚠️ (Default) |
| Colorblind simulation | ✓ (Stark) | ✗ (None) | ✗ (None) |
| Test during design | ✓ (Yes) | ✗ (No) | ✗ (No) |
| Non-color distinction | ✓ (Icon support) | ⚠️ (Minimal) | ⚠️ (Minimal) |
| **Overall** | **Best support** | **Poor support** | **Poor support** |

---

## Recommendations by Use Case

### For Accessibility-First Design Tool
**→ Choose: Figma**

**Why:**
- Most comprehensive keyboard support
- Best screen reader integration
- Colorblind simulation with Stark
- WCAG 2.1 AA compliance
- Active accessibility development

**Cost:** Free (basic) to $12+/month (pro)

### For Quick Diagramming (Teaching/Presentation)
**→ Choose: Excalidraw**

**Why:**
- Good keyboard shortcut system
- Simple learning curve
- Web-based (no installation)
- Works with browser zoom
- Community-driven (improvements coming)

**Note:** Not recommended for users needing screen reader or keyboard-only access

**Cost:** Free

### For Google Workspace Integration
**→ Choose: Google Drawings**

**Why:**
- Works within Google Suite
- Basic accessibility adequate
- Good for simple diagrams
- Easy collaboration
- Cloud-based

**Note:** Not ideal for accessibility needs; better for simple tasks

**Cost:** Free with Google account

---

## Key Findings

### Universal Challenges

1. **Canvas Drawing Keyboard Support**
   - No tool has perfect keyboard drawing workflow
   - Figma is closest to accessible
   - Excalidraw and Google Drawings lack this

2. **Screen Reader Limitations**
   - Canvas content inherently difficult to expose
   - All three rely on fallback descriptions
   - Toolbar/controls can be fully accessible

3. **Colorblind Support**
   - Only Figma has built-in colorblind simulation
   - Other two rely on external tools
   - Design-time testing is important

### What Works Well (All Three)

1. **Keyboard Shortcuts**
   - All three have keyboard shortcuts for tools
   - Well-documented in Figma, less so in others
   - Good for efficiency even if not fully accessible

2. **Zoom Support**
   - All three support browser zoom to 200%
   - Layout responsive at zoom levels
   - Good zoom accessibility

3. **Undo/Redo**
   - All three have keyboard shortcuts
   - Critical for accessibility
   - Well-implemented in all

### Critical Gaps

1. **Figma:** Limited canvas content accessibility (inherent limitation)
2. **Excalidraw:** No keyboard drawing, missing ARIA labels, no focus indicators
3. **Google Drawings:** Limited screen reader support, no colorblind simulation

---

## Implementing Accessibility in Your Drawing App

### Learn From Figma's Approach
- Comprehensive keyboard shortcuts
- Stark integration for colorblind testing
- Accessible color palettes
- Layer panel accessibility
- Focus management

### Avoid Excalidraw's Issues
- Don't skip ARIA labels
- Do implement visible focus indicators
- Do support keyboard drawing
- Do test with screen readers early
- Do get accessibility audit (they did)

### Enhance Beyond Google Drawings
- Build in colorblind simulation
- Comprehensive keyboard support
- Explicit high contrast CSS
- Better screen reader announcements

---

## Summary

| Aspect | Best | Reason |
|--------|------|--------|
| **Keyboard** | Figma | Full drawing support with keyboard |
| **Screen Reader** | Figma | Proper ARIA, good focus management |
| **Colorblind** | Figma | Stark plugin with full simulation |
| **High Contrast** | Figma | Explicit CSS optimization |
| **WCAG Compliance** | Figma | 2.2 AA target, active development |
| **Best Free Option** | Excalidraw* | Good keyboard shortcuts, improving |
| **Workspace Integration** | Google Drawings | Works in Google Suite |

*Excalidraw is improving but currently has critical accessibility gaps


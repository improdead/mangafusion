# Accessibility Implementation Checklist
## Quick Reference for Drawing Applications

---

## Phase 1: Pre-Development Setup

### Planning
- [ ] Accessibility requirements in project scope
- [ ] Budget for testing tools (axe Pro, Stark, JAWS)
- [ ] Team accessibility training scheduled
- [ ] WCAG 2.1 AA set as compliance target
- [ ] Testing schedule defined (before launch minimum)

### Tools & Resources
- [ ] NVDA installed for testing (free)
- [ ] WCAG Contrast Checker bookmarked
- [ ] axe DevTools browser extension installed
- [ ] Color blindness simulator accessed
- [ ] Keyboard tester setup (browser + OS)

---

## Phase 2: Keyboard Navigation (WCAG 2.1.1)

### Toolbar Implementation
- [ ] All toolbar buttons focusable with Tab
- [ ] Logical focus order (left-to-right, top-to-bottom)
- [ ] All buttons respond to Enter or Space
- [ ] No keyboard traps (focus can exit any element)
- [ ] Escape key closes menus/dialogs/modals

### Keyboard Shortcuts
- [ ] Selection tool: **S**
- [ ] Rectangle tool: **R**
- [ ] Circle tool: **C**
- [ ] Line tool: **L**
- [ ] Text tool: **T**
- [ ] Pencil/Pen tool: **P**
- [ ] Undo: **Ctrl+Z** (Cmd+Z on Mac)
- [ ] Redo: **Ctrl+Y** (Cmd+Y on Mac)
- [ ] Save: **Ctrl+S** (Cmd+S on Mac)
- [ ] Delete selected: **Delete** key
- [ ] Select all: **Ctrl+A** (Cmd+A on Mac)
- [ ] Deselect: **Escape**
- [ ] Zoom in: **Ctrl+Plus** (Cmd+Plus on Mac)
- [ ] Zoom out: **Ctrl+Minus** (Cmd+Minus on Mac)
- [ ] Fit to screen: **Ctrl+0** (Cmd+0 on Mac)
- [ ] Help/Shortcuts: **Shift+?**
- [ ] Quick actions: **Ctrl+/** (Cmd+/ on Mac)

### Color & Stroke Controls
- [ ] Fill color accessible via Tab + arrow keys
- [ ] Stroke width adjustable via keyboard
- [ ] Opacity adjustable via keyboard
- [ ] Quick color picker: **Shift+F** (fill), **Shift+S** (stroke)

### Canvas Navigation (Accessibility Mode)
- [ ] Canvas focusable (tabindex="0")
- [ ] Arrow keys pan canvas
- [ ] **Ctrl+Tab** toggles canvas navigation mode
- [ ] **Page Up/Down** scroll canvas
- [ ] **Home/End** scroll to canvas edges

### Verification
- [ ] Test full UI with Tab key only (no mouse)
- [ ] Verify no mouse-dependent actions
- [ ] Check focus never gets trapped
- [ ] Test on Windows, Mac, Linux if possible

---

## Phase 3: Focus Management (WCAG 2.4.3, 2.4.7)

### Focus Indicator Implementation
```css
/* Must have visible focus for all interactive elements */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[role="button"]:focus-visible,
canvas:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

/* For high contrast mode */
@media (prefers-contrast: more) {
  *:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}
```

### Focus Order Testing
- [ ] Tab through entire toolbar (left-to-right)
- [ ] Tab through main controls (top-to-bottom)
- [ ] Focus order matches visual layout
- [ ] Related controls grouped logically
- [ ] Focus visible at all zoom levels
- [ ] Focus indicator 2px minimum, 3:1 contrast

### Custom Controls Focus
- [ ] Canvas element has focus ring when tabbed to
- [ ] Color pickers focusable and operable with Tab
- [ ] Custom dropdowns Tab-accessible
- [ ] Modal dialogs trap focus (Tab loops within)
- [ ] Modal close button easily found

### Windows High Contrast
- [ ] Enable on Windows (Settings > Ease of Access > High Contrast)
- [ ] Test focus indicators visible
- [ ] Test toolbar buttons visible
- [ ] Test canvas border visible
- [ ] Test color swatches visible

---

## Phase 4: Screen Reader Support (WCAG 4.1.2)

### Canvas Setup
```html
<canvas
  id="drawing-canvas"
  role="img"
  aria-label="Drawing canvas - sketch your design here"
  aria-describedby="canvas-help"
  tabindex="0"
></canvas>
<p id="canvas-help" hidden>
  Select tools from the toolbar. Press Shift+? to see keyboard shortcuts.
</p>

<div id="canvas-announcer" aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Screen reader announcements will go here -->
</div>
```

### Toolbar Labels
- [ ] All buttons have visible text OR aria-label
- [ ] Icon-only buttons have aria-label
- [ ] Labels clearly describe action
- [ ] Tooltips contain shortcut hints
- [ ] Tool state changes announced (e.g., "Rectangle tool selected")

### Color Controls
```html
<!-- Color Picker Group -->
<div role="group" aria-labelledby="fill-label">
  <label id="fill-label">Fill Color</label>
  <input
    type="color"
    id="fill-color"
    value="#0066CC"
    aria-label="Fill color, currently blue (RGB 0, 102, 204)"
  />
</div>

<!-- Stroke Width -->
<div role="group" aria-labelledby="stroke-label">
  <label id="stroke-label">Stroke Width</label>
  <input
    type="range"
    id="stroke-width"
    min="1"
    max="20"
    value="2"
    aria-label="Stroke width"
    aria-valuetext="2 pixels"
  />
</div>
```

### Announcements
- [ ] Shape created: "Rectangle created"
- [ ] Shape deleted: "3 shapes deleted"
- [ ] Tool selected: "Line tool selected, press L"
- [ ] Color changed: "Fill color changed to blue"
- [ ] Action completed: "Saved successfully"

### Screen Reader Testing
- [ ] Test with NVDA on Windows
- [ ] Test with JAWS if budget allows
- [ ] Test with VoiceOver on Mac
- [ ] Verify all buttons announced correctly
- [ ] Verify state changes announced
- [ ] Verify color values readable

---

## Phase 5: Color & Contrast (WCAG 1.4.3, 1.4.11)

### Text Contrast
- [ ] Normal text: **4.5:1** minimum (WCAG AA)
- [ ] Large text (18pt+): **3:1** minimum (WCAG AA)
- [ ] Test with WCAG Contrast Checker
- [ ] Test in browser dark mode
- [ ] Test in high contrast mode

### Graphics/Icon Contrast
- [ ] Icons: **3:1** contrast minimum
- [ ] Focus indicators: **3:1** contrast
- [ ] Toolbar: **3:1** contrast for all icons
- [ ] Color swatches: **3:1** contrast
- [ ] Borders/separators: **3:1** contrast

### Verification Tools
- [ ] Use WebAIM Contrast Checker
- [ ] Test every text/background combination
- [ ] Create a contrast ratio spreadsheet
- [ ] Document any exceptions

---

## Phase 6: Colorblind-Friendly Design

### Palette Selection
**Safe Base Colors:**
- [ ] Blue: #0066CC (primary, works for all types)
- [ ] Orange: #FF9900 (secondary, works for all types)
- [ ] Yellow: #FFCC00 (tertiary, works for protanopia/deuteranopia)
- [ ] Black: #000000
- [ ] White: #FFFFFF

**AVOID These Combinations:**
- [ ] Red + Green (worst, most problematic)
- [ ] Blue + Purple (problematic for tritanopia)
- [ ] Blue + Gray
- [ ] Brown + Green
- [ ] Light Blue + White

### Status Colors
- [ ] Success: Use BLUE (#0066CC), not green
- [ ] Warning: Use ORANGE (#FF9900), not yellow
- [ ] Error: Use DARK RED (#CC0000), not light red
- [ ] Info: Use BLUE (#0066CC)

### Never Use Color Alone
```html
<!-- WRONG -->
<button style="color: green;">✓</button>

<!-- CORRECT -->
<button class="success">
  <svg aria-hidden="true" class="icon"><!-- checkmark --></svg>
  <span>Success</span>
</button>
```

### Add Additional Visual Cues
- [ ] Use icons in addition to color
- [ ] Use text labels in addition to color
- [ ] Use patterns/strokes for distinction
- [ ] Use shapes for distinction
- [ ] Use line styles for distinction

### Colorblind Simulation Testing
- [ ] Test with Stark plugin (Figma) or Coblis (web)
- [ ] Simulate protanopia (red-blind)
- [ ] Simulate deuteranopia (green-blind)
- [ ] Simulate tritanopia (blue-blind)
- [ ] Verify UI still distinguishable in all modes
- [ ] Get feedback from colorblind user if possible

---

## Phase 7: Zoom & Text Sizing (WCAG 1.4.4, 1.4.10)

### Viewport Configuration
```html
<!-- Allow zoom (CRITICAL) -->
<meta name="viewport" content="initial-scale=1, user-scalable=yes">

<!-- NOT this (WRONG): -->
<!-- <meta name="viewport" content="user-scalable=no"> -->
```

### CSS Units
- [ ] Use `rem` for font sizes (scales with zoom)
- [ ] Use `em` for paddings/margins when possible
- [ ] Avoid hardcoded `px` for critical text
- [ ] Use flexible layouts (flexbox, grid)
- [ ] No fixed-width containers that break layout

### Zoom Testing
- [ ] Test at 100% zoom (baseline)
- [ ] Test at 150% zoom (browser zoom)
- [ ] Test at 200% zoom (WCAG requirement)
- [ ] Verify no horizontal scrolling at 200%
- [ ] Verify toolbar accessible at 200%
- [ ] Verify canvas accessible at 200%
- [ ] Test on 1024x768 viewport at 200% zoom

### Zoom Controls
```html
<!-- Zoom controls in app (separate from browser zoom) -->
<div role="toolbar" aria-label="Zoom controls">
  <button id="zoom-in" aria-label="Zoom in">+</button>
  <button id="zoom-out" aria-label="Zoom out">−</button>
  <button id="zoom-fit" aria-label="Fit to screen">Fit</button>
  <span aria-live="polite" aria-label="Current zoom level">
    <input type="number" min="25" max="400" value="100" aria-label="Zoom percentage">
    %
  </span>
</div>
```

### Testing Checklist
- [ ] Toolbar buttons readable at 200% zoom
- [ ] Color picker usable at 200% zoom
- [ ] Text not cut off at 200% zoom
- [ ] Focus indicators visible at 200% zoom
- [ ] No essential content hidden at 200% zoom
- [ ] Use browser zoom, not viewport changes

---

## Phase 8: Alternative Input Methods

### Keyboard-First Design
- [ ] All functionality keyboard accessible (done in Phase 2)
- [ ] This automatically supports:
  - Voice control (Windows/Mac)
  - Switch control (Mac/iOS)
  - Eye-tracking
  - Sip-and-puff devices
  - Adaptive joysticks

### Supporting Multiple Inputs
- [ ] Ensure all buttons have clear aria-labels
- [ ] Ensure focus indicators visible (for voice/switch/eye-tracking)
- [ ] No time-limited interactions
- [ ] No pointer-only interactions
- [ ] No drag-and-drop as only input method

### No Special Implementation Needed For:
- [ ] Voice control - works if buttons are labeled
- [ ] Switch control - works if keyboard accessible
- [ ] Eye-tracking - works if keyboard accessible
- [ ] Joystick - works if keyboard accessible

### Touch Accessibility
- [ ] Buttons 44x44px minimum (iOS/Android standard)
- [ ] 8px padding minimum around touch targets
- [ ] Touch targets don't overlap
- [ ] No hover-dependent information

---

## Phase 9: Mobile & Touch Accessibility

### Touch Targets
- [ ] All buttons 44x44px minimum
- [ ] 8px minimum spacing between targets
- [ ] No overlapping touch areas
- [ ] Touch feedback visible (highlight)

### Orientation
- [ ] Works in portrait and landscape
- [ ] Content accessible in both orientations
- [ ] No forced orientation lock (unless essential)

### Mobile Screen Readers
- [ ] Test with TalkBack (Android)
- [ ] Test with VoiceOver (iOS)
- [ ] All buttons announced correctly
- [ ] Swipe navigation works
- [ ] Rotor menu accessible

---

## Phase 10: Testing & Validation

### Automated Testing
- [ ] Run axe DevTools (no critical/serious errors)
- [ ] Run Lighthouse accessibility audit (score 90+)
- [ ] Run WAVE (no errors)
- [ ] Run contrast checker on all text/graphics

### Manual Testing - Keyboard Only
- [ ] [ ] Tab through entire UI (no mouse)
- [ ] Use all keyboard shortcuts
- [ ] Test on Windows keyboard layout
- [ ] Test on Mac keyboard layout
- [ ] Verify no keyboard traps

### Manual Testing - Screen Readers
**NVDA (Windows):**
- [ ] Download NVDA from https://www.nvaccess.org/
- [ ] Start NVDA (Ctrl+Alt+N typically)
- [ ] Test with Chrome
- [ ] Test button labels announced
- [ ] Test state changes announced

**VoiceOver (Mac):**
- [ ] Enable: Cmd+F5
- [ ] Navigate: VO+arrow keys
- [ ] Activate: VO+space
- [ ] Close: Cmd+F5

**JAWS (Windows, if budget allows):**
- [ ] Contract with vendor or trial period
- [ ] Run JAWS with Chrome/Edge
- [ ] Comprehensive testing

### Manual Testing - High Contrast
- [ ] Windows: Settings > Ease of Access > High Contrast
- [ ] Test all toolkit colors visible
- [ ] Test focus indicators visible
- [ ] Test canvas border visible
- [ ] Test icons/graphics visible

### Manual Testing - Zoom
- [ ] Browser zoom to 150% (Ctrl++ or Cmd++)
- [ ] Browser zoom to 200% (Ctrl++ x4 or Cmd++ x4)
- [ ] Verify no horizontal scrolling
- [ ] Verify toolbar accessible
- [ ] Reset zoom (Ctrl+0 or Cmd+0)

### Manual Testing - Colorblind
- [ ] Use Coblis simulator: https://www.color-blindness.com/
- [ ] Test with protanopia filter
- [ ] Test with deuteranopia filter
- [ ] Test with tritanopia filter
- [ ] Verify status colors distinguishable
- [ ] Verify UI still usable in all modes

### User Testing (Ideally)
- [ ] Test with user who is blind/low vision
- [ ] Test with user who is colorblind
- [ ] Test with user with motor disability
- [ ] Test with user with hearing disability (captions)
- [ ] Get feedback on usability

---

## Phase 11: Documentation

### User Documentation
- [ ] Keyboard shortcuts guide (in-app, Shift+?)
- [ ] Accessibility features documented
- [ ] Alt text strategy documented
- [ ] Known limitations documented
- [ ] Contact info for accessibility feedback

### Code Documentation
- [ ] ARIA patterns documented
- [ ] Keyboard handling documented
- [ ] Focus management documented
- [ ] Color palette documented (with contrast ratios)
- [ ] Shortcut key mappings documented

### Accessibility Statement
Create page documenting:
- [ ] WCAG 2.1 AA compliance target
- [ ] Features implemented
- [ ] Known limitations
- [ ] Browser/AT support
- [ ] Contact for feedback: accessibility@yourdomain.com

---

## Phase 12: Launch & Maintenance

### Pre-Launch Checklist
- [ ] All Phase 1-11 items completed
- [ ] Automated test results reviewed (no critical errors)
- [ ] Manual testing completed
- [ ] Documentation published
- [ ] Accessibility statement live
- [ ] Contact email monitored

### Post-Launch Monitoring
- [ ] Monitor accessibility feedback email
- [ ] Track accessibility issues in bug tracker
- [ ] Schedule quarterly accessibility audits
- [ ] Update when new tools added to interface
- [ ] Test new browser/OS versions
- [ ] Update WCAG compliance target (aim for 2.2 when 2.1 complete)

### Maintenance Tasks
- [ ] Monthly: Check broken links in accessibility docs
- [ ] Quarterly: Run automated accessibility scan
- [ ] Yearly: Manual accessibility audit
- [ ] Yearly: Get feedback from disabled user community
- [ ] As-needed: Fix reported accessibility issues (prioritize critical)

---

## Estimated Time Investment

### Initial Implementation
- Keyboard shortcuts & navigation: **2-3 weeks** (depends on complexity)
- Focus management & testing: **1-2 weeks**
- ARIA labels & screen reader support: **1-2 weeks**
- Color & contrast updates: **3-5 days**
- Zoom & responsiveness: **1 week**
- Testing & validation: **2-3 weeks**
- **Total: 7-10 weeks** for comprehensive implementation

### Ongoing Maintenance
- Monthly: **4-8 hours**
- Quarterly: **1-2 days**
- Yearly: **1 week** for full audit

---

## Tool Quick Links

| Tool | Cost | Use Case |
|------|------|----------|
| [axe DevTools](https://www.deque.com/axe/devtools/) | Free | Quick WCAG scanning |
| [WAVE](https://wave.webaim.org/) | Free | Visual accessibility feedback |
| [NVDA](https://www.nvaccess.org/) | Free | Screen reader testing (Windows) |
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | Free | Test contrast ratios |
| [Coblis Simulator](https://www.color-blindness.com/) | Free | Test colorblind simulation |
| [JAWS](https://www.freedomscientific.com/products/software/jaws/) | $90/year | Professional screen reader |
| [Stark (Figma)](https://www.getstark.co/) | $5/month | Contrast + colorblind testing |
| [macOS VoiceOver](https://support.apple.com/guide/voiceover/welcome/mac) | Free | Built-in screen reader |

---

## Emergency Fixes (If Launch Issues Found)

### Critical (Fix Before Public Launch)
1. Keyboard navigation completely broken
2. Focus indicators missing
3. Canvas not labeled for screen readers
4. Critical text contrast < 4.5:1

### High Priority (Fix Within 1 Week)
1. Some keyboard shortcuts missing
2. Some focus indicators missing
3. Some color contrast < 4.5:1
4. Some toolbar buttons unlabeled

### Medium Priority (Fix Within 1 Month)
1. Missing colorblind palette options
2. Zoom at 200% not fully tested
3. Screen reader announcements incomplete
4. Some alternative input methods not working

### Low Priority (Fix When Possible)
1. Help documentation incomplete
2. Accessibility statement not written
3. Not tested with user feedback yet
4. Not tested on all browsers/ATs

---

## Final Notes

**Remember:**
- Accessibility is NOT a feature - it's a requirement
- Build accessible from start, don't retrofit
- Keyboard-first design benefits EVERYONE
- Test with real users with disabilities
- Keep improving - WCAG 2.1 is minimum, aim for 2.2

**Key Stats:**
- 1 in 4 adults have some type of disability
- ~2% of population is colorblind
- Keyboard-only users: ~3-5% (includes elderly, injured, assistive tech users)
- Screen reader users: ~1-2% (plus many more who benefit from other features)

**Impact of Accessibility:**
- Larger potential user base (16-20% population)
- Better SEO (search engines like accessible code)
- Increased mobile usability
- Improved code quality
- Better keyboard UX for power users
- Legal compliance (AODA, ADA, Section 508)


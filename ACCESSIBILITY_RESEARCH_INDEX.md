# Accessibility for Drawing Applications - Research Index

## Document Overview

This research provides comprehensive guidance on accessibility considerations for drawing applications, with analysis of Figma, Excalidraw, and Google Drawings, plus implementation guides and code examples.

---

## Documents in This Research

### 1. **ACCESSIBILITY_DRAWING_APPS_RESEARCH.md** (Comprehensive Reference)
**Size:** ~15,000 words | **Read Time:** 60-90 minutes

**Contents:**
- Executive summary of accessibility challenges
- Detailed analysis of Figma, Excalidraw, Google Drawings
- WCAG 2.1 compliance requirements (all criteria explained)
- Keyboard-only navigation implementation guide
- Screen reader support strategies (including canvas limitations)
- High contrast mode implementation
- Colorblind-friendly UI design (protanopia, deuteranopia, tritanopia)
- Zoom accessibility requirements
- Alternative input methods (voice, switch, eye-tracking)
- WCAG compliance checklist by criterion
- Common pitfalls and solutions
- References and resources

**Best For:** Comprehensive understanding of accessibility for drawing apps
**Use When:** Planning a new feature, writing accessibility policies, training team

---

### 2. **ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md** (Quick Reference)
**Size:** ~8,000 words | **Read Time:** 30-45 minutes

**Contents:**
- 12-phase implementation roadmap
- Quick checkboxes for each accessibility aspect:
  - Keyboard navigation (WCAG 2.1.1)
  - Focus management (WCAG 2.4.3, 2.4.7)
  - Screen reader support (WCAG 4.1.2)
  - High contrast mode (prefers-contrast)
  - Color and contrast (WCAG 1.4.3, 1.4.11)
  - Colorblind accessibility
  - Zoom and text sizing (WCAG 1.4.4, 1.4.10)
  - Alternative input methods
  - Mobile and touch
  - Testing and validation
  - Documentation
  - Launch and maintenance
- Estimated time investment
- Tool quick links
- Emergency fixes by priority

**Best For:** Day-to-day implementation work
**Use When:** Building accessibility features, testing, preparing for launch

---

### 3. **ACCESSIBILITY_CODE_EXAMPLES.md** (Ready-to-Use Code)
**Size:** ~6,000 words | **Read Time:** 30-45 minutes

**Contents:**
- Accessible canvas element (HTML, CSS, TypeScript)
- Accessible toolbar implementation (HTML, CSS, TypeScript)
- Keyboard shortcuts help dialog (HTML, CSS, TypeScript)
- High contrast mode detection (TypeScript)
- Color contrast validator (TypeScript with WCAG formulas)
- Colorblind-friendly palette manager (TypeScript)
- Zoom management system (TypeScript)

**Best For:** Copy-paste reference implementations
**Use When:** Coding features, need working examples, implementing specific features

---

### 4. **ACCESSIBILITY_TOOLS_COMPARISON.md** (Market Analysis)
**Size:** ~8,000 words | **Read Time:** 30-45 minutes

**Contents:**
- Comparison table (all tools, all features)
- Detailed analysis of each tool:
  - **Figma** (★★★★☆ - Most Accessible)
    - 100+ keyboard shortcuts
    - Excellent screen reader support
    - Stark plugin for colorblind testing
    - WCAG 2.2 AA target
  - **Excalidraw** (★★★☆☆ - Developing)
    - Good keyboard shortcuts
    - CRITICAL GAP: Cannot draw with keyboard
    - Missing ARIA labels
    - Missing focus indicators
    - Deque audit findings
  - **Google Drawings** (★★★☆☆ - Basic)
    - Basic keyboard support
    - Limited screen reader features
    - System-level accessibility reliance
    - Good for simple tasks only
- Comparative analysis tables
- GitHub issues and status
- Use case recommendations
- Key findings and gap analysis

**Best For:** Competitive analysis, choosing tools, understanding market state
**Use When:** Evaluating tools, writing reports, making tool selection decisions

---

## Quick Start Guide

### I need to implement accessibility RIGHT NOW (30 minutes)

1. Read: **ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md** (Phase 1-3)
2. Use: **ACCESSIBILITY_CODE_EXAMPLES.md** (Section 1-2: Canvas & Toolbar)
3. Start with:
   - Keyboard shortcuts (see Section 1)
   - Focus indicators (CSS in Section 1)
   - ARIA labels (HTML in Section 1-2)

### I'm implementing a new feature and need guidance (2-4 hours)

1. Read: **ACCESSIBILITY_DRAWING_APPS_RESEARCH.md** (relevant section)
2. Reference: **ACCESSIBILITY_CODE_EXAMPLES.md** (matching feature)
3. Checklist: **ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md** (relevant phase)
4. Copy code and adapt to your implementation

### I'm planning an accessibility initiative (4-8 hours)

1. Read: **ACCESSIBILITY_DRAWING_APPS_RESEARCH.md** (full)
2. Study: **ACCESSIBILITY_TOOLS_COMPARISON.md** (learn from others)
3. Create: Implementation plan using **ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md**
4. Reference: **ACCESSIBILITY_CODE_EXAMPLES.md** (when building)

### I'm evaluating tools or writing a report (2-4 hours)

1. Read: **ACCESSIBILITY_TOOLS_COMPARISON.md** (full)
2. Reference: **ACCESSIBILITY_DRAWING_APPS_RESEARCH.md** (specific sections)
3. Use comparison tables for reports
4. Reference GitHub issues for due diligence

---

## Key Topics by Document

### Keyboard Navigation
- **Research:** WCAG 2.1.1, Part 3 (comprehensive guide)
- **Checklist:** Phase 2 (implementation checklist)
- **Code:** Section 2-3 (toolbar & shortcuts)
- **Tools:** Figma comparison (keyboard scores)

### Screen Reader Support
- **Research:** Part 4 (limitations & best practices)
- **Checklist:** Phase 4 (implementation checklist)
- **Code:** Section 1-2 (ARIA labels & roles)
- **Tools:** Tool comparison (screen reader scores)

### Color & Contrast
- **Research:** Part 6 (colorblind types & safe palettes)
- **Checklist:** Phase 6 (palette selection & testing)
- **Code:** Section 5 (contrast validator)
- **Code:** Section 6 (palette manager)
- **Tools:** Figma analysis (colorblind simulation)

### High Contrast Mode
- **Research:** Part 5 (Windows high contrast CSS)
- **Checklist:** Phase 5 (testing & implementation)
- **Code:** Section 4 (detection & media queries)
- **Tools:** All three tools analyzed

### Zoom Accessibility
- **Research:** Part 7 (WCAG 1.4.4, 1.4.10)
- **Checklist:** Phase 7 (viewport & testing)
- **Code:** Section 7 (zoom manager)
- **Tools:** All three tools analyzed

### Alternative Inputs
- **Research:** Part 8 (voice, switch, eye-tracking)
- **Checklist:** Phase 8 (no special implementation)
- **Code:** N/A (keyboard support is sufficient)
- **Tools:** Discussion of keyboard requirement

---

## WCAG 2.1 AA Compliance Map

### Critical Success Criteria (Must Have)

| Criterion | Location in Research | Priority | Effort |
|-----------|---------------------|----------|--------|
| 2.1.1 Keyboard | Research Part 3 | Critical | High |
| 2.1.2 No Keyboard Trap | Checklist Phase 2 | Critical | Medium |
| 2.4.3 Focus Order | Checklist Phase 3 | Critical | Medium |
| 2.4.7 Focus Visible | Checklist Phase 3 | Critical | Low |
| 4.1.2 Name, Role, Value | Checklist Phase 4 | Critical | High |
| 1.4.3 Contrast (Text) | Checklist Phase 5 | Critical | Medium |
| 1.4.11 Non-text Contrast | Checklist Phase 5 | Critical | Medium |

### Important Success Criteria (Should Have)

| Criterion | Location in Research | Priority | Effort |
|-----------|---------------------|----------|--------|
| 1.4.4 Resize Text | Checklist Phase 7 | High | Low |
| 1.4.10 Reflow | Checklist Phase 7 | High | Medium |
| 2.5.2 Pointer Cancellation | Research Part 2 | High | Medium |
| 3.2.1 On Focus | Checklist Phase 9 | Medium | Low |
| 3.3.4 Error Prevention | Checklist Phase 2 | Medium | Medium |

---

## Tool Requirements

### For Implementation
- **Code Editor:** VS Code or similar (for TypeScript examples)
- **Browser:** Chrome or Firefox (with DevTools)
- **Testing Tools:**
  - **axe DevTools** (free)
  - **WAVE** (free browser extension)
  - **NVDA** (free, Windows)
  - **VoiceOver** (built-in, Mac)

### For Color/Contrast Work
- **WCAG Contrast Checker** (free online)
- **Adobe Color** (free, has colorblind simulator)
- **Coblis** (free colorblind simulator)
- **Stark** (if using Figma, $5/month)

### For Testing
- **Keyboard:** No tool needed (use keyboard only)
- **High Contrast:** Windows settings (no tool needed)
- **Zoom:** Browser zoom (Ctrl++ or Cmd++)
- **Screen Readers:** NVDA (free) or JAWS (paid)

---

## Implementation Timeline

### Week 1-2: Planning & Setup
- [ ] Read all documents
- [ ] Install testing tools
- [ ] Create accessibility requirements document
- [ ] Brief team on WCAG 2.1 AA

### Week 3-4: Keyboard Navigation
- [ ] Implement keyboard shortcuts (Research Part 3)
- [ ] Use code examples from Section 2-3
- [ ] Focus on Phase 2 checklist items
- [ ] Test with keyboard only

### Week 5-6: Focus & ARIA
- [ ] Implement focus management (Research Part 3)
- [ ] Add ARIA labels (Code Section 1-2)
- [ ] Follow Phase 3-4 checklist
- [ ] Test with axe DevTools

### Week 7-8: Color & Contrast
- [ ] Create accessible palette (Research Part 6)
- [ ] Implement color validator (Code Section 5)
- [ ] Test contrast ratios
- [ ] Colorblind simulation testing

### Week 9-10: Zoom & High Contrast
- [ ] Implement zoom management (Code Section 7)
- [ ] Add high contrast CSS (Code Section 4)
- [ ] Test at 200% zoom
- [ ] Test in Windows High Contrast

### Week 11-12: Testing & Documentation
- [ ] Full keyboard navigation testing
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] Accessibility audit
- [ ] Documentation and training

---

## Common Questions Answered

### Q: Why is keyboard navigation so important?
**A:** Keyboard support automatically enables voice control, switch control, eye-tracking, and joystick input. One accessible feature (keyboard) benefits multiple user groups.

**Reference:** Research Part 8

### Q: Can we make canvas content fully accessible to screen readers?
**A:** No. Canvas is a bitmap. Best practice is using ARIA labels, fallback text, and real-time announcements. This is a known limitation across all drawing apps.

**Reference:** Research Part 4

### Q: Why doesn't Excalidraw support keyboard drawing?
**A:** Canvas drawing requires pointer-based input (mouse, touch). Keyboard would require a different interaction model (menu-based drawing). This is a design challenge, not a limitation of technology.

**Reference:** Tools Comparison, Excalidraw section

### Q: How much does accessibility cost?
**A:** If built from start: ~5-10% of development time. If retrofitted: 15-30% of development time. Cost of not doing it: potential legal liability + excluded users.

**Reference:** Checklist, Estimated Time Investment

### Q: Do we need to support Figma's level of keyboard support?
**A:** No. Figma has 100+ shortcuts because it's a professional tool. For a drawing app, essential shortcuts for tools + editing is sufficient (20-30 shortcuts).

**Reference:** Tools Comparison, Figma section

### Q: What's the minimum viable accessibility?
**A:** WCAG 2.1 A level:
- All functionality keyboard accessible
- No keyboard traps
- Logical focus order
- Visible focus indicators
- Accessible names for components
- Proper HTML semantics
- Text resizable to 200%

**Reference:** Checklist Phase 1-3

---

## Accessibility by Role

### For Designers
- **Read:** ACCESSIBILITY_TOOLS_COMPARISON.md (learn from Figma's approach)
- **Read:** ACCESSIBILITY_DRAWING_APPS_RESEARCH.md Part 6 (colorblind design)
- **Use:** Code Section 6 (accessible palette)
- **Action:** Design with colorblind simulation enabled

### For Developers
- **Read:** ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md (phases 2-4, 7)
- **Use:** ACCESSIBILITY_CODE_EXAMPLES.md (all sections)
- **Reference:** ACCESSIBILITY_DRAWING_APPS_RESEARCH.md (specific criteria)
- **Action:** Implement features using code examples

### For QA/Testers
- **Read:** ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md (phases 9-10)
- **Reference:** ACCESSIBILITY_DRAWING_APPS_RESEARCH.md (criteria definitions)
- **Use:** Tools: axe DevTools, NVDA, WAVE
- **Action:** Execute test plans from checklist

### For Product Managers
- **Read:** ACCESSIBILITY_TOOLS_COMPARISON.md (understand market)
- **Read:** ACCESSIBILITY_DRAWING_APPS_RESEARCH.md (introduction)
- **Reference:** ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md (timeline)
- **Action:** Create accessibility roadmap

### For Technical Leads
- **Read:** All documents (full context)
- **Create:** Implementation plan from Checklist
- **Coordinate:** Cross-functional team using documents
- **Ensure:** Adherence to WCAG 2.1 AA

---

## Accessibility Standards Reference

### WCAG 2.1 AA (Recommended Target)
- **Level A:** Minimum compliance
- **Level AA:** Recommended (this is the target)
- **Level AAA:** Enhanced (aim for, but not required)

**Number of Criteria:**
- Level A: 25 criteria
- Level AA: 50 criteria total (includes Level A)
- Level AAA: 78 criteria total (includes Levels A & AA)

**Estimated Effort:**
- Level A: Low (5-10% effort)
- Level AA: Medium (15-20% effort)
- Level AAA: High (25-35% effort)

**Reference:** Research Part 2 (full WCAG breakdown)

### WCAG 2.2 (Latest, 2023)
- Minor improvements to WCAG 2.1
- Better guidance for mobile accessibility
- New criteria on target size
- Recommended to target 2.2 instead of 2.1

**Reference:** Tools Comparison (Figma targets 2.2)

---

## Success Metrics

### Implementation Completion
- [ ] All Phase 1-10 checklist items complete
- [ ] axe DevTools scan: Zero critical/serious errors
- [ ] WAVE scan: No errors
- [ ] Lighthouse audit: 90+ accessibility score
- [ ] Keyboard-only navigation: All tasks completable
- [ ] NVDA/VoiceOver: Toolbar fully navigable
- [ ] 200% zoom: All controls accessible
- [ ] Windows High Contrast: All controls visible

### User Impact
- [ ] Keyboard-only users can create drawings
- [ ] Colorblind users can distinguish UI elements
- [ ] Low-vision users can zoom to 200% and use app
- [ ] Screen reader users can navigate toolbar
- [ ] Motor disability users can use switch/voice
- [ ] Users provide positive accessibility feedback

---

## Ongoing Maintenance

### Monthly (4-8 hours)
- Check accessibility feedback
- Review bug reports related to accessibility
- Update documentation if needed

### Quarterly (1-2 days)
- Run automated accessibility scan (axe)
- Manual keyboard navigation test
- Update based on latest WCAG guidance

### Yearly (1 week)
- Full accessibility audit
- Test with disabled user group
- Update implementation if needed
- Plan improvements for next year

---

## Additional Resources

### Official Standards
- **W3C WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **W3C ARIA:** https://www.w3.org/WAI/ARIA/apg/
- **MDN Web Docs:** https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Practical Guides
- **WebAIM:** https://webaim.org/
- **A11y Project:** https://www.a11yproject.com/
- **Digital Accessibility at Princeton:** https://digital.accessibility.princeton.edu/

### Tools
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WAVE:** https://wave.webaim.org/
- **NVDA:** https://www.nvaccess.org/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

### Learning
- **A11ycast YouTube:** Short accessibility videos
- **"Inclusive Components":** https://inclusive-components.design/
- **"Accessible to All":** Free online course
- **Deque Blog:** https://www.deque.com/blog/

---

## Document Maintenance

**Last Updated:** November 2025
**Research Scope:** Figma, Excalidraw, Google Drawings
**WCAG Version:** 2.1 (with 2.2 references)
**Status:** Current and Comprehensive

**To Update:**
1. Monitor Excalidraw GitHub for accessibility improvements
2. Check Figma's latest accessibility releases
3. Review new WCAG 2.2 criterion adoption
4. Update code examples to match latest frameworks
5. Refresh tool recommendations yearly

---

## Final Notes

### Key Takeaway
**Building keyboard-first accessibility benefits everyone:**
- Keyboard users (power users, accessibility tech users)
- Mobile users (smaller screens, easier to use with keyboard)
- All users (keyboard is faster for many tasks)
- Users with disabilities (multiple assistive tech options)

### Drawing App Challenge
**Canvas-based drawing is inherently visual**, but the **toolbar and controls must be 100% accessible**. If users can select tools, change colors, and manage their work with keyboard + screen reader, they can use the app effectively.

### Success Indicator
**You've achieved accessibility when:**
- A keyboard-only user can complete all main tasks
- A screen reader user can navigate the toolbar and layers
- A colorblind user can distinguish all UI elements
- A low-vision user can zoom to 200% and still use the app
- A user with motor disability can use voice/switch/eye-tracking

---

## Questions or Need Help?

1. **Specific WCAG criterion:** See Research document, Part 2
2. **Implementation question:** See Code Examples
3. **Checking progress:** Use Checklist
4. **Comparing tools:** See Tools Comparison
5. **General guidance:** Start with this index, then drill down

---

**End of Index**

For detailed implementation, start with **ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md** and reference other documents as needed.

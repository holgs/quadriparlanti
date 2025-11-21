---
title: Accessibility Guidelines
description: WCAG 2.1 AA compliance standards and best practices
last-updated: 2025-11-09
version: 1.0.0
status: approved
---

# Accessibility Guidelines

## Compliance Target

**WCAG 2.1 Level AA** (Minimum)
**WCAG 2.1 Level AAA** (Where feasible)

## Key Requirements

### Color Contrast
- Normal text (< 18px): **4.5:1 minimum**
- Large text (≥ 18px or ≥ 14px bold): **3:1 minimum**
- UI components and graphics: **3:1 minimum**
- Critical actions: **7:1 target** (AAA)

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Visible focus indicators
- Skip links for main content

### Screen Readers
- Semantic HTML elements
- ARIA labels where needed
- Alt text for meaningful images
- Form labels properly associated

### Touch Targets
- Minimum 44×44px for all interactive elements
- 8px spacing between adjacent targets

### Motion & Animation
- Respect `prefers-reduced-motion`
- Disable animations for users who request it
- Provide static alternatives

## Testing Checklist

- [ ] Keyboard-only navigation test
- [ ] Screen reader test (NVDA/JAWS/VoiceOver)
- [ ] Color contrast verification (axe DevTools)
- [ ] Zoom test (200% text scaling)
- [ ] Touch target size verification
- [ ] Reduced motion test

---
title: QuadriParlanti Design Documentation
description: Complete design system and specifications for the student work repository
last-updated: 2025-11-09
version: 1.0.0
status: approved
---

# QuadriParlanti Design Documentation

## Overview

This directory contains the complete design system, component specifications, and feature designs for **QuadriParlanti** - a QR-powered digital gallery that connects physical school displays to rich multimedia portfolios.

## Navigation

### 📐 Design System
- **[Style Guide](./design-system/style-guide.md)** - Complete design system specifications
- **[Components](./design-system/components/)** - Reusable UI component library
- **[Design Tokens](./design-system/tokens/)** - Colors, typography, spacing, animations

### 🎨 Features
- Feature-specific design documentation organized by user flow

### ♿ Accessibility
- **[Guidelines](./accessibility/guidelines.md)** - WCAG 2.1 AA compliance standards
- **[Testing](./accessibility/testing.md)** - Testing procedures and checklists

### 🎯 Platform Adaptations
- **[Web](./design-system/platform-adaptations/web.md)** - Web-specific guidelines

## Design Philosophy

**QuadriParlanti** embodies a **dynamic, youthful aesthetic** with:

- **Bold simplicity** - Clean interfaces that prioritize content over decoration
- **Vibrant energy** - Playful gradients and smooth animations reflecting student creativity
- **Inclusive design** - Light and dark modes supporting diverse preferences and accessibility
- **Breathable layouts** - Strategic whitespace for cognitive comfort
- **Responsive fluidity** - Seamless experiences from mobile to desktop

## Key Principles

1. **Content First** - Student work is the hero
2. **Privacy Conscious** - No student faces or full names visible
3. **Multilingual** - Equal quality in Italian and English
4. **Accessible** - WCAG 2.1 AA minimum, AAA where possible
5. **Performance** - Mobile-first, <2s load times on 3G

## Color Philosophy

### Light Mode
**Professional yet approachable** - Clean whites with vibrant accent colors creating an energetic, gallery-like atmosphere perfect for daytime viewing.

### Dark Mode
**Sophisticated and immersive** - Deep purples and blues reducing eye strain while maintaining visual hierarchy, ideal for evening browsing.

## Typography

**Inter** as the primary typeface provides:
- Excellent screen readability
- Wide language support (including Italian diacritics)
- Professional yet friendly character
- Variable font performance benefits

## Quick Links

- [Color System](./design-system/tokens/colors.md)
- [Typography](./design-system/tokens/typography.md)
- [Spacing](./design-system/tokens/spacing.md)
- [Animations](./design-system/tokens/animations.md)
- [Button Components](./design-system/components/buttons.md)
- [Form Components](./design-system/components/forms.md)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-09 | Initial design system and component library |

## Contributing

When adding new components or features:
1. Follow the established design token system
2. Ensure WCAG 2.1 AA compliance minimum
3. Test both light and dark modes
4. Document all states and variants
5. Include implementation notes for developers

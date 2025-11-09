---
title: QuadriParlanti Style Guide
description: Complete design system specifications for light and dark modes
last-updated: 2025-11-09
version: 1.0.0
related-files:
  - ./tokens/colors.md
  - ./tokens/typography.md
  - ./tokens/spacing.md
  - ./tokens/animations.md
status: approved
---

# QuadriParlanti Style Guide

## Design Philosophy

QuadriParlanti celebrates student creativity with a **dynamic, youthful design system** that balances professionalism with playful energy. The dual-theme approach (light/dark) ensures accessibility while creating distinct experiences for different contexts and user preferences.

### Core Values
- **Student-Centric**: Content showcases student work prominently
- **Inclusive Access**: Light/dark modes support visual preferences and accessibility needs
- **Joyful Professionalism**: Vibrant yet appropriate for educational context
- **Performance-First**: Optimized for mobile devices and slow connections

---

## 1. Color System

### Light Mode Palette

**Primary Colors**
- **Primary**: `hsl(243, 75%, 59%)` (#607AFB) – Main CTAs, brand elements, interactive states
- **Primary Dark**: `hsl(243, 96%, 66%)` (#516DFB) – Hover states, emphasis, pressed buttons
- **Primary Light**: `hsl(243, 100%, 97%)` (#F0F3FF) – Subtle backgrounds, selected states

**Secondary Colors**
- **Secondary**: `hsl(260, 51%, 51%)` (#7C3AED) – Supporting interactive elements
- **Secondary Light**: `hsl(260, 60%, 92%)` (#EDE9FE) – Backgrounds, highlights
- **Secondary Pale**: `hsl(260, 60%, 98%)` (#FAF8FF) – Very subtle backgrounds

**Accent Colors**
- **Accent Primary**: `hsl(330, 85%, 55%)` (#EF4478) – Notifications, urgent actions
- **Accent Secondary**: `hsl(38, 95%, 55%)` (#F59E0B) – Warnings, highlights
- **Gradient Start**: `hsl(280, 100%, 70%)` (#B966FF) – For decorative gradients
- **Gradient End**: `hsl(200, 100%, 60%)` (#60C5FF) – For decorative gradients

**Semantic Colors**
- **Success**: `hsl(142, 71%, 45%)` (#22C55E) – Approvals, positive actions
- **Warning**: `hsl(38, 92%, 50%)` (#F59E0B) – Cautionary states
- **Error**: `hsl(0, 84%, 60%)` (#EF4444) – Errors, destructive actions
- **Info**: `hsl(199, 89%, 48%)` (#0EA5E9) – Informational messages

**Neutral Palette**
- `Neutral-50`: `hsl(0, 0%, 98%)` (#FAFAFA) – Page backgrounds
- `Neutral-100`: `hsl(0, 0%, 96%)` (#F5F5F5) – Card backgrounds
- `Neutral-200`: `hsl(0, 0%, 90%)` (#E5E5E5) – Dividers, borders
- `Neutral-300`: `hsl(0, 0%, 83%)` (#D4D4D4) – Disabled states
- `Neutral-400`: `hsl(0, 0%, 64%)` (#A3A3A3) – Placeholder text
- `Neutral-500`: `hsl(0, 0%, 45%)` (#737373) – Secondary text
- `Neutral-600`: `hsl(0, 0%, 32%)` (#525252) – Body text
- `Neutral-700`: `hsl(0, 0%, 25%)` (#404040) – Headings
- `Neutral-800`: `hsl(0, 0%, 15%)` (#262626) – Strong emphasis
- `Neutral-900`: `hsl(0, 0%, 9%)` (#171717) – Maximum contrast text

### Dark Mode Palette

**Primary Colors**
- **Primary**: `hsl(243, 75%, 59%)` (#607AFB) – Consistent with light mode for brand recognition
- **Primary Dark**: `hsl(243, 96%, 66%)` (#516DFB) – Hover states
- **Primary Light**: `hsl(243, 40%, 20%)` (#1F2A5E) – Subtle dark backgrounds

**Secondary Colors**
- **Secondary**: `hsl(260, 51%, 61%)` (#9F7AEA) – Lighter for dark background contrast
- **Secondary Light**: `hsl(260, 40%, 25%)` (#2E1F4D) – Dark backgrounds
- **Secondary Pale**: `hsl(260, 30%, 15%)` (#1A132E) – Very subtle dark backgrounds

**Accent Colors**
- **Accent Primary**: `hsl(330, 85%, 65%)` (#FF5C8D) – Brighter for visibility
- **Accent Secondary**: `hsl(38, 95%, 60%)` (#FFAD33) – Warmer warning tone
- **Gradient Start**: `hsl(280, 100%, 70%)` (#B966FF) – Consistent gradients
- **Gradient End**: `hsl(200, 100%, 60%)` (#60C5FF) – Consistent gradients

**Semantic Colors**
- **Success**: `hsl(142, 71%, 50%)` (#34D399) – Brighter for dark backgrounds
- **Warning**: `hsl(38, 92%, 55%)` (#FBBF24) – Enhanced visibility
- **Error**: `hsl(0, 84%, 65%)` (#F87171) – Softer red for eye comfort
- **Info**: `hsl(199, 89%, 55%)` (#38BDF8) – Lighter blue

**Neutral Palette (Dark)**
- `Neutral-50`: `hsl(240, 13%, 7%)` (#101323) – Homepage background
- `Neutral-100`: `hsl(240, 13%, 7%)` (#111218) – Admin/internal background
- `Neutral-200`: `hsl(240, 13%, 11%)` (#1B1D27) – Card backgrounds
- `Neutral-300`: `hsl(240, 13%, 15%)` (#21284A) – Elevated surfaces
- `Neutral-400`: `hsl(240, 10%, 17%)` (#272A3A) – Borders, dividers
- `Neutral-500`: `hsl(240, 8%, 23%)` (#3A3E55) – Interactive borders
- `Neutral-600`: `hsl(235, 20%, 60%)` (#9BA0BB) – Secondary text
- `Neutral-700`: `hsl(228, 30%, 68%)` (#8E99CC) – Body text
- `Neutral-800`: `hsl(0, 0%, 90%)` (#E5E5E5) – Primary text
- `Neutral-900`: `hsl(0, 0%, 100%)` (#FFFFFF) – Maximum contrast text

### Accessibility Notes
- All color combinations tested for WCAG 2.1 AA compliance (4.5:1 normal text, 3:1 large text)
- Critical interactions maintain 7:1 contrast ratio (AAA level)
- Color is never the only means of conveying information
- Colorblind-friendly palette (tested with deuteranopia, protanopia, tritanopia simulators)

---

## 2. Typography System

### Font Stack
**Primary**: `'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Chosen for exceptional readability and modern aesthetic
- Variable font reduces file size while providing full weight range
- Excellent multilingual support (Italian diacritics)

**Monospace**: `'JetBrains Mono', 'Fira Code', Consolas, monospace`
- For code snippets, technical content, QR code displays

### Font Weights
- **Light**: 300 – Rare use, large decorative text only
- **Regular**: 400 – Body text, descriptions
- **Medium**: 500 – Button text, emphasized content
- **Semibold**: 600 – Subheadings, card titles
- **Bold**: 700 – Headings, strong emphasis
- **Extrabold**: 800 – Hero text, page titles (sparingly)

### Type Scale

#### Desktop (1024px+)
- **H1**: `2.5rem/3rem (40px/48px), 800 weight, -0.02em tracking` – Page heroes
- **H2**: `2rem/2.5rem (32px/40px), 700 weight, -0.015em tracking` – Section titles
- **H3**: `1.5rem/2rem (24px/32px), 600 weight, -0.01em tracking` – Card headers
- **H4**: `1.25rem/1.75rem (20px/28px), 600 weight, normal tracking` – Subsection titles
- **H5**: `1.125rem/1.75rem (18px/28px), 500 weight, normal tracking` – Minor headers
- **Body Large**: `1.125rem/1.75rem (18px/28px), 400 weight` – Intro paragraphs
- **Body**: `1rem/1.5rem (16px/24px), 400 weight` – Standard text
- **Body Small**: `0.875rem/1.25rem (14px/20px), 400 weight` – Secondary info
- **Caption**: `0.75rem/1rem (12px/16px), 400 weight` – Metadata, timestamps
- **Label**: `0.875rem/1.25rem (14px/20px), 500 weight, uppercase, 0.05em tracking` – Form labels
- **Code**: `0.875rem/1.5 (14px), 400 weight, monospace` – Technical text

#### Mobile (< 768px)
- **H1**: `2rem/2.5rem (32px/40px), 800 weight, -0.02em tracking`
- **H2**: `1.75rem/2.25rem (28px/36px), 700 weight, -0.015em tracking`
- **H3**: `1.25rem/1.75rem (20px/28px), 600 weight, -0.01em tracking`
- **H4**: `1.125rem/1.625rem (18px/26px), 600 weight, normal tracking`
- **H5**: `1rem/1.5rem (16px/24px), 500 weight, normal tracking`
- Body sizes remain consistent for readability

### Responsive Typography
Uses fluid scaling between breakpoints:
```css
font-size: clamp(1.75rem, 1.5rem + 1vw, 2.5rem);
```

---

## 3. Spacing & Layout System

### Base Unit
**8px** (0.5rem) - All spacing uses multiples of 8 for visual rhythm

### Spacing Scale
- `xs`: `0.25rem (4px)` – Micro spacing, icon padding
- `sm`: `0.5rem (8px)` – Tight spacing, form elements
- `md`: `1rem (16px)` – Default spacing, card padding
- `lg`: `1.5rem (24px)` – Section spacing
- `xl`: `2rem (32px)` – Large gaps, component separation
- `2xl`: `3rem (48px)` – Major section breaks
- `3xl`: `4rem (64px)` – Hero section padding
- `4xl`: `6rem (96px)` – Exceptional spacing, landing pages

### Grid System
**12-column flexible grid** with responsive breakpoints

**Breakpoints**
- **Mobile**: `320px - 767px` (4-column grid)
- **Tablet**: `768px - 1023px` (8-column grid)
- **Desktop**: `1024px - 1439px` (12-column grid)
- **Wide**: `1440px+` (12-column grid, max-width 1440px container)

**Gutters**
- Mobile: `1rem (16px)`
- Tablet: `1.5rem (24px)`
- Desktop: `2rem (32px)`

**Container Max-widths**
- `sm`: `640px` – Text-heavy content
- `md`: `768px` – Forms, narrow layouts
- `lg`: `1024px` – Standard pages
- `xl`: `1280px` – Wide dashboards
- `2xl`: `1440px` – Maximum content width

---

## 4. Component Specifications

### Buttons

#### Variants
1. **Primary** – Main CTAs (e.g., "Explore Projects", "Save Work")
2. **Secondary** – Supporting actions (e.g., "Cancel", "Back")
3. **Outline** – Tertiary actions (e.g., "Learn More")
4. **Ghost** – Minimal emphasis (e.g., "Skip", inline links)
5. **Destructive** – Dangerous actions (e.g., "Delete", "Remove")

#### Sizes
- **Small**: `h-8 (32px), px-3, text-sm (14px)`
- **Medium**: `h-10 (40px), px-4, text-base (16px)` – Default
- **Large**: `h-12 (48px), px-6, text-lg (18px)`

#### Primary Button Specifications

**Light Mode**
- **Default**:
  - Background: `Primary (#607AFB)`
  - Text: `White`
  - Border: None
  - Shadow: `0 1px 2px rgba(0, 0, 0, 0.05)`
- **Hover**:
  - Background: `Primary Dark (#516DFB)`
  - Shadow: `0 4px 6px rgba(96, 122, 251, 0.25)`
  - Transform: `translateY(-1px)`
  - Transition: `all 150ms ease-out`
- **Active**:
  - Background: `Primary Dark (#516DFB)`
  - Shadow: `0 1px 2px rgba(0, 0, 0, 0.1) inset`
  - Transform: `translateY(0)`
- **Focus**:
  - Outline: `2px solid Primary`
  - Outline offset: `2px`
- **Disabled**:
  - Background: `Neutral-300 (#D4D4D4)`
  - Text: `Neutral-500 (#737373)`
  - Cursor: `not-allowed`
  - Opacity: `0.6`
- **Loading**:
  - Background: `Primary (#607AFB)`
  - Text: `White`
  - Spinner: Pulsing animation
  - Cursor: `wait`

**Dark Mode**
- **Default**:
  - Background: `Primary (#607AFB)`
  - Text: `White`
  - Shadow: `0 1px 3px rgba(0, 0, 0, 0.3)`
- **Hover**:
  - Background: `Primary Dark (#516DFB)`
  - Shadow: `0 4px 8px rgba(96, 122, 251, 0.35)`

### Forms

#### Input Fields

**Specifications**
- **Height**: `h-10 (40px)` – Standard, `h-12 (48px)` – Large
- **Padding**: `px-3 (12px)`
- **Border Radius**: `0.5rem (8px)`
- **Font**: `Body (16px)` – Prevents zoom on iOS

**Light Mode**
- **Default**:
  - Background: `White`
  - Border: `1px solid Neutral-300 (#D4D4D4)`
  - Text: `Neutral-700 (#404040)`
  - Placeholder: `Neutral-400 (#A3A3A3)`
- **Focus**:
  - Border: `2px solid Primary (#607AFB)`
  - Shadow: `0 0 0 3px hsla(243, 75%, 59%, 0.1)`
  - Outline: None
- **Error**:
  - Border: `2px solid Error (#EF4444)`
  - Shadow: `0 0 0 3px hsla(0, 84%, 60%, 0.1)`

**Dark Mode**
- **Default**:
  - Background: `Neutral-200 (#1B1D27)`
  - Border: `1px solid Neutral-500 (#3A3E55)`
  - Text: `Neutral-800 (#E5E5E5)`
  - Placeholder: `Neutral-600 (#9BA0BB)`
- **Focus**:
  - Border: `2px solid Primary (#607AFB)`
  - Shadow: `0 0 0 3px hsla(243, 75%, 59%, 0.2)`

### Cards

**Light Mode**
- Background: `White`
- Border: `1px solid Neutral-200 (#E5E5E5)`
- Border Radius: `0.75rem (12px)`
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Hover Shadow: `0 8px 16px rgba(0, 0, 0, 0.12)`

**Dark Mode**
- Background: `Neutral-200 (#1B1D27)`
- Border: `1px solid Neutral-400 (#272A3A)`
- Shadow: `0 4px 6px rgba(0, 0, 0, 0.3)`
- Hover Shadow: `0 12px 24px rgba(0, 0, 0, 0.4)`

---

## 5. Motion & Animation System

### Timing Functions
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Entrances, expansions, drawer opens
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` – Transitions, movements, state changes
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` – Playful interactions (use sparingly)

### Duration Scale
- **Micro**: `100ms` – State changes, checkbox toggles, radio buttons
- **Short**: `200ms` – Button hover, input focus, tooltip appearance
- **Medium**: `300ms` – Dropdown menus, card hover effects, modal entry
- **Long**: `500ms` – Page transitions, drawer slides, complex animations

### Animation Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Subtle**: Enhance without distracting from content
3. **Performant**: Use transform and opacity for GPU acceleration
4. **Accessible**: Respect `prefers-reduced-motion` user setting

### Common Animations

**Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 200ms ease-out;
```

**Slide Up**
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slideUp 300ms ease-out;
```

**Scale In**
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Skeleton Pulse** (Loading states)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse 1.5s ease-in-out infinite;
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Shadows & Elevation

### Light Mode Shadows
- **SM**: `0 1px 2px rgba(0, 0, 0, 0.05)` – Subtle depth, input fields
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.1)` – Cards, buttons
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)` – Dropdowns, popovers
- **XL**: `0 20px 25px rgba(0, 0, 0, 0.15)` – Modals, elevated panels

### Dark Mode Shadows
- **SM**: `0 1px 3px rgba(0, 0, 0, 0.3)` – Enhanced contrast
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.4)` – Cards visibility
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.5)` – Clear separation
- **XL**: `0 20px 25px rgba(0, 0, 0, 0.6)` – Maximum elevation

### Colored Shadows (Interactive Elements)
- **Primary**: `0 4px 6px rgba(96, 122, 251, 0.25)` – Primary button hover
- **Success**: `0 4px 6px rgba(34, 197, 94, 0.25)` – Success actions
- **Error**: `0 4px 6px rgba(239, 68, 68, 0.25)` – Destructive actions

---

## 7. Border Radius

- **SM**: `0.25rem (4px)` – Badges, tags
- **MD**: `0.5rem (8px)` – Inputs, small buttons
- **LG**: `0.75rem (12px)` – Cards, large buttons (default)
- **XL**: `1rem (16px)` – Hero sections, image containers
- **2XL**: `1.5rem (24px)` – Special containers
- **Full**: `9999px` – Pills, avatar shapes

---

## 8. Iconography

### Icon Library
**Lucide React** – Modern, consistent, well-maintained

### Sizes
- `16px` – Inline with text, small buttons
- `20px` – Standard buttons, form inputs
- `24px` – Navigation, prominent actions
- `32px` – Feature highlights, empty states
- `48px+` – Hero sections, large decorative use

### Usage Guidelines
- Icons should be monochromatic (same color as adjacent text)
- Maintain 44×44px minimum touch target for interactive icons on mobile
- Use semantic meaning (e.g., trash for delete, checkmark for success)
- Never use color alone to convey meaning with icons

---

## 9. Responsive Design

### Mobile-First Approach
Design starts at 320px width and progressively enhances

### Touch Targets
- Minimum 44×44px for all interactive elements (buttons, links, form controls)
- Increase padding on mobile for comfortable tapping
- Space interactive elements at least 8px apart

### Font Scaling
- Use `rem` units for scalability
- Test with browser text scaling (200% minimum)
- Fluid typography for smooth transitions between breakpoints

---

## 10. Accessibility Standards

### WCAG 2.1 AA Compliance (Minimum)
- Color contrast ratios: 4.5:1 normal text, 3:1 large text
- Keyboard navigation support for all interactive elements
- Screen reader compatibility with semantic HTML and ARIA labels
- Focus indicators visible and consistent
- Form validation with clear error messages
- Alt text for all images conveying meaning

### AAA Targets (Where Possible)
- 7:1 contrast for critical UI elements
- Enhanced motion control
- Comprehensive ARIA labeling

---

## Implementation Notes

### CSS Variables
Use CSS custom properties for theme switching:

```css
:root {
  --color-primary: hsl(243, 75%, 59%);
  --color-background: hsl(0, 0%, 98%);
  --color-text: hsl(0, 0%, 9%);
  /* ... */
}

[data-theme="dark"] {
  --color-background: hsl(240, 13%, 7%);
  --color-text: hsl(0, 0%, 100%);
  /* ... */
}
```

### Tailwind CSS Configuration
Extend default theme in `tailwind.config.ts` with custom tokens

### Component Library
Use shadcn/ui as foundation, customized with QuadriParlanti tokens

---

## Quality Checklist

✅ **Design System Compliance**
- [ ] Colors match defined palette with proper contrast ratios
- [ ] Typography follows established hierarchy and scale
- [ ] Spacing uses 8px base unit consistently
- [ ] Components match documented specifications
- [ ] Motion follows timing and easing standards
- [ ] Both light and dark modes implemented

✅ **Accessibility**
- [ ] WCAG 2.1 AA contrast ratios verified
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] Focus indicators visible
- [ ] Touch targets minimum 44×44px
- [ ] Reduced motion respected

✅ **Responsive Design**
- [ ] Mobile (320px+) tested
- [ ] Tablet (768px+) tested
- [ ] Desktop (1024px+) tested
- [ ] Wide screens (1440px+) tested
- [ ] Touch interactions optimized

✅ **Performance**
- [ ] First Contentful Paint <2s
- [ ] Largest Contentful Paint <2.5s
- [ ] Cumulative Layout Shift <0.1
- [ ] Animations at 60fps

---

## Related Documentation

- [Color Tokens](./tokens/colors.md)
- [Typography Tokens](./tokens/typography.md)
- [Spacing Tokens](./tokens/spacing.md)
- [Animation Tokens](./tokens/animations.md)
- [Button Components](./components/buttons.md)
- [Form Components](./components/forms.md)

## Last Updated
2025-11-09 - Initial design system creation with light/dark modes

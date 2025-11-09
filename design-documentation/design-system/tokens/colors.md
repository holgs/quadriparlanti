---
title: Color Tokens
description: Complete color palette for light and dark modes
last-updated: 2025-11-09
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Color Tokens

## Overview

QuadriParlanti uses a dual-theme color system with **vibrant, energetic colors** for light mode creating a gallery-like atmosphere, and **sophisticated purples and blues** for dark mode ensuring comfortable evening browsing.

## Implementation

### CSS Custom Properties

```css
/* Light Mode (Default) */
:root {
  /* Primary */
  --primary: 243 75% 59%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 260 51% 51%;
  --secondary-foreground: 0 0% 100%;

  /* Accent */
  --accent: 330 85% 55%;
  --accent-foreground: 0 0% 100%;

  /* Background */
  --background: 0 0% 98%;
  --foreground: 0 0% 9%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 9%;

  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 9%;

  /* Muted */
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;

  /* Border */
  --border: 0 0% 90%;
  --input: 0 0% 90%;

  /* Ring (Focus) */
  --ring: 243 75% 59%;

  /* Destructive */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Success */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;

  /* Warning */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;

  /* Info */
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
}

/* Dark Mode */
.dark {
  /* Primary */
  --primary: 243 75% 59%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 260 51% 61%;
  --secondary-foreground: 0 0% 100%;

  /* Accent */
  --accent: 330 85% 65%;
  --accent-foreground: 0 0% 100%;

  /* Background */
  --background: 240 13% 7%;
  --foreground: 0 0% 100%;

  /* Card */
  --card: 240 13% 11%;
  --card-foreground: 0 0% 90%;

  /* Popover */
  --popover: 240 13% 11%;
  --popover-foreground: 0 0% 90%;

  /* Muted */
  --muted: 240 13% 15%;
  --muted-foreground: 235 20% 60%;

  /* Border */
  --border: 240 10% 17%;
  --input: 240 8% 23%;

  /* Ring (Focus) */
  --ring: 243 75% 59%;

  /* Destructive */
  --destructive: 0 84% 65%;
  --destructive-foreground: 0 0% 100%;

  /* Success */
  --success: 142 71% 50%;
  --success-foreground: 0 0% 100%;

  /* Warning */
  --warning: 38 92% 55%;
  --warning-foreground: 0 0% 100%;

  /* Info */
  --info: 199 89% 55%;
  --info-foreground: 0 0% 100%;
}
```

### Tailwind Configuration

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // ... etc
      },
    },
  },
}
```

## Accessibility

All color combinations meet WCAG 2.1 AA standards (4.5:1 minimum contrast ratio for normal text).

Critical UI elements target AAA compliance (7:1 contrast ratio).

# Admin Navigation Pattern

## Overview

All admin pages must include a consistent "Back to Dashboard" button to allow easy navigation back to the main admin dashboard (`/admin`).

## Implementation Pattern

### For Server Components (page.tsx)

Add the following imports at the top of your file:

```tsx
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
```

Add this header structure to your page:

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-bold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>
  <div className="flex gap-3">
    <Button variant="outline" asChild>
      <Link href="/admin">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
    </Button>
    {/* Other action buttons here */}
  </div>
</div>
```

### For Client Components

If you're using a client component (`.tsx` with `'use client'`), import Link:

```tsx
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
```

And add the same header structure in your component's JSX.

## Current Implementation Status

### ✅ Completed

- `/admin/works/pending` - Has "Back to Dashboard" button
- `/admin/themes` - Added "Back to Dashboard" button with proper styling
- `/admin/teachers` - Added "Back to Dashboard" button with dark theme styling
- `/admin/qr` - QR Codes management page with "Back to Dashboard" button
- `/admin/analytics` - Analytics/Statistics page with "Back to Dashboard" button

### Notes on Styling

For pages with **dark theme** (like teachers), use custom styling to ensure visibility:
```tsx
className="border-[#272a3a] bg-[#1b1d27] text-white hover:bg-[#272a3a]"
```

For pages with **standard theme** (like themes), use the default `variant="outline"`

## Button Styling Details

- **Variant**: `outline` - This gives it a secondary appearance, different from primary action buttons
- **Icon**: `ArrowLeft` from `lucide-react` - Provides visual indication of navigation
- **Layout**: Wrapped in a `flex gap-3` container with other action buttons for proper spacing
- **Responsiveness**: Parent div uses `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` for mobile-first responsive design

## Example Files to Reference

- [Themes page](/quadriparlanti-app/app/%5Blocale%5D/admin/themes/page.tsx) - Server component example
- [Teachers page](/quadriparlanti-app/app/%5Blocale%5D/admin/teachers/components/teachers-page-client.tsx) - Client component example
- [Pending Review page](/quadriparlanti-app/app/%5Blocale%5D/admin/works/pending/page.tsx) - Original reference implementation

## Notes

- Always use `variant="outline"` for consistency with the pending review page
- The button should be the leftmost button when multiple actions are present
- Ensure proper spacing with `gap-3` between buttons
- The responsive layout ensures buttons stack vertically on mobile devices

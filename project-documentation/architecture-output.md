# Technical Architecture Blueprint
## Repository Lavori Studenti (Student Work Repository)

**Document Version**: 1.0
**Created**: 2025-11-07
**System Architect**: Claude Agent
**Status**: Implementation-Ready Specification
**Target Stack**: Next.js 14 + Supabase + Vercel

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack Decisions](#technology-stack-decisions)
4. [Database Architecture](#database-architecture)
5. [API Contract Specifications](#api-contract-specifications)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Storage & Content Delivery](#file-storage--content-delivery)
9. [QR Code System](#qr-code-system)
10. [Analytics & Tracking](#analytics--tracking)
11. [Workflow Engine](#workflow-engine)
12. [Search & Filter Architecture](#search--filter-architecture)
13. [Internationalization](#internationalization)
14. [Security Architecture](#security-architecture)
15. [Performance & Scalability](#performance--scalability)
16. [Development Environment](#development-environment)
17. [Deployment & Infrastructure](#deployment--infrastructure)
18. [Monitoring & Observability](#monitoring--observability)

---

## Executive Summary

### Architecture Overview

**Repository Lavori Studenti** is a QR-powered digital gallery connecting physical school corridor displays to rich multimedia portfolios. The architecture follows a modern serverless approach with clear separation of concerns:

- **Frontend**: Next.js 14 App Router (TypeScript, SSR/ISR, React Server Components)
- **Backend**: Supabase (PostgreSQL with RLS, Auth, Storage, Realtime)
- **Deployment**: Vercel (Edge Network) + Supabase Cloud
- **Security**: Row Level Security (RLS) for authorization, JWT-based authentication
- **Performance**: ISR for content pages, CDN caching, optimized images
- **Privacy**: GDPR-compliant with IP hashing, no student PII

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 14 App Router | Built-in SSR/ISR, excellent performance, TypeScript support, Server Components |
| Backend Platform | Supabase | PostgreSQL + RLS eliminates custom backend, built-in Auth/Storage, generous free tier |
| Authentication | Supabase Auth | Email/password with role-based access, session management included |
| Database | PostgreSQL | ACID compliance, full-text search, mature ecosystem, RLS for security |
| File Storage | Supabase Storage | S3-compatible, RLS policies, CDN integration, cost-effective |
| Hosting | Vercel | Zero-config deployments, Edge Network, automatic SSL, preview environments |
| State Management | React Server Components + Client State | Minimize client JS, use server components for data fetching |
| Internationalization | next-intl | Type-safe translations, middleware-based routing, SSR-compatible |
| QR Generation | node-qrcode | Lightweight, SVG/PNG/PDF support, no external API dependencies |
| Analytics | Custom (PostgreSQL) | Full control, GDPR-compliant, no third-party trackers |

### System Boundaries

**In Scope (MVP)**:
- Public theme browsing and work viewing
- Teacher work creation and submission
- Admin approval workflow
- QR code generation and scanning
- File uploads (PDF, images)
- External links (YouTube, Vimeo, Drive)
- Multilingual content (IT/EN)
- Basic analytics (scans, views)
- Email notifications (via Supabase)

**Out of Scope (Future)**:
- PWA offline support
- Media transcoding
- Advanced role permissions (per-theme)
- Social sharing features
- Student direct submissions
- Mobile app (native)
- Video hosting (self-hosted)

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VISITOR DEVICE                          │
│                    (Smartphone via QR scan)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       VERCEL EDGE NETWORK                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Static Assets│  │  ISR Cache   │  │  Edge Functions    │   │
│  │   (Images)   │  │ (Theme Pages)│  │  (Redirects)       │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION (Vercel)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App Router                                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │  │
│  │  │  Public    │  │  Teacher   │  │     Admin      │    │  │
│  │  │  Routes    │  │  Dashboard │  │   Dashboard    │    │  │
│  │  └────────────┘  └────────────┘  └────────────────┘    │  │
│  │                                                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │  │
│  │  │  Server    │  │   API      │  │  Middleware    │    │  │
│  │  │ Components │  │  Routes    │  │  (Auth/i18n)   │    │  │
│  │  └────────────┘  └────────────┘  └────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Supabase Client SDK
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE PLATFORM                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with RLS)                          │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │ users  │ │themes  │ │ works  │ │qr_codes│ │analytics│ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Auth (JWT)                                     │  │
│  │  - Email/Password  - Session Management  - Role Metadata│  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage (S3-compatible)                        │  │
│  │  - work_attachments (public)  - theme_images (public)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Realtime (PostgreSQL Change Data Capture)              │  │
│  │  - Live updates for admin dashboard                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐   │
│  │   Email    │  │   CDN      │  │  Media Embeds          │   │
│  │ (Supabase) │  │ (Vercel)   │  │ (YouTube/Vimeo/Drive)  │   │
│  └────────────┘  └────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### Flow 1: QR Scan to Theme Page (Public)
```
1. Visitor scans QR → https://domain.com/q/ABC123
2. Next.js API route /api/qr/[shortCode]/redirect:
   - Query Supabase: SELECT theme_id FROM qr_codes WHERE short_code='ABC123'
   - Log scan: INSERT INTO qr_scans (hashed_ip, qr_code_id, ...)
   - Redirect: 302 to /themes/[slug]
3. ISR theme page loads (revalidated every 60s)
4. Server Component fetches published works via Supabase client
5. Page rendered with SEO metadata, returns HTML to visitor
```

#### Flow 2: Teacher Creates Work (Authenticated)
```
1. Teacher logs in → Supabase Auth issues JWT
2. Teacher navigates to /dashboard/teacher/works/new
3. Form submission → Client-side validation (Zod)
4. File upload:
   - Client requests presigned URL: POST /api/upload/presign
   - Direct upload to Supabase Storage (bypasses Next.js)
   - Client receives public URL
5. Form submit → INSERT INTO works with status='draft'
6. Teacher clicks "Submit for Review" → UPDATE works SET status='pending_review'
7. Database trigger → sends webhook to admin notification service
8. Admin receives email via Supabase Auth mailer
```

#### Flow 3: Admin Reviews Work (Authenticated)
```
1. Admin logs in → JWT with role='admin' metadata
2. Navigate to /dashboard/admin/review-queue
3. Server Component queries: SELECT * FROM works WHERE status='pending_review'
4. Admin clicks "Approve" → POST /api/works/[id]/review
5. RLS policy checks: auth.uid() has role='admin'
6. Update: SET status='published', published_at=NOW()
7. INSERT INTO work_reviews (action='approved', reviewer_id=...)
8. Trigger sends email to teacher
9. ISR revalidation: revalidatePath('/themes/[slug]')
```

### Data Flow Architecture

**Read Operations** (Public Content):
- Client → Vercel Edge (CDN cache hit) → Return cached HTML
- Client → Vercel Edge (cache miss) → Next.js SSR/ISR → Supabase (RLS: status='published') → Return HTML → Cache at Edge

**Write Operations** (Authenticated):
- Client → Next.js API Route → Supabase Client (JWT in header) → RLS policies check auth.uid() → Execute query → Return result

**File Uploads**:
- Client → Next.js presigned URL endpoint → Return signed URL → Client uploads directly to Supabase Storage → RLS on bucket checks auth → File stored → Public URL returned

---

## Technology Stack Decisions

### Frontend Technology Stack

#### Next.js 14 App Router
**Selected Version**: Next.js 14.x (App Router stable)

**Key Features Used**:
- **Server Components**: Default for pages, layouts (zero client JS for data fetching)
- **Client Components**: Interactive UI (forms, filters, search)
- **ISR (Incremental Static Regeneration)**: Theme pages revalidated on-demand
- **SSR (Server-Side Rendering)**: Work detail pages (fresh data)
- **API Routes**: Custom endpoints for QR redirect, analytics, file upload
- **Middleware**: Authentication checks, language detection
- **Image Optimization**: next/image with automatic WebP conversion
- **Metadata API**: Dynamic SEO tags for social sharing

**Configuration** (`next.config.js`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true, // For form submissions
  },
  images: {
    domains: [
      'supabase-project-id.supabase.co', // Supabase Storage
    ],
    formats: ['image/webp', 'image/avif'],
  },
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it',
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Rationale**:
- App Router provides better performance with Server Components
- Built-in support for layouts reduces code duplication
- ISR enables fast page loads without stale data
- Vercel optimizes Next.js deployments automatically
- Strong TypeScript support for type safety

#### React 18
**Features Used**:
- Server Components for data fetching
- Suspense for loading states
- Concurrent rendering for smooth UX
- useOptimistic for optimistic updates (admin actions)

#### TypeScript 5.x
**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Rationale**: Strict mode catches errors early, path aliases improve imports, Next.js plugin provides type-checking for routes.

#### UI Framework: Tailwind CSS 3.x + shadcn/ui
**Why Tailwind**:
- Utility-first CSS for rapid development
- Small bundle size (unused classes purged)
- Consistent design system
- Excellent mobile-first responsive utilities

**Why shadcn/ui**:
- Unstyled, accessible component primitives (Radix UI)
- Copy-paste components (no dependency bloat)
- Full TypeScript support
- Customizable with Tailwind

**Core Components to Install**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea
npx shadcn-ui@latest add dropdown-menu dialog alert tabs badge
npx shadcn-ui@latest add form table pagination skeleton
```

**Tailwind Config** (`tailwind.config.js`):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // For future dark mode
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... shadcn color system
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'), // For markdown rendering
  ],
};
```

#### Additional Frontend Libraries

```json
{
  "dependencies": {
    // Core
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",

    // Supabase
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.0.10", // For Next.js App Router

    // Internationalization
    "next-intl": "^3.0.0",

    // Forms & Validation
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",

    // UI Components
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",

    // Markdown & Content
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0", // GitHub Flavored Markdown
    "rehype-sanitize": "^6.0.0", // XSS protection

    // QR Code Generation
    "qrcode": "^1.5.3",
    "@types/qrcode": "^1.5.5",

    // File Upload
    "react-dropzone": "^14.2.3",

    // Date Handling
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0",

    // Icons
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "^5.2.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",

    // Linting & Formatting
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.0",

    // Testing (Future)
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vitest": "^1.0.0"
  }
}
```

### Backend Technology Stack

#### Supabase (All-in-one Backend)
**Selected Plan**: Free tier for MVP, Pro ($25/mo) for production

**Core Services Used**:

1. **PostgreSQL Database** (v15):
   - ACID-compliant relational database
   - Row Level Security (RLS) for authorization
   - Full-text search with tsvector
   - Triggers for workflow automation
   - Automatic backups (daily on Pro plan)

2. **Supabase Auth**:
   - Email/password authentication
   - JWT-based sessions (configurable expiry)
   - User metadata for roles (admin, docente)
   - Password reset via email templates
   - Rate limiting on auth endpoints

3. **Supabase Storage**:
   - S3-compatible object storage
   - Public buckets with RLS policies
   - Automatic CDN caching
   - Image transformation API
   - 1GB free, $0.021/GB beyond

4. **Supabase Realtime** (Optional for MVP):
   - PostgreSQL change data capture (CDC)
   - WebSocket subscriptions
   - Live updates for admin dashboard

**Supabase Client Configuration**:
```typescript
// src/lib/supabase/client.ts (Client-side)
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// src/lib/supabase/server.ts (Server-side)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};
```

**Rationale**:
- Eliminates need for custom backend server
- RLS policies enforce authorization at database level
- Built-in auth reduces security surface area
- PostgreSQL provides robust full-text search
- Cost-effective: Free tier covers MVP, Pro plan scales

#### Alternative Considered: Custom Node.js Backend
**Why Rejected**:
- Requires separate hosting (e.g., Railway, Fly.io)
- More complex auth implementation
- RLS provides equivalent security with less code
- Supabase free tier more generous than PaaS offerings
- Team prefers managed services over custom ops

---

## Database Architecture

### Database Schema (Supabase PostgreSQL)

#### Complete SQL Schema

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('docente', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  storage_used_mb INTEGER DEFAULT 0,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE status = 'active';

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: themes
-- ============================================================================
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  description_it TEXT NOT NULL CHECK (char_length(description_it) BETWEEN 50 AND 500),
  description_en TEXT CHECK (description_en IS NULL OR char_length(description_en) BETWEEN 50 AND 500),
  slug TEXT UNIQUE NOT NULL,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Indexes
CREATE UNIQUE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_status ON themes(status);
CREATE INDEX idx_themes_display_order ON themes(display_order) WHERE status = 'published';

-- RLS Policies
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Themes viewable by all (public)"
  ON themes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users view all themes"
  ON themes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage themes"
  ON themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: works
-- ============================================================================
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL CHECK (char_length(title_it) BETWEEN 1 AND 100),
  title_en TEXT CHECK (title_en IS NULL OR char_length(title_en) BETWEEN 1 AND 100),
  description_it TEXT NOT NULL CHECK (char_length(description_it) BETWEEN 10 AND 2000),
  description_en TEXT CHECK (description_en IS NULL OR char_length(description_en) BETWEEN 10 AND 2000),
  class_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  school_year TEXT NOT NULL CHECK (school_year ~* '^\d{4}-\d{2}$'), -- Format: 2024-25
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'needs_revision', 'archived')),
  license TEXT CHECK (license IN ('none', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA')),
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  search_vector TSVECTOR -- Full-text search
);

-- Indexes
CREATE INDEX idx_works_created_by ON works(created_by);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_published_at ON works(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_works_class_name ON works(class_name) WHERE status = 'published';
CREATE INDEX idx_works_school_year ON works(school_year) WHERE status = 'published';
CREATE INDEX idx_works_search_vector ON works USING GIN(search_vector); -- Full-text search
CREATE INDEX idx_works_tags ON works USING GIN(tags); -- Array search

-- RLS Policies
ALTER TABLE works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published works viewable by all"
  ON works FOR SELECT
  USING (status = 'published');

CREATE POLICY "Teachers view own works"
  ON works FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Admins view all works"
  ON works FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Teachers create works"
  ON works FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Teachers update own draft/revision works"
  ON works FOR UPDATE
  USING (
    created_by = auth.uid() AND
    status IN ('draft', 'needs_revision')
  );

CREATE POLICY "Admins update all works"
  ON works FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Teachers delete own draft works"
  ON works FOR DELETE
  USING (
    created_by = auth.uid() AND
    status = 'draft'
  );

CREATE POLICY "Admins delete works"
  ON works FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: work_themes (Junction Table)
-- ============================================================================
CREATE TABLE work_themes (
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (work_id, theme_id)
);

-- Indexes
CREATE INDEX idx_work_themes_theme_id ON work_themes(theme_id);
CREATE INDEX idx_work_themes_work_id ON work_themes(work_id);

-- RLS Policies
ALTER TABLE work_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Work-theme associations viewable by all"
  ON work_themes FOR SELECT
  USING (true);

CREATE POLICY "Teachers manage own work associations"
  ON work_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_themes.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage all associations"
  ON work_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: work_attachments
-- ============================================================================
CREATE TABLE work_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT file_size_limit CHECK (file_size_bytes <= 10485760) -- 10MB max
);

-- Indexes
CREATE INDEX idx_work_attachments_work_id ON work_attachments(work_id);

-- RLS Policies
ALTER TABLE work_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable with published works"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND status = 'published'
    )
  );

CREATE POLICY "Teachers view own work attachments"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins view all attachments"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Teachers manage own work attachments"
  ON work_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers delete own work attachments"
  ON work_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage all attachments"
  ON work_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: work_links
-- ============================================================================
CREATE TABLE work_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  url TEXT NOT NULL CHECK (url ~* '^https?://'),
  link_type TEXT NOT NULL CHECK (link_type IN ('youtube', 'vimeo', 'drive', 'other')),
  custom_label TEXT,
  preview_title TEXT,
  preview_thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_links_work_id ON work_links(work_id);

-- RLS Policies (same as work_attachments)
ALTER TABLE work_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links viewable with published works"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND status = 'published'
    )
  );

CREATE POLICY "Teachers view own work links"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins view all links"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Teachers manage own work links"
  ON work_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers delete own work links"
  ON work_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage all links"
  ON work_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: qr_codes
-- ============================================================================
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL CHECK (char_length(short_code) = 6),
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  CONSTRAINT short_code_format CHECK (short_code ~* '^[A-Za-z0-9]{6}$')
);

-- Indexes
CREATE UNIQUE INDEX idx_qr_codes_short_code ON qr_codes(short_code);
CREATE INDEX idx_qr_codes_theme_id ON qr_codes(theme_id);
CREATE INDEX idx_qr_codes_active ON qr_codes(theme_id) WHERE is_active = true;

-- RLS Policies
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR codes viewable by all (for redirection)"
  ON qr_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage QR codes"
  ON qr_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: qr_scans (Analytics)
-- ============================================================================
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  referer TEXT
);

-- Indexes
CREATE INDEX idx_qr_scans_scanned_at ON qr_scans(scanned_at DESC);
CREATE INDEX idx_qr_scans_theme_id ON qr_scans(theme_id);
CREATE INDEX idx_qr_scans_qr_code_id ON qr_scans(qr_code_id);
CREATE INDEX idx_qr_scans_hashed_ip ON qr_scans(hashed_ip);

-- RLS Policies
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all scans"
  ON qr_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Public can insert scans (logging)"
  ON qr_scans FOR INSERT
  WITH CHECK (true); -- No auth required for logging

-- ============================================================================
-- TABLE: work_views (Analytics)
-- ============================================================================
CREATE TABLE work_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  referrer TEXT CHECK (referrer IN ('theme_page', 'search', 'direct', 'external')),
  user_agent TEXT,
  session_id TEXT -- For deduplication in analytics
);

-- Indexes
CREATE INDEX idx_work_views_viewed_at ON work_views(viewed_at DESC);
CREATE INDEX idx_work_views_work_id ON work_views(work_id);
CREATE INDEX idx_work_views_session_id ON work_views(session_id);

-- RLS Policies (same as qr_scans)
ALTER TABLE work_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all views"
  ON work_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Public can insert views (logging)"
  ON work_views FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TABLE: work_reviews (Admin Feedback)
-- ============================================================================
CREATE TABLE work_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rejection_requires_comments CHECK (
    action != 'rejected' OR (comments IS NOT NULL AND char_length(comments) > 10)
  )
);

-- Indexes
CREATE INDEX idx_work_reviews_work_id ON work_reviews(work_id);
CREATE INDEX idx_work_reviews_reviewed_at ON work_reviews(reviewed_at DESC);
CREATE INDEX idx_work_reviews_reviewer_id ON work_reviews(reviewer_id);

-- RLS Policies
ALTER TABLE work_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view reviews of own works"
  ON work_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_reviews.work_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins view all reviews"
  ON work_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins insert reviews"
  ON work_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    ) AND reviewer_id = auth.uid()
  );

-- ============================================================================
-- TABLE: config (Application Settings)
-- ============================================================================
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- RLS Policies
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config readable by all"
  ON config FOR SELECT
  USING (true);

CREATE POLICY "Admins update config"
  ON config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins insert config"
  ON config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Seed data
INSERT INTO config (key, value, description) VALUES
  ('daily_salt', gen_random_uuid()::TEXT, 'Daily salt for IP hashing (regenerated daily)'),
  ('school_name_it', 'Scuola Esempio', 'School name in Italian'),
  ('school_name_en', 'Example School', 'School name in English'),
  ('max_file_size_mb', '10', 'Maximum file upload size in MB'),
  ('max_files_per_work', '5', 'Maximum number of files per work'),
  ('max_links_per_work', '5', 'Maximum number of external links per work'),
  ('teacher_storage_quota_mb', '500', 'Storage quota per teacher in MB'),
  ('qr_scan_dedup_minutes', '5', 'Deduplication window for QR scans (same IP within X minutes)'),
  ('work_view_dedup_minutes', '30', 'Deduplication window for work views');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update work search vector
CREATE OR REPLACE FUNCTION update_works_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title_it, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_it, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_works_search_vector
  BEFORE INSERT OR UPDATE OF title_it, title_en, description_it, description_en, tags
  ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_works_search_vector();

-- Function: Update work status timestamps
CREATE OR REPLACE FUNCTION update_work_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set submitted_at when status changes to pending_review
  IF NEW.status = 'pending_review' AND OLD.status != 'pending_review' THEN
    NEW.submitted_at := NOW();
  END IF;

  -- Set published_at when status changes to published
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at := NOW();
  END IF;

  -- Increment edit_count when resubmitting after needs_revision
  IF NEW.status = 'pending_review' AND OLD.status = 'needs_revision' THEN
    NEW.edit_count := OLD.edit_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_status_timestamps
  BEFORE UPDATE OF status ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_work_status_timestamps();

-- Function: Increment QR scan count
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET
    scan_count = scan_count + 1,
    last_scanned_at = NEW.scanned_at
  WHERE id = NEW.qr_code_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_qr_scan_count
  AFTER INSERT ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION increment_qr_scan_count();

-- Function: Increment work view count
CREATE OR REPLACE FUNCTION increment_work_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE works
  SET view_count = view_count + 1
  WHERE id = NEW.work_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_work_view_count
  AFTER INSERT ON work_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_work_view_count();

-- Function: Calculate teacher storage usage
CREATE OR REPLACE FUNCTION calculate_teacher_storage()
RETURNS TRIGGER AS $$
DECLARE
  teacher_id UUID;
  total_size_mb NUMERIC;
BEGIN
  -- Get teacher ID from work
  SELECT created_by INTO teacher_id FROM works WHERE id = NEW.work_id;

  -- Calculate total storage
  SELECT COALESCE(SUM(file_size_bytes) / 1048576.0, 0)
  INTO total_size_mb
  FROM work_attachments wa
  INNER JOIN works w ON wa.work_id = w.id
  WHERE w.created_by = teacher_id;

  -- Update user storage
  UPDATE users
  SET storage_used_mb = ROUND(total_size_mb::numeric, 2)
  WHERE id = teacher_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_teacher_storage_insert
  AFTER INSERT ON work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_teacher_storage();

CREATE TRIGGER trigger_calculate_teacher_storage_delete
  AFTER DELETE ON work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_teacher_storage();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Daily scan statistics
CREATE OR REPLACE VIEW daily_scan_stats AS
SELECT
  DATE(scanned_at) as scan_date,
  theme_id,
  COUNT(*) as scan_count,
  COUNT(DISTINCT hashed_ip) as unique_visitors,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_scans,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_scans,
  COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_scans
FROM qr_scans
GROUP BY DATE(scanned_at), theme_id
ORDER BY scan_date DESC;

-- View: Work performance statistics
CREATE OR REPLACE VIEW work_performance_stats AS
SELECT
  w.id,
  w.title_it,
  w.class_name,
  w.school_year,
  w.view_count,
  w.published_at,
  COUNT(DISTINCT wv.id) as detail_views,
  COUNT(DISTINCT wv.hashed_ip) as unique_viewers,
  COALESCE(AVG(EXTRACT(EPOCH FROM wv.viewed_at - w.published_at) / 86400), 0) as avg_days_to_view
FROM works w
LEFT JOIN work_views wv ON w.id = wv.work_id
WHERE w.status = 'published'
GROUP BY w.id, w.title_it, w.class_name, w.school_year, w.view_count, w.published_at;

-- View: Admin review queue
CREATE OR REPLACE VIEW admin_review_queue AS
SELECT
  w.id,
  w.title_it,
  w.class_name,
  w.teacher_name,
  w.submitted_at,
  w.edit_count,
  u.name as teacher_full_name,
  u.email as teacher_email,
  (SELECT COUNT(*) FROM work_attachments WHERE work_id = w.id) as attachment_count,
  (SELECT COUNT(*) FROM work_links WHERE work_id = w.id) as link_count,
  EXTRACT(EPOCH FROM (NOW() - w.submitted_at)) / 3600 as hours_pending
FROM works w
INNER JOIN users u ON w.created_by = u.id
WHERE w.status = 'pending_review'
ORDER BY w.submitted_at ASC;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Generate unique short code
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM qr_codes WHERE short_code = result) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique short code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Hash IP address for analytics
CREATE OR REPLACE FUNCTION hash_ip(ip_address TEXT)
RETURNS TEXT AS $$
DECLARE
  daily_salt TEXT;
BEGIN
  SELECT value INTO daily_salt FROM config WHERE key = 'daily_salt';
  RETURN encode(digest(ip_address || daily_salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Regenerate daily salt (should be called via cron job)
CREATE OR REPLACE FUNCTION regenerate_daily_salt()
RETURNS VOID AS $$
BEGIN
  UPDATE config
  SET value = gen_random_uuid()::TEXT, updated_at = NOW()
  WHERE key = 'daily_salt';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL SEED DATA (for development)
-- ============================================================================

-- Note: In production, create admin user via Supabase Dashboard or CLI
-- This is just for reference

-- Example theme (admin would create via dashboard)
/*
INSERT INTO themes (title_it, title_en, description_it, description_en, slug, status) VALUES
  (
    'Il Rinascimento Digitale',
    'The Digital Renaissance',
    'Una collezione di progetti che esplorano l''intersezione tra arte classica e tecnologia moderna.',
    'A collection of projects exploring the intersection of classical art and modern technology.',
    'rinascimento-digitale',
    'published'
  );
*/
```

### TypeScript Database Types

Generate TypeScript types from Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

**Manual Types Definition** (`src/types/database.ts`):

```typescript
export type UserRole = 'docente' | 'admin';
export type UserStatus = 'active' | 'invited' | 'suspended';
export type ThemeStatus = 'draft' | 'published' | 'archived';
export type WorkStatus = 'draft' | 'pending_review' | 'published' | 'needs_revision' | 'archived';
export type LicenseType = 'none' | 'CC BY' | 'CC BY-SA' | 'CC BY-NC' | 'CC BY-NC-SA';
export type LinkType = 'youtube' | 'vimeo' | 'drive' | 'other';
export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';
export type ReferrerType = 'theme_page' | 'search' | 'direct' | 'external';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
  storage_used_mb: number;
}

export interface Theme {
  id: string;
  title_it: string;
  title_en: string | null;
  description_it: string;
  description_en: string | null;
  slug: string;
  featured_image_url: string | null;
  status: ThemeStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Work {
  id: string;
  title_it: string;
  title_en: string | null;
  description_it: string;
  description_en: string | null;
  class_name: string;
  teacher_name: string;
  school_year: string;
  status: WorkStatus;
  license: LicenseType | null;
  tags: string[];
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  published_at: string | null;
  edit_count: number;
}

export interface WorkTheme {
  work_id: string;
  theme_id: string;
  created_at: string;
}

export interface WorkAttachment {
  id: string;
  work_id: string;
  file_name: string;
  file_size_bytes: number;
  file_type: 'pdf' | 'image';
  mime_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  uploaded_at: string;
}

export interface WorkLink {
  id: string;
  work_id: string;
  url: string;
  link_type: LinkType;
  custom_label: string | null;
  preview_title: string | null;
  preview_thumbnail_url: string | null;
  created_at: string;
}

export interface QRCode {
  id: string;
  theme_id: string;
  short_code: string;
  is_active: boolean;
  scan_count: number;
  created_at: string;
  last_scanned_at: string | null;
}

export interface QRScan {
  id: string;
  qr_code_id: string;
  theme_id: string | null;
  scanned_at: string;
  hashed_ip: string;
  user_agent: string | null;
  device_type: DeviceType;
  referer: string | null;
}

export interface WorkView {
  id: string;
  work_id: string;
  viewed_at: string;
  hashed_ip: string;
  referrer: ReferrerType;
  user_agent: string | null;
  session_id: string | null;
}

export interface WorkReview {
  id: string;
  work_id: string;
  reviewer_id: string | null;
  action: 'approved' | 'rejected';
  comments: string | null;
  reviewed_at: string;
}

export interface Config {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Extended types with joins
export interface WorkWithRelations extends Work {
  themes: Theme[];
  attachments: WorkAttachment[];
  links: WorkLink[];
  reviews: WorkReview[];
  creator: User;
}

export interface ThemeWithWorks extends Theme {
  works: Work[];
  work_count: number;
}
```

---

## API Contract Specifications

### API Architecture Overview

**Approach**: Hybrid API strategy
- **Supabase Client SDK**: Direct database queries for most operations (leverages RLS)
- **Next.js API Routes**: Custom endpoints for complex operations (QR redirect, analytics, file uploads)
- **Server Actions**: Form submissions and mutations (Next.js 14 feature)

### Supabase Client Operations

#### Authentication Operations

```typescript
// src/lib/api/auth.ts
import { createClient } from '@/lib/supabase/client';

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role || null;
}
```

#### Theme Operations

```typescript
// src/lib/api/themes.ts
import { createClient } from '@/lib/supabase/client';
import type { Theme, ThemeWithWorks } from '@/types/database';

// Fetch all published themes (public)
export async function getPublishedThemes(): Promise<Theme[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch single theme by slug with works (public)
export async function getThemeBySlug(slug: string): Promise<ThemeWithWorks | null> {
  const supabase = createClient();
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (themeError || !theme) return null;

  const { data: works, error: worksError } = await supabase
    .from('works')
    .select(`
      *,
      work_themes!inner(theme_id)
    `)
    .eq('work_themes.theme_id', theme.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return {
    ...theme,
    works: works || [],
    work_count: works?.length || 0,
  };
}

// Create theme (admin only)
export async function createTheme(themeData: Omit<Theme, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('themes')
    .insert(themeData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update theme (admin only)
export async function updateTheme(id: string, updates: Partial<Theme>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('themes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete theme (admin only)
export async function deleteTheme(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

#### Work Operations

```typescript
// src/lib/api/works.ts
import { createClient } from '@/lib/supabase/client';
import type { Work, WorkWithRelations } from '@/types/database';

// Fetch work by ID with relations (public if published, restricted if draft)
export async function getWorkById(id: string): Promise<WorkWithRelations | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('works')
    .select(`
      *,
      themes:work_themes(theme:themes(*)),
      attachments:work_attachments(*),
      links:work_links(*),
      reviews:work_reviews(*),
      creator:users(name, email)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as unknown as WorkWithRelations;
}

// Search works with filters (public)
export interface WorkFilter {
  themeId?: string;
  className?: string;
  schoolYear?: string;
  teacherName?: string;
  tags?: string[];
  searchQuery?: string;
}

export async function searchWorks(filter: WorkFilter, page = 1, perPage = 50) {
  const supabase = createClient();
  let query = supabase
    .from('works')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  // Apply filters
  if (filter.themeId) {
    query = query.contains('work_themes.theme_id', [filter.themeId]);
  }
  if (filter.className) {
    query = query.eq('class_name', filter.className);
  }
  if (filter.schoolYear) {
    query = query.eq('school_year', filter.schoolYear);
  }
  if (filter.teacherName) {
    query = query.ilike('teacher_name', `%${filter.teacherName}%`);
  }
  if (filter.tags && filter.tags.length > 0) {
    query = query.overlaps('tags', filter.tags);
  }
  if (filter.searchQuery) {
    query = query.textSearch('search_vector', filter.searchQuery, {
      type: 'websearch',
      config: 'italian',
    });
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    works: data || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}

// Create work (teacher/admin)
export async function createWork(workData: Omit<Work, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'edit_count'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('works')
    .insert(workData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update work (teacher own works or admin)
export async function updateWork(id: string, updates: Partial<Work>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('works')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Submit work for review
export async function submitWorkForReview(id: string) {
  return updateWork(id, { status: 'pending_review' });
}

// Get teacher's works
export async function getTeacherWorks(teacherId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .eq('created_by', teacherId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get admin review queue
export async function getReviewQueue() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('admin_review_queue')
    .select('*');

  if (error) throw error;
  return data || [];
}
```

### Next.js API Routes

#### QR Code Redirect & Tracking

**Endpoint**: `GET /api/qr/[shortCode]/redirect`

```typescript
// src/app/api/qr/[shortCode]/redirect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashIP } from '@/lib/utils/analytics';
import { detectDeviceType } from '@/lib/utils/device';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params;
  const supabase = createClient();

  // Lookup QR code
  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select('id, theme_id, themes(slug)')
    .eq('short_code', shortCode)
    .eq('is_active', true)
    .single();

  if (error || !qrCode) {
    return NextResponse.redirect(new URL('/404', request.url), 302);
  }

  // Log scan (fire and forget)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';

  supabase
    .from('qr_scans')
    .insert({
      qr_code_id: qrCode.id,
      theme_id: qrCode.theme_id,
      hashed_ip: hashIP(ip),
      user_agent: userAgent,
      device_type: detectDeviceType(userAgent),
      referer: referer,
    })
    .then(() => {
      console.log(`QR scan logged: ${shortCode}`);
    });

  // Redirect to theme page
  const themeSlug = qrCode.themes?.slug;
  if (!themeSlug) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  return NextResponse.redirect(new URL(`/themes/${themeSlug}`, request.url), 302);
}
```

**Utility Functions**:
```typescript
// src/lib/utils/analytics.ts
import crypto from 'crypto';

export function hashIP(ip: string): string {
  // In production, fetch daily salt from config table
  const salt = process.env.DAILY_SALT || 'default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

// src/lib/utils/device.ts
export function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  if (/Windows|Macintosh|Linux/.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}
```

#### Work View Tracking

**Endpoint**: `POST /api/works/[id]/view`

```typescript
// src/app/api/works/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashIP } from '@/lib/utils/analytics';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { referrer, sessionId } = body;

  const supabase = createClient();

  // Check if work exists and is published
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('id, status')
    .eq('id', id)
    .single();

  if (workError || !work || work.status !== 'published') {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  }

  // Log view
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  const { error: insertError } = await supabase
    .from('work_views')
    .insert({
      work_id: id,
      hashed_ip: hashIP(ip),
      referrer: referrer || 'direct',
      user_agent: userAgent,
      session_id: sessionId,
    });

  if (insertError) {
    console.error('Failed to log work view:', insertError);
    return NextResponse.json({ error: 'Failed to log view' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

#### File Upload Presigned URL

**Endpoint**: `POST /api/upload/presign`

```typescript
// src/app/api/upload/presign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PresignRequest {
  workId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function POST(request: NextRequest) {
  const body: PresignRequest = await request.json();
  const { workId, fileName, fileType, fileSize } = body;

  const supabase = createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns work or is admin
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('created_by')
    .eq('id', workId)
    .single();

  if (workError || !work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (work.created_by !== user.id && userRole?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate file size (10MB max)
  if (fileSize > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Generate storage path
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
  const storagePath = `${workId}/${timestamp}_${sanitizedFileName}`;

  // Create signed URL (Supabase handles this via storage API)
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('work_attachments')
    .createSignedUploadUrl(storagePath);

  if (uploadError) {
    console.error('Failed to create signed URL:', uploadError);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl: uploadData.signedUrl,
    storagePath: storagePath,
    token: uploadData.token,
  });
}
```

#### Work Review Action

**Endpoint**: `POST /api/works/[id]/review`

```typescript
// src/app/api/works/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ReviewRequest {
  action: 'approved' | 'rejected';
  comments?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body: ReviewRequest = await request.json();
  const { action, comments } = body;

  const supabase = createClient();

  // Verify admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRole?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate request
  if (action === 'rejected' && (!comments || comments.trim().length < 10)) {
    return NextResponse.json({ error: 'Rejection requires comments (min 10 chars)' }, { status: 400 });
  }

  // Fetch work
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .single();

  if (workError || !work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  }

  if (work.status !== 'pending_review') {
    return NextResponse.json({ error: 'Work is not pending review' }, { status: 400 });
  }

  // Update work status
  const newStatus = action === 'approved' ? 'published' : 'needs_revision';
  const { error: updateError } = await supabase
    .from('works')
    .update({ status: newStatus })
    .eq('id', id);

  if (updateError) {
    console.error('Failed to update work:', updateError);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }

  // Insert review record
  const { error: reviewError } = await supabase
    .from('work_reviews')
    .insert({
      work_id: id,
      reviewer_id: user.id,
      action: action,
      comments: comments || null,
    });

  if (reviewError) {
    console.error('Failed to insert review:', reviewError);
  }

  // Revalidate relevant pages
  revalidatePath('/dashboard/admin/review-queue');
  revalidatePath(`/works/${id}`);

  // TODO: Send email notification to teacher (via Supabase Edge Function or webhook)

  return NextResponse.json({ success: true, newStatus });
}
```

#### Analytics Dashboard

**Endpoint**: `GET /api/analytics/dashboard`

```typescript
// src/app/api/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Verify admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRole?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch aggregated stats
  const [
    totalScans,
    totalViews,
    totalWorks,
    pendingReviews,
    recentScans,
    topWorks,
  ] = await Promise.all([
    supabase.from('qr_scans').select('id', { count: 'exact', head: true }),
    supabase.from('work_views').select('id', { count: 'exact', head: true }),
    supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('daily_scan_stats').select('*').order('scan_date', { ascending: false }).limit(30),
    supabase.from('work_performance_stats').select('*').order('view_count', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    totalScans: totalScans.count || 0,
    totalViews: totalViews.count || 0,
    totalWorks: totalWorks.count || 0,
    pendingReviews: pendingReviews.count || 0,
    recentScans: recentScans.data || [],
    topWorks: topWorks.data || [],
  });
}
```

### API Response Schemas (Zod Validation)

```typescript
// src/lib/validation/api.ts
import { z } from 'zod';

export const WorkFilterSchema = z.object({
  themeId: z.string().uuid().optional(),
  className: z.string().optional(),
  schoolYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  teacherName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().min(3).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(50),
});

export const CreateWorkSchema = z.object({
  title_it: z.string().min(1).max(100),
  title_en: z.string().min(1).max(100).optional(),
  description_it: z.string().min(10).max(2000),
  description_en: z.string().min(10).max(2000).optional(),
  class_name: z.string().min(1),
  teacher_name: z.string().min(1),
  school_year: z.string().regex(/^\d{4}-\d{2}$/),
  license: z.enum(['none', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA']).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const UpdateWorkSchema = CreateWorkSchema.partial();

export const ReviewWorkSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  comments: z.string().min(10).optional(),
}).refine(
  (data) => data.action !== 'rejected' || (data.comments && data.comments.length >= 10),
  { message: 'Rejection requires comments (min 10 chars)', path: ['comments'] }
);

export const PresignRequestSchema = z.object({
  workId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
});
```

---

## Frontend Architecture

### Next.js App Router Structure

```
src/
├── app/
│   ├── [locale]/                      # Internationalized routes
│   │   ├── layout.tsx                 # Locale-specific layout (i18n provider)
│   │   ├── page.tsx                   # Homepage (theme gallery)
│   │   ├── themes/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx           # Theme detail page (ISR)
│   │   ├── works/
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Work detail page (SSR)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # Dashboard layout (auth check)
│   │   │   ├── teacher/
│   │   │   │   ├── page.tsx           # Teacher dashboard
│   │   │   │   ├── works/
│   │   │   │   │   ├── page.tsx       # My works list
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx   # Create work form
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx # Edit work form
│   │   │   └── admin/
│   │   │       ├── page.tsx           # Admin dashboard
│   │   │       ├── review-queue/
│   │   │       │   └── page.tsx       # Review queue
│   │   │       ├── themes/
│   │   │       │   ├── page.tsx       # Manage themes
│   │   │       │   └── [id]/
│   │   │       │       └── qr/
│   │   │       │           └── page.tsx # QR generation
│   │   │       ├── analytics/
│   │   │       │   └── page.tsx       # Analytics dashboard
│   │   │       └── users/
│   │   │           └── page.tsx       # User management
│   │   ├── login/
│   │   │   └── page.tsx               # Login page
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts           # Auth callback handler
│   │   │   └── reset-password/
│   │   │       └── page.tsx           # Password reset page
│   │   └── error.tsx                  # Error boundary
│   ├── api/
│   │   ├── qr/
│   │   │   └── [shortCode]/
│   │   │       └── redirect/
│   │   │           └── route.ts       # QR redirect endpoint
│   │   ├── works/
│   │   │   └── [id]/
│   │   │       ├── view/
│   │   │       │   └── route.ts       # Track work view
│   │   │       └── review/
│   │   │           └── route.ts       # Review work
│   │   ├── upload/
│   │   │   └── presign/
│   │   │       └── route.ts           # Generate presigned URL
│   │   └── analytics/
│   │       └── dashboard/
│   │           └── route.ts           # Analytics data
│   ├── layout.tsx                     # Root layout (HTML, fonts, providers)
│   ├── globals.css                    # Global styles (Tailwind)
│   └── not-found.tsx                  # 404 page
├── components/
│   ├── ui/                            # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── shared/                        # Shared components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── LoadingSpinner.tsx
│   ├── theme/                         # Theme-related components
│   │   ├── ThemeCard.tsx
│   │   ├── ThemeGrid.tsx
│   │   └── ThemeHeader.tsx
│   ├── work/                          # Work-related components
│   │   ├── WorkCard.tsx
│   │   ├── WorkGrid.tsx
│   │   ├── WorkFilter.tsx             # Client Component
│   │   ├── WorkSearch.tsx             # Client Component
│   │   ├── WorkDetail.tsx
│   │   ├── WorkAttachments.tsx
│   │   └── WorkLinks.tsx
│   ├── forms/                         # Form components
│   │   ├── WorkForm.tsx               # Client Component
│   │   ├── FileUploader.tsx           # Client Component
│   │   ├── LinkInput.tsx              # Client Component
│   │   └── ThemeSelector.tsx          # Client Component
│   ├── admin/                         # Admin components
│   │   ├── ReviewQueue.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── QRGenerator.tsx            # Client Component
│   │   ├── AnalyticsDashboard.tsx
│   │   └── UserManagement.tsx
│   └── markdown/
│       └── MarkdownRenderer.tsx       # Server Component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   └── server.ts                  # Server client
│   ├── api/                           # API client functions
│   │   ├── auth.ts
│   │   ├── themes.ts
│   │   ├── works.ts
│   │   ├── qr.ts
│   │   └── analytics.ts
│   ├── utils/
│   │   ├── analytics.ts               # IP hashing, etc.
│   │   ├── device.ts                  # Device detection
│   │   ├── qr.ts                      # QR generation
│   │   ├── slug.ts                    # Slug generation
│   │   └── cn.ts                      # Class name utility
│   ├── validation/                    # Zod schemas
│   │   ├── api.ts
│   │   ├── forms.ts
│   │   └── schemas.ts
│   └── hooks/                         # React hooks
│       ├── useAuth.ts
│       ├── useWorks.ts
│       ├── useThemes.ts
│       └── useDebounce.ts
├── types/
│   ├── database.ts                    # Database types
│   ├── supabase.ts                    # Generated Supabase types
│   └── common.ts                      # Common types
├── middleware.ts                      # Next.js middleware (auth, i18n)
└── messages/                          # i18n translation files
    ├── it.json
    └── en.json
```

### Component Architecture

#### Server vs Client Components Strategy

**Server Components (Default)**:
- Page layouts and shells
- Data fetching components
- Static content rendering
- Markdown rendering
- Theme cards (non-interactive)
- Work cards (non-interactive)

**Client Components (Explicit "use client")**:
- Forms and form inputs
- Interactive filters and search
- File upload components
- Modal dialogs
- Dropdowns and selects
- Real-time updates (Supabase Realtime)
- Language toggle

#### Key Page Components

**Homepage** (`app/[locale]/page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server';
import { ThemeGrid } from '@/components/theme/ThemeGrid';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations('HomePage');
  const supabase = createClient();

  const { data: themes } = await supabase
    .from('themes')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <ThemeGrid themes={themes || []} />
    </main>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes
```

**Theme Detail Page** (`app/[locale]/themes/[slug]/page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WorkFilter } from '@/components/work/WorkFilter';
import { WorkGrid } from '@/components/work/WorkGrid';

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const supabase = createClient();
  const { data: theme } = await supabase
    .from('themes')
    .select('title_it, title_en, description_it, description_en')
    .eq('slug', params.slug)
    .single();

  if (!theme) return {};

  const title = params.locale === 'en' && theme.title_en ? theme.title_en : theme.title_it;
  const description = params.locale === 'en' && theme.description_en ? theme.description_en : theme.description_it;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ThemePage({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string };
}) {
  const supabase = createClient();

  const { data: theme } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!theme) notFound();

  const { data: works } = await supabase
    .from('works')
    .select(`
      *,
      work_themes!inner(theme_id)
    `)
    .eq('work_themes.theme_id', theme.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">
        {locale === 'en' && theme.title_en ? theme.title_en : theme.title_it}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {locale === 'en' && theme.description_en ? theme.description_en : theme.description_it}
      </p>

      {/* Client Component for filtering */}
      <WorkFilter initialWorks={works || []} />
    </main>
  );
}

export const revalidate = 60; // ISR: Revalidate every minute
```

**Work Detail Page** (`app/[locale]/works/[id]/page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WorkDetail } from '@/components/work/WorkDetail';
import { WorkViewTracker } from '@/components/work/WorkViewTracker';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';

export default async function WorkPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  const supabase = createClient();

  const { data: work } = await supabase
    .from('works')
    .select(`
      *,
      themes:work_themes(theme:themes(*)),
      attachments:work_attachments(*),
      links:work_links(*),
      creator:users(name)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!work) notFound();

  const title = locale === 'en' && work.title_en ? work.title_en : work.title_it;
  const description = locale === 'en' && work.description_en ? work.description_en : work.description_it;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Client Component to track view */}
      <WorkViewTracker workId={id} referrer="direct" />

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <div className="text-sm text-gray-600">
            <span>{work.class_name}</span> •
            <span>{work.teacher_name}</span> •
            <span>{work.school_year}</span>
          </div>
        </header>

        <div className="prose max-w-none mb-8">
          <MarkdownRenderer content={description} />
        </div>

        <WorkDetail work={work} locale={locale} />
      </article>
    </main>
  );
}

// SSR: Always fresh data
export const dynamic = 'force-dynamic';
```

**Teacher Dashboard** (`app/[locale]/dashboard/teacher/page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTeacherWorks } from '@/lib/api/works';
import { WorksTable } from '@/components/teacher/WorksTable';

export default async function TeacherDashboard() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single();

  if (userRole?.role !== 'docente' && userRole?.role !== 'admin') {
    redirect('/login');
  }

  const works = await getTeacherWorks(user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Welcome, {userRole.name || user.email}
      </h1>

      <div className="mb-8">
        <a
          href="/dashboard/teacher/works/new"
          className="btn btn-primary"
        >
          Create New Work
        </a>
      </div>

      <WorksTable works={works} />
    </main>
  );
}

export const dynamic = 'force-dynamic';
```

#### Key Client Components

**WorkFilter Component**:
```typescript
'use client';

import { useState, useMemo } from 'react';
import { Work } from '@/types/database';
import { WorkGrid } from './WorkGrid';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WorkFilterProps {
  initialWorks: Work[];
}

export function WorkFilter({ initialWorks }: WorkFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  // Extract unique values for filters
  const classes = useMemo(
    () => Array.from(new Set(initialWorks.map(w => w.class_name))).sort(),
    [initialWorks]
  );

  const years = useMemo(
    () => Array.from(new Set(initialWorks.map(w => w.school_year))).sort().reverse(),
    [initialWorks]
  );

  // Filter works client-side
  const filteredWorks = useMemo(() => {
    return initialWorks.filter(work => {
      if (selectedClass && work.class_name !== selectedClass) return false;
      if (selectedYear && work.school_year !== selectedYear) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          work.title_it.toLowerCase().includes(query) ||
          work.description_it.toLowerCase().includes(query) ||
          work.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [initialWorks, selectedClass, selectedYear, searchQuery]);

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-8">
        <Input
          type="search"
          placeholder="Search works..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={selectedClass || ''}
          onValueChange={(value) => setSelectedClass(value || null)}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </Select>

        <Select
          value={selectedYear || ''}
          onValueChange={(value) => setSelectedYear(value || null)}
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </Select>

        {(selectedClass || selectedYear || searchQuery) && (
          <button
            onClick={() => {
              setSelectedClass(null);
              setSelectedYear(null);
              setSearchQuery('');
            }}
            className="text-sm text-gray-600 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredWorks.length} of {initialWorks.length} works
      </div>

      <WorkGrid works={filteredWorks} />
    </div>
  );
}
```

**FileUploader Component**:
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { WorkAttachment } from '@/types/database';

interface FileUploaderProps {
  workId: string;
  onUploadComplete: (attachment: WorkAttachment) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function FileUploader({
  workId,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<Map<string, number>>(new Map());
  const [errors, setErrors] = useState<string[]>([]);
  const supabase = createClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrors([]);

    for (const file of acceptedFiles) {
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrors(prev => [...prev, `${file.name} exceeds ${maxSizeMB}MB limit`]);
        continue;
      }

      // Request presigned URL
      const uploadId = crypto.randomUUID();
      setUploads(prev => new Map(prev).set(uploadId, 0));

      try {
        const response = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, storagePath, token } = await response.json();

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('work_attachments')
          .uploadToSignedUrl(storagePath, token, file, {
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100;
              setUploads(prev => new Map(prev).set(uploadId, percent));
            },
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('work_attachments')
          .getPublicUrl(storagePath);

        // Insert attachment record
        const { data: attachment, error: insertError } = await supabase
          .from('work_attachments')
          .insert({
            work_id: workId,
            file_name: file.name,
            file_size_bytes: file.size,
            file_type: file.type.startsWith('image/') ? 'image' : 'pdf',
            mime_type: file.type,
            storage_path: storagePath,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setUploads(prev => {
          const next = new Map(prev);
          next.delete(uploadId);
          return next;
        });

        onUploadComplete(attachment);
      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => [...prev, `Failed to upload ${file.name}`]);
        setUploads(prev => {
          const next = new Map(prev);
          next.delete(uploadId);
          return next;
        });
      }
    }
  }, [workId, maxSizeMB, supabase, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>
            Drag and drop files here, or click to select
            <br />
            <span className="text-sm text-gray-500">
              PDF, JPG, PNG (max {maxSizeMB}MB per file)
            </span>
          </p>
        )}
      </div>

      {/* Upload progress */}
      {uploads.size > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(uploads.entries()).map(([id, progress]) => (
            <div key={id} className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Routing Strategy

**Public Routes** (No auth required):
- `/[locale]` - Homepage
- `/[locale]/themes/[slug]` - Theme detail
- `/[locale]/works/[id]` - Work detail
- `/[locale]/login` - Login page
- `/q/[shortCode]` - QR redirect (API route)

**Protected Routes** (Auth required):
- `/[locale]/dashboard/teacher/*` - Teacher area
- `/[locale]/dashboard/admin/*` - Admin area (role check)

**Middleware** (`middleware.ts`):
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Internationalization middleware
const intlMiddleware = createMiddleware({
  locales: ['it', 'en'],
  defaultLocale: 'it',
});

export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check authentication for dashboard routes
  if (request.nextUrl.pathname.includes('/dashboard')) {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role for admin routes
    if (request.nextUrl.pathname.includes('/dashboard/admin')) {
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userRole?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/teacher', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Authentication & Authorization

### Supabase Auth Setup

#### Authentication Flow

```typescript
// src/app/[locale]/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last login timestamp
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Fetch user role to redirect appropriately
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userRole?.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/teacher');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <Alert variant="destructive">{error}</Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>

        <div className="text-center text-sm">
          <a href="/auth/reset-password" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
      </form>
    </div>
  );
}
```

#### Session Management

**Session Configuration**:
- JWT expiry: 7 days (default)
- Refresh token rotation: enabled
- Auto-refresh: handled by Supabase client
- Session storage: HTTP-only cookies (secure)

**Auth State Hook**:
```typescript
// src/lib/hooks/useAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    setRole(data?.role ?? null);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isTeacher: role === 'docente',
    signOut,
  };
}
```

#### Password Reset Flow

```typescript
// src/app/[locale]/auth/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-md py-16">
        <Alert variant="success">
          Password reset email sent! Check your inbox.
        </Alert>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Reset Password</h1>

      <form onSubmit={handleResetRequest} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">{error}</Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <div className="text-center text-sm">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </div>
      </form>
    </div>
  );
}
```

### Role-Based Access Control (RBAC)

#### User Roles

| Role | Permissions |
|------|-------------|
| **docente** (Teacher) | Create works, edit own works (draft/needs_revision), view own works, submit for review, view own reviews |
| **admin** | All teacher permissions + approve/reject works, manage themes, generate QR codes, view analytics, manage users |

#### RLS Policy Strategy

**Design Principles**:
1. **Deny by default**: All tables have RLS enabled, no access unless explicitly granted
2. **Row-level checks**: Policies check auth.uid() and user role
3. **Performance**: Policies use indexed columns (created_by, role)
4. **Security**: No client-side role checks, all authorization at database level

**Example Policy Logic**:
```sql
-- Teachers can update their own draft or needs_revision works
CREATE POLICY "Teachers update own draft/revision works"
  ON works FOR UPDATE
  USING (
    created_by = auth.uid() AND
    status IN ('draft', 'needs_revision')
  );

-- Admins can update all works
CREATE POLICY "Admins update all works"
  ON works FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
```

**Protected Route Component**:
```typescript
// src/components/auth/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && role !== 'admin') {
        router.push('/dashboard/teacher');
      }
    }
  }, [user, role, loading, requireAdmin, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || (requireAdmin && role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
```

---

## File Storage & Content Delivery

### Supabase Storage Configuration

#### Storage Buckets

**Bucket: work_attachments** (Public read, authenticated write)
```sql
-- Create bucket (via Supabase Dashboard or SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('work_attachments', 'work_attachments', true);

-- Storage policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'work_attachments');

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'work_attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'work_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Bucket: theme_images** (Public read, admin write)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('theme_images', 'theme_images', true);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'theme_images');

CREATE POLICY "Allow admin uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'theme_images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Bucket: qr_codes** (Public read, admin write)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('qr_codes', 'qr_codes', true);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr_codes');

CREATE POLICY "Allow admin uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr_codes' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

#### File Upload Flow

**Server-Side Upload Function**:
```typescript
// src/lib/api/upload.ts
import { createClient } from '@/lib/supabase/server';

export async function uploadWorkAttachment(
  workId: string,
  file: File
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const supabase = createClient();

  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { error: 'File too large (max 10MB)' };
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type' };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const sanitizedName = file.name
    .replace(/[^a-z0-9._-]/gi, '_')
    .toLowerCase();
  const filename = `${timestamp}_${sanitizedName}`;
  const path = `${workId}/${filename}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from('work_attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('work_attachments')
    .getPublicUrl(path);

  return { path, publicUrl };
}
```

#### Image Optimization

**Next.js Image Component Configuration**:
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

**Optimized Image Component**:
```typescript
// src/components/shared/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    />
  );
}
```

### External Link Handling

#### Link Type Detection

```typescript
// src/lib/utils/links.ts
export type LinkType = 'youtube' | 'vimeo' | 'drive' | 'other';

export function detectLinkType(url: string): LinkType {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
    return 'drive';
  }
  return 'other';
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function extractVimeoId(url: string): string | null {
  const regExp = /vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function getEmbedUrl(url: string, type: LinkType): string {
  switch (type) {
    case 'youtube':
      const ytId = extractYouTubeId(url);
      return ytId ? `https://www.youtube.com/embed/${ytId}` : url;

    case 'vimeo':
      const vimeoId = extractVimeoId(url);
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : url;

    case 'drive':
      // Convert Google Drive preview link to embed
      const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
      return url;

    default:
      return url;
  }
}
```

#### Video Embed Component

```typescript
// src/components/work/VideoEmbed.tsx
'use client';

interface VideoEmbedProps {
  url: string;
  type: 'youtube' | 'vimeo' | 'drive';
  title?: string;
}

export function VideoEmbed({ url, type, title }: VideoEmbedProps) {
  const embedUrl = getEmbedUrl(url, type);

  return (
    <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
      <iframe
        src={embedUrl}
        title={title || 'Video'}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
```

---

## QR Code System

### QR Code Generation

#### QR Generation Utility

```typescript
// src/lib/utils/qr.ts
import QRCode from 'qrcode';

export interface QRGenerateOptions {
  format: 'svg' | 'png' | 'dataURL';
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCode(
  url: string,
  options: QRGenerateOptions = { format: 'svg' }
): Promise<string> {
  const {
    format,
    size = 512,
    margin = 4,
    color = { dark: '#000000', light: '#FFFFFF' },
  } = options;

  const qrOptions = {
    width: size,
    margin,
    color,
    errorCorrectionLevel: 'M' as const,
  };

  switch (format) {
    case 'svg':
      return QRCode.toString(url, { ...qrOptions, type: 'svg' });

    case 'png':
      const buffer = await QRCode.toBuffer(url, qrOptions);
      return buffer.toString('base64');

    case 'dataURL':
      return QRCode.toDataURL(url, qrOptions);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

#### QR Generator API Endpoint

```typescript
// src/app/api/qr/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQRCode, generateShortCode } from '@/lib/utils/qr';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Verify admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRole?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get theme ID from request
  const { themeId } = await request.json();

  if (!themeId) {
    return NextResponse.json({ error: 'Theme ID required' }, { status: 400 });
  }

  // Verify theme exists
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('id, slug')
    .eq('id', themeId)
    .single();

  if (themeError || !theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
  }

  // Generate unique short code
  let shortCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    shortCode = generateShortCode();

    const { data: existing } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('short_code', shortCode)
      .single();

    if (!existing) break;

    attempts++;
  }

  if (attempts >= maxAttempts) {
    return NextResponse.json(
      { error: 'Failed to generate unique code' },
      { status: 500 }
    );
  }

  // Create QR code record
  const { data: qrCode, error: insertError } = await supabase
    .from('qr_codes')
    .insert({
      theme_id: themeId,
      short_code: shortCode!,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create QR code' },
      { status: 500 }
    );
  }

  // Generate QR code images
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/q/${shortCode}`;

  const [svgData, pngData] = await Promise.all([
    generateQRCode(redirectUrl, { format: 'svg', size: 512 }),
    generateQRCode(redirectUrl, { format: 'png', size: 1024 }),
  ]);

  // Upload QR code files to storage
  const svgPath = `${themeId}/${shortCode}.svg`;
  const pngPath = `${themeId}/${shortCode}.png`;

  await Promise.all([
    supabase.storage
      .from('qr_codes')
      .upload(svgPath, Buffer.from(svgData), { contentType: 'image/svg+xml' }),
    supabase.storage
      .from('qr_codes')
      .upload(pngPath, Buffer.from(pngData, 'base64'), { contentType: 'image/png' }),
  ]);

  // Get public URLs
  const { data: { publicUrl: svgUrl } } = supabase.storage
    .from('qr_codes')
    .getPublicUrl(svgPath);

  const { data: { publicUrl: pngUrl } } = supabase.storage
    .from('qr_codes')
    .getPublicUrl(pngPath);

  return NextResponse.json({
    qrCode,
    redirectUrl,
    downloadUrls: {
      svg: svgUrl,
      png: pngUrl,
    },
  });
}
```

#### QR Generator Component

```typescript
// src/components/admin/QRGenerator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Download } from 'lucide-react';

interface QRGeneratorProps {
  themeId: string;
  themeName: string;
}

export function QRGenerator({ themeId, themeName }: QRGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    shortCode: string;
    redirectUrl: string;
    downloadUrls: { svg: string; png: string };
  } | null>(null);

  async function generateQR() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Generate QR Code</h3>
        <p className="text-sm text-gray-600">
          Generate a QR code for theme: <strong>{themeName}</strong>
        </p>
      </div>

      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {qrData ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-sm font-medium">Short Code:</p>
            <p className="text-lg font-mono">{qrData.shortCode}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Redirect URL:</p>
            <p className="text-sm break-all">{qrData.redirectUrl}</p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={qrData.downloadUrls.svg} download>
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={qrData.downloadUrls.png} download>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </a>
            </Button>
          </div>

          <Button onClick={generateQR} variant="secondary" disabled={loading}>
            Generate New Code
          </Button>
        </div>
      ) : (
        <Button onClick={generateQR} disabled={loading}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </Button>
      )}
    </div>
  );
}
```

### Short URL Redirect

Already implemented in API Routes section (see `/api/qr/[shortCode]/redirect/route.ts`).

---

## Analytics & Tracking

### Analytics Implementation

#### IP Hashing for GDPR Compliance

```typescript
// src/lib/utils/analytics.ts
import crypto from 'crypto';

export async function hashIP(ip: string): Promise<string> {
  // In production, fetch daily salt from Supabase
  const salt = process.env.DAILY_SALT || 'default-salt-change-me';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
```

#### Work View Tracking Component

```typescript
// src/components/work/WorkViewTracker.tsx
'use client';

import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface WorkViewTrackerProps {
  workId: string;
  referrer: 'theme_page' | 'search' | 'direct' | 'external';
}

export function WorkViewTracker({ workId, referrer }: WorkViewTrackerProps) {
  useEffect(() => {
    // Generate session ID (stored in sessionStorage)
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('session_id', sessionId);
    }

    // Track view
    fetch(`/api/works/${workId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer, sessionId }),
    }).catch((error) => {
      console.error('Failed to track view:', error);
    });
  }, [workId, referrer]);

  return null; // No UI
}
```

### Analytics Dashboard

#### Dashboard Data Fetching

```typescript
// src/lib/api/analytics.ts
import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalScans: number;
  totalViews: number;
  totalWorks: number;
  pendingReviews: number;
  recentScans: {
    scan_date: string;
    theme_id: string;
    scan_count: number;
    unique_visitors: number;
  }[];
  topWorks: {
    id: string;
    title_it: string;
    view_count: number;
    unique_viewers: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [
    { count: totalScans },
    { count: totalViews },
    { count: totalWorks },
    { count: pendingReviews },
    { data: recentScans },
    { data: topWorks },
  ] = await Promise.all([
    supabase.from('qr_scans').select('*', { count: 'exact', head: true }),
    supabase.from('work_views').select('*', { count: 'exact', head: true }),
    supabase.from('works').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('works').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('daily_scan_stats').select('*').order('scan_date', { ascending: false }).limit(30),
    supabase.from('work_performance_stats').select('*').order('view_count', { ascending: false }).limit(10),
  ]);

  return {
    totalScans: totalScans || 0,
    totalViews: totalViews || 0,
    totalWorks: totalWorks || 0,
    pendingReviews: pendingReviews || 0,
    recentScans: recentScans || [],
    topWorks: topWorks || [],
  };
}
```

#### Analytics Dashboard Component

```typescript
// src/app/[locale]/dashboard/admin/analytics/page.tsx
import { getDashboardStats } from '@/lib/api/analytics';
import { Card } from '@/components/ui/card';
import { BarChart, TrendingUp, Eye, FileText } from 'lucide-react';

export default async function AnalyticsDashboard() {
  const stats = await getDashboardStats();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total QR Scans</p>
              <p className="text-3xl font-bold">{stats.totalScans}</p>
            </div>
            <BarChart className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Work Views</p>
              <p className="text-3xl font-bold">{stats.totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published Works</p>
              <p className="text-3xl font-bold">{stats.totalWorks}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold">{stats.pendingReviews}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Top Works */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Top 10 Works by Views</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Title</th>
                <th className="text-right py-2">Total Views</th>
                <th className="text-right py-2">Unique Viewers</th>
              </tr>
            </thead>
            <tbody>
              {stats.topWorks.map((work) => (
                <tr key={work.id} className="border-b">
                  <td className="py-2">{work.title_it}</td>
                  <td className="text-right py-2">{work.view_count}</td>
                  <td className="text-right py-2">{work.unique_viewers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Scans Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">QR Scans (Last 30 Days)</h2>
        {/* TODO: Add chart library (recharts, chart.js) */}
        <div className="space-y-2">
          {stats.recentScans.slice(0, 7).map((scan) => (
            <div key={scan.scan_date} className="flex justify-between items-center">
              <span className="text-sm">{scan.scan_date}</span>
              <span className="text-sm font-semibold">
                {scan.scan_count} scans ({scan.unique_visitors} unique)
              </span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

export const dynamic = 'force-dynamic';
```

---

## Workflow Engine

### Work Status State Machine

```
draft
  ↓ (teacher submits)
pending_review
  ↓ (admin approves)              ↓ (admin rejects)
published                    needs_revision
                                ↓ (teacher resubmits)
                              pending_review
```

### Workflow Implementation

#### Submit Work for Review (Server Action)

```typescript
// src/app/actions/works.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitWorkForReview(workId: string) {
  const supabase = createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Verify work ownership
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('*')
    .eq('id', workId)
    .single();

  if (workError || !work) {
    return { error: 'Work not found' };
  }

  if (work.created_by !== user.id) {
    return { error: 'Not authorized to submit this work' };
  }

  if (work.status !== 'draft' && work.status !== 'needs_revision') {
    return { error: 'Work cannot be submitted in its current status' };
  }

  // Update status
  const { error: updateError } = await supabase
    .from('works')
    .update({ status: 'pending_review' })
    .eq('id', workId);

  if (updateError) {
    return { error: 'Failed to submit work' };
  }

  // Revalidate pages
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/admin/review-queue');

  // TODO: Send email notification to admins

  return { success: true };
}

export async function reviewWork(
  workId: string,
  action: 'approved' | 'rejected',
  comments?: string
) {
  const supabase = createClient();

  // Verify admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRole?.role !== 'admin') {
    return { error: 'Admin access required' };
  }

  // Validate rejection requires comments
  if (action === 'rejected' && (!comments || comments.trim().length < 10)) {
    return { error: 'Rejection requires comments (min 10 chars)' };
  }

  // Fetch work
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('*, creator:users(email, name)')
    .eq('id', workId)
    .single();

  if (workError || !work) {
    return { error: 'Work not found' };
  }

  if (work.status !== 'pending_review') {
    return { error: 'Work is not pending review' };
  }

  // Update work status
  const newStatus = action === 'approved' ? 'published' : 'needs_revision';
  const { error: updateError } = await supabase
    .from('works')
    .update({ status: newStatus })
    .eq('id', workId);

  if (updateError) {
    return { error: 'Failed to update work' };
  }

  // Insert review record
  const { error: reviewError } = await supabase
    .from('work_reviews')
    .insert({
      work_id: workId,
      reviewer_id: user.id,
      action: action,
      comments: comments || null,
    });

  if (reviewError) {
    console.error('Failed to insert review:', reviewError);
  }

  // Revalidate pages
  revalidatePath('/dashboard/admin/review-queue');
  revalidatePath(`/works/${workId}`);
  if (action === 'approved') {
    // Revalidate theme pages that include this work
    revalidatePath('/');
  }

  // TODO: Send email notification to teacher

  return { success: true, newStatus };
}
```

### Email Notifications

#### Supabase Edge Function for Emails

Create Edge Function via Supabase CLI:

```bash
supabase functions new send-work-notification
```

```typescript
// supabase/functions/send-work-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  type: 'submitted' | 'approved' | 'rejected';
  workId: string;
  workTitle: string;
  recipientEmail: string;
  recipientName: string;
  comments?: string;
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Send email via Supabase Auth (uses built-in email service)
    const { error } = await supabase.auth.admin.generateLink({
      type: 'email',
      email: payload.recipientEmail,
      options: {
        data: {
          subject: getEmailSubject(payload.type),
          html: getEmailHTML(payload),
        },
      },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getEmailSubject(type: string): string {
  switch (type) {
    case 'submitted':
      return 'New Work Submitted for Review';
    case 'approved':
      return 'Your Work Has Been Approved';
    case 'rejected':
      return 'Your Work Needs Revision';
    default:
      return 'Work Notification';
  }
}

function getEmailHTML(payload: NotificationPayload): string {
  const baseUrl = Deno.env.get('PUBLIC_URL') || 'http://localhost:3000';

  switch (payload.type) {
    case 'submitted':
      return `
        <p>Hi Admin,</p>
        <p>A new work has been submitted for review:</p>
        <p><strong>${payload.workTitle}</strong></p>
        <p><a href="${baseUrl}/dashboard/admin/review-queue">Review Now</a></p>
      `;

    case 'approved':
      return `
        <p>Hi ${payload.recipientName},</p>
        <p>Great news! Your work <strong>"${payload.workTitle}"</strong> has been approved and is now published.</p>
        <p><a href="${baseUrl}/works/${payload.workId}">View Work</a></p>
      `;

    case 'rejected':
      return `
        <p>Hi ${payload.recipientName},</p>
        <p>Your work <strong>"${payload.workTitle}"</strong> needs revision before it can be published.</p>
        ${payload.comments ? `<p><strong>Comments:</strong> ${payload.comments}</p>` : ''}
        <p><a href="${baseUrl}/dashboard/teacher/works/${payload.workId}/edit">Edit Work</a></p>
      `;

    default:
      return '';
  }
}
```

Deploy Edge Function:
```bash
supabase functions deploy send-work-notification
```

**Trigger Email from Database** (via webhook or direct API call):
```typescript
// In reviewWork server action, add:
await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-work-notification`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    type: action === 'approved' ? 'approved' : 'rejected',
    workId: workId,
    workTitle: work.title_it,
    recipientEmail: work.creator.email,
    recipientName: work.creator.name,
    comments: comments,
  }),
});
```

---

## Search & Filter Architecture

### Full-Text Search Implementation

Already implemented in database schema (see `search_vector` column and triggers).

#### Search API

```typescript
// src/lib/api/search.ts
import { createClient } from '@/lib/supabase/server';
import type { Work } from '@/types/database';

export interface SearchResult {
  works: Work[];
  total: number;
  page: number;
  perPage: number;
}

export async function searchWorks(
  query: string,
  page = 1,
  perPage = 50
): Promise<SearchResult> {
  const supabase = createClient();

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('works')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'italian',
    })
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    works: data || [],
    total: count || 0,
    page,
    perPage,
  };
}
```

#### Search Component

```typescript
// src/components/work/WorkSearch.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function WorkSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debouncedQuery.trim().length >= 3) {
      router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="search"
        placeholder="Search works..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
        minLength={3}
      />
    </form>
  );
}
```

**Debounce Hook**:
```typescript
// src/lib/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

**(Remaining sections: Internationalization, Security, Performance, Development Environment, Deployment, and Monitoring will be added in the next response to keep the file manageable)**
## Internationalization

### next-intl Configuration

**Installation**:
```bash
pnpm add next-intl
```

**Configuration** (`src/i18n.ts`):
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}));
```

**Middleware** (already shown in Routing section)

**Translation Files**:

```json
// messages/it.json
{
  "HomePage": {
    "title": "Repository Lavori Studenti",
    "subtitle": "Esplora i progetti creativi dei nostri studenti"
  },
  "WorkCard": {
    "class": "Classe",
    "year": "Anno",
    "viewWork": "Vedi lavoro"
  },
  "Navigation": {
    "home": "Home",
    "themes": "Temi",
    "login": "Accedi",
    "dashboard": "Dashboard",
    "logout": "Esci"
  }
}

// messages/en.json
{
  "HomePage": {
    "title": "Student Work Repository",
    "subtitle": "Explore our students' creative projects"
  },
  "WorkCard": {
    "class": "Class",
    "year": "Year",
    "viewWork": "View work"
  },
  "Navigation": {
    "home": "Home",
    "themes": "Themes",
    "login": "Login",
    "dashboard": "Dashboard",
    "logout": "Logout"
  }
}
```

**Usage in Components**:
```typescript
// Server Component
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

// In page component
const t = await getTranslations('HomePage');
return <h1>{t('title')}</h1>;

// Client Component
'use client';
import { useTranslations } from 'next-intl';

export function WorkCard() {
  const t = useTranslations('WorkCard');
  return <button>{t('viewWork')}</button>;
}
```

**Multilingual Database Content**:
- Fallback strategy: If `title_en` is null, show `title_it` with language indicator
- No machine translation: All multilingual content manually entered by admins/teachers

---

## Security Architecture

### Security Checklist

#### Application-Level Security

**1. Authentication & Authorization**
- JWT-based authentication via Supabase (secure, industry-standard)
- RLS policies enforce authorization at database level
- Session tokens stored in HTTP-only cookies
- No client-side token storage

**2. Input Validation & Sanitization**
- Zod schemas validate all user inputs
- Markdown content sanitized with `rehype-sanitize` to prevent XSS
- File uploads validated by MIME type and size
- SQL injection prevented by parameterized queries (Supabase client)

**3. HTTPS & Transport Security**
- Vercel enforces HTTPS automatically
- Security headers configured in `next.config.js`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

**4. CSRF Protection**
- Supabase JWT tokens include CSRF protection
- SameSite cookie attribute set to `Lax`

**5. Rate Limiting**
- Supabase Auth rate limits login attempts (5 per 15 min)
- API routes: Implement rate limiting with Vercel Edge Middleware
- QR scan tracking: No rate limiting (legitimate use case for repeated scans)

**6. File Upload Security**
- File type whitelist: `application/pdf`, `image/jpeg`, `image/png`
- File size limit: 10MB per file
- Filename sanitization: Remove special characters
- Storage path isolation: Files stored in work-specific folders

**7. Secrets Management**
- Environment variables stored in Vercel dashboard
- No secrets committed to Git
- `.env.local` for local development (gitignored)

**Environment Variables**:
```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-only
NEXT_PUBLIC_BASE_URL=https://your-domain.com
DAILY_SALT=random-salt-for-ip-hashing # Regenerated daily
```

**8. Privacy & GDPR Compliance**
- No student names or faces stored
- IP addresses hashed with daily rotating salt
- User agents stored for device type only (no fingerprinting)
- Data retention policy: Analytics logs kept for 1 year
- Right to erasure: Admins can delete user data on request

---

## Performance & Scalability

### Performance Strategy

#### Rendering Strategy by Route

| Route Type | Strategy | Rationale | Revalidation |
|------------|----------|-----------|--------------|
| Homepage | ISR | Semi-static content, fast load | 5 minutes |
| Theme pages | ISR | Content changes when works published | 60 seconds |
| Work detail | SSR | Always fresh data (low traffic) | On-demand |
| Dashboard | SSR | Dynamic, authenticated | None |
| QR redirect | Edge Function | Fastest response, global CDN | N/A |

#### Caching Strategy

**1. CDN Caching (Vercel Edge)**
- Static assets (JS, CSS, images): Cached indefinitely with hashed filenames
- ISR pages: Cached at edge until revalidation
- API routes: No caching (dynamic data)

**2. Database Query Caching**
- Supabase connection pooling handles concurrent queries
- Materialized views for analytics (refreshed hourly)
- No application-level query cache (Supabase fast enough for MVP)

**3. Client-Side Caching**
- React Server Components eliminate client fetch duplication
- SessionStorage for search history (max 5)
- LocalStorage for language preference

#### Image Optimization

**Next.js Image Component**:
- Automatic WebP/AVIF conversion
- Responsive images with `srcset`
- Lazy loading below fold
- Blur placeholder for perceived performance

**Supabase Storage**:
- Images served via CDN
- Optional: Image transformation API for thumbnails

#### Bundle Size Optimization

**Code Splitting**:
- App Router automatic code splitting per route
- Dynamic imports for heavy components (QR generator, file uploader)
- Lazy load client components below fold

**Bundle Analysis**:
```bash
# Analyze bundle size
pnpm build
npx @next/bundle-analyzer
```

**Optimization Techniques**:
- Tree-shaking via ES modules
- Remove unused dependencies
- Use `next/dynamic` for heavy libraries
- Minimize client-side JavaScript (prefer Server Components)

#### Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| Time to Interactive (TTI) | <3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | Lighthouse |
| Total Bundle Size | <300KB | Webpack Bundle Analyzer |

### Scalability Considerations

**Horizontal Scaling**:
- Next.js on Vercel scales automatically (serverless)
- Supabase handles up to 1M monthly active users on Pro plan
- CDN distributes traffic globally

**Database Scaling**:
- Postgres connection pooling (Supabase handles)
- Indexed foreign keys for fast joins
- Pagination for large result sets (50 items per page)
- Denormalized analytics views for fast queries

**Storage Scaling**:
- Supabase Storage scales with usage (pay-per-GB)
- Teacher quotas (500MB each) prevent abuse
- Admin monitoring for storage usage

**Monitoring Thresholds**:
- Alert if DB queries >1s p95
- Alert if storage >80% quota
- Alert if error rate >1%

---

## Development Environment

### Prerequisites

- **Node.js**: 18.x or later
- **Package Manager**: pnpm (recommended) or npm
- **Supabase CLI**: For local development and migrations
- **Git**: Version control

### Local Setup

**1. Clone Repository**:
```bash
git clone <repository-url>
cd QuadriParlanti
```

**2. Install Dependencies**:
```bash
pnpm install
```

**3. Environment Variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

**4. Supabase Local Development** (Optional):
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# This starts:
# - Postgres database (localhost:54322)
# - Supabase Studio (localhost:54323)
# - Auth server
# - Storage server
```

**5. Database Migrations**:
```bash
# Create migration
supabase migration new initial_schema

# Apply migration to local DB
supabase db reset

# Push to remote (production)
supabase db push
```

**6. Run Development Server**:
```bash
pnpm dev
# Open http://localhost:3000
```

### Development Workflow

**Branch Strategy**:
- `main`: Production branch (protected)
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Convention**:
```
feat: Add QR code generation
fix: Correct RLS policy for works table
docs: Update architecture documentation
refactor: Simplify file upload logic
```

**Code Quality Tools**:

```bash
# Linting
pnpm lint

# Type checking
pnpm type-check

# Format code
pnpm format

# Run all checks
pnpm validate
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md}\"",
    "validate": "pnpm lint && pnpm type-check && pnpm format:check",
    "db:generate-types": "supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts"
  }
}
```

### Testing Strategy (Future)

**Unit Tests**: Vitest
- Test utility functions (IP hashing, QR generation, slug generation)
- Test validation schemas (Zod)

**Integration Tests**: Vitest + Testing Library
- Test API routes
- Test database queries

**E2E Tests**: Playwright (Future)
- Test critical user flows (QR scan → work view)
- Test authentication flow
- Test work submission flow

---

## Deployment & Infrastructure

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│              GitHub Repository              │
│              (main branch)                  │
└────────────────┬────────────────────────────┘
                 │ git push
                 ▼
┌─────────────────────────────────────────────┐
│           Vercel Deployment                 │
│  ┌───────────────────────────────────────┐ │
│  │  Build Process                        │ │
│  │  1. Install dependencies (pnpm)       │ │
│  │  2. Generate Supabase types          │ │
│  │  3. Run type checks                  │ │
│  │  4. Build Next.js app                │ │
│  │  5. Optimize bundles                 │ │
│  └───────────────────────────────────────┘ │
└────────────────┬────────────────────────────┘
                 │ deploy
                 ▼
┌─────────────────────────────────────────────┐
│         Vercel Edge Network                 │
│  ┌───────────────┬───────────────────────┐ │
│  │   CDN Edge    │   Serverless          │ │
│  │   Functions   │   Functions           │ │
│  │   (Global)    │   (us-east-1)         │ │
│  └───────────────┴───────────────────────┘ │
└─────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           Supabase Cloud                    │
│  ┌─────────────┬─────────────┬───────────┐ │
│  │  Postgres   │   Storage   │    Auth   │ │
│  │  (us-east-1)│   (S3)      │  (JWT)    │ │
│  └─────────────┴─────────────┴───────────┘ │
└─────────────────────────────────────────────┘
```

### Vercel Configuration

**Project Settings**:
- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`
- Node Version: 18.x

**Environment Variables** (Vercel Dashboard):
```
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_BASE_URL=https://your-domain.com
DAILY_SALT=<regenerate-daily>
```

**Custom Domain**:
- Add custom domain in Vercel dashboard
- Automatic SSL certificate provisioning
- Redirect www to apex domain (or vice versa)

**Vercel.json Configuration**:
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Supabase Configuration

**Project Setup**:
1. Create project in Supabase Dashboard
2. Note Project ID, API URL, and keys
3. Configure Auth providers (Email/Password)
4. Create storage buckets
5. Run migrations via CLI or Dashboard SQL editor

**Database Migrations**:
```bash
# Link local to remote
supabase link --project-ref <project-id>

# Push migrations to production
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

**Backup Strategy**:
- Supabase automatic daily backups (Pro plan)
- Point-in-time recovery (last 7 days)
- Manual backups before major migrations

### CI/CD Pipeline

**GitHub Actions** (Optional):
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm build
```

**Deployment Flow**:
1. Developer pushes to `develop` branch
2. Vercel auto-deploys preview environment
3. QA tests preview environment
4. Merge to `main` via Pull Request
5. Vercel auto-deploys to production

---

## Monitoring & Observability

### Error Tracking

**Option 1: Vercel Log Drain**
- Real-time logs in Vercel dashboard
- Filter by severity (error, warning, info)
- Search by user, route, time range

**Option 2: Sentry (Recommended for Production)**
```bash
pnpm add @sentry/nextjs
```

**Sentry Configuration**:
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// sentry.server.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

**Vercel Analytics**:
- Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Geographical performance breakdown

**Enable Vercel Analytics**:
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Database Monitoring

**Supabase Dashboard**:
- Query performance
- Active connections
- Storage usage
- API usage

**Alerts**:
- Email alerts for high DB load
- Slack notifications for errors (via webhook)

### Uptime Monitoring

**UptimeRobot** (Free tier):
- Monitor homepage every 5 minutes
- Alert via email if down
- Status page for transparency

**Health Check Endpoint**:
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('config').select('key').limit(1);

    if (error) throw error;

    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy' }, { status: 500 });
  }
}
```

### Logging Strategy

**Structured Logging**:
```typescript
// src/lib/utils/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, stack: error?.stack, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, meta?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  },
};
```

**Usage**:
```typescript
import { logger } from '@/lib/utils/logger';

logger.info('Work submitted for review', { workId, userId });
logger.error('Failed to upload file', error, { workId, fileName });
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Sprint 1: Infrastructure Setup**
- Set up Vercel and Supabase projects
- Initialize Next.js app with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Implement database schema and RLS policies
- Set up authentication (Supabase Auth)

**Deliverables**:
- Working local development environment
- Database schema deployed to Supabase
- Basic authentication flow
- Project deployed to Vercel (staging)

### Phase 2: Core Features (Weeks 3-5)

**Sprint 2: Public Features**
- Theme listing page
- Theme detail page with work list
- Work detail page
- QR redirect system
- Basic filtering

**Sprint 3: Teacher Features**
- Teacher dashboard
- Work creation form
- File upload
- Submit for review

**Deliverables**:
- Public-facing pages functional
- Teachers can create and submit works
- QR codes redirect correctly

### Phase 3: Admin & Workflow (Weeks 6-7)

**Sprint 4: Admin Features**
- Admin dashboard
- Review queue
- Approve/reject workflow
- Theme management
- QR code generation

**Sprint 5: Analytics**
- QR scan tracking
- Work view tracking
- Analytics dashboard
- Basic reporting

**Deliverables**:
- Complete approval workflow
- Admin can manage all content
- Basic analytics functional

### Phase 4: Polish & Launch (Weeks 8-9)

**Sprint 6: UX & Accessibility**
- Implement all translations (IT/EN)
- WCAG 2.1 AA compliance
- Mobile responsive design polish
- Error handling improvements

**Sprint 7: Testing & Launch**
- End-to-end testing
- Performance optimization
- Security audit
- Production deployment

**Deliverables**:
- Fully translated application
- WCAG compliant
- Production-ready
- User documentation

---

## Handoff Documentation

### For Backend Engineers

**Database Schema**: See section "Database Architecture"
- All tables, RLS policies, triggers, and indexes defined
- SQL scripts ready to run
- TypeScript types generated from schema

**API Endpoints**: See section "API Contract Specifications"
- All endpoints documented with request/response schemas
- Authentication requirements specified
- Supabase client usage examples provided

**Server Actions**: See section "Workflow Engine"
- Submit work for review
- Review work (approve/reject)
- Email notifications

### For Frontend Engineers

**Component Architecture**: See section "Frontend Architecture"
- Full directory structure provided
- Server vs Client Components strategy defined
- Key components with code examples

**Routing**: See section "Frontend Architecture"
- All routes mapped out
- Middleware for auth and i18n
- ISR/SSR strategy per route

**State Management**: React Server Components + Client state
- No global state management needed (Server Components)
- Client state for forms and interactive UI

### For QA Engineers

**Testing Requirements**:
- User flows to test (QR scan → view, work submission, approval)
- Edge cases documented in Product Spec
- Accessibility requirements (WCAG 2.1 AA)
- Performance budgets defined

**Test Data**:
- Seed script for test database (create sample users, themes, works)
- Test QR codes for scanning

### For Security Analysts

**Security Implementation**: See section "Security Architecture"
- RLS policies for authorization
- Input validation with Zod
- File upload security
- HTTPS enforcement
- GDPR compliance (IP hashing)

**Penetration Testing Checklist**:
- Authentication bypass attempts
- SQL injection attempts
- File upload exploits
- XSS via markdown content
- CSRF attacks

### For DevOps Engineers

**Infrastructure**: See section "Deployment & Infrastructure"
- Vercel + Supabase architecture
- Environment variables required
- CI/CD pipeline configuration
- Monitoring setup

**Deployment Process**:
- Vercel auto-deploys on push to main
- Database migrations via Supabase CLI
- Backup strategy documented

---

## Appendix: Key Files Reference

### Configuration Files

```
project-root/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── .env.example              # Environment variables template
├── .env.local                # Local environment variables (gitignored)
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
└── vercel.json               # Vercel deployment configuration
```

### Database Files

```
supabase/
├── migrations/
│   └── 20250101_initial_schema.sql    # Initial database schema
├── functions/
│   └── send-work-notification/
│       └── index.ts                   # Email notification function
└── config.toml                        # Supabase local config
```

### Core Application Files

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                 # Locale layout
│   │   ├── page.tsx                   # Homepage
│   │   ├── themes/[slug]/page.tsx     # Theme detail
│   │   ├── works/[id]/page.tsx        # Work detail
│   │   └── dashboard/
│   │       ├── teacher/page.tsx       # Teacher dashboard
│   │       └── admin/page.tsx         # Admin dashboard
│   ├── api/
│   │   ├── qr/[shortCode]/redirect/route.ts  # QR redirect
│   │   └── works/[id]/view/route.ts          # Track view
│   └── actions/
│       └── works.ts                   # Server actions
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── shared/                        # Shared components
│   ├── work/                          # Work components
│   └── admin/                         # Admin components
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   └── server.ts                  # Server client
│   ├── api/                           # API client functions
│   ├── utils/                         # Utility functions
│   ├── validation/                    # Zod schemas
│   └── hooks/                         # React hooks
├── types/
│   ├── database.ts                    # Database types
│   └── supabase.ts                    # Generated Supabase types
└── middleware.ts                      # Next.js middleware
```

---

## Conclusion

This technical architecture blueprint provides a complete, implementation-ready specification for the Repository Lavori Studenti project. The architecture leverages modern serverless technologies (Next.js 14, Supabase, Vercel) to deliver a secure, scalable, and maintainable solution.

**Key Strengths**:
- **Serverless Architecture**: Zero infrastructure management, automatic scaling
- **Security-First**: RLS policies, input validation, HTTPS, GDPR compliance
- **Developer Experience**: TypeScript, type-safe APIs, hot reload, clear patterns
- **Performance**: ISR, CDN caching, optimized images, small bundles
- **Maintainability**: Clear separation of concerns, documented patterns, testable code

**Next Steps**:
1. Review and approve architecture with stakeholders
2. Set up development environment (Vercel, Supabase projects)
3. Begin Phase 1 implementation (database schema, authentication)
4. Iterate on feedback from initial prototypes

**Document Maintenance**:
- Update architecture document as decisions change
- Document new patterns as they emerge
- Keep environment variables and deployment guides current

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready for Implementation
**Next Review**: After MVP launch


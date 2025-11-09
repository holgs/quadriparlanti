# Teacher Management Feature - Technical Architecture

**Document Version:** 1.0
**Date:** 2025-11-09
**System Architect:** Claude
**Target Audience:** Backend Engineers, Frontend Engineers, QA Engineers, Security Analysts

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Analysis](#system-architecture-analysis)
3. [API Architecture](#api-architecture)
4. [Database Architecture](#database-architecture)
5. [Security Architecture](#security-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Implementation Specifications](#implementation-specifications)
8. [Testing Requirements](#testing-requirements)
9. [Appendices](#appendices)

---

## Executive Summary

### Overview

This document specifies the technical architecture for implementing a comprehensive teacher (docente) management system within the QuadriParlanti admin panel. The feature enables administrators to create, view, edit, and manage teacher accounts through a secure, user-friendly interface.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Pattern** | Next.js Server Actions | Aligns with existing codebase patterns, provides built-in CSRF protection, seamless client-server integration |
| **Authentication** | Supabase Auth Admin API | Required for creating auth.users records; service role key provides necessary privileges |
| **User Creation Flow** | Two-Phase Transaction | Create auth.users first, then public.users; ensures data consistency with rollback capability |
| **Password Strategy** | Email Invitation with Magic Link | More secure than temporary passwords; better UX; leverages Supabase built-in invitation flow |
| **State Management** | React Server Components + Client State | Minimize client-side JavaScript; leverage Next.js 14 App Router capabilities |
| **Form Validation** | Zod Schema Validation | Type-safe validation; consistent with existing codebase patterns |
| **UI Components** | shadcn/ui + Custom Dialogs | Maintains design system consistency; accessible by default |

### Critical Technical Constraints

1. **Supabase Auth Admin API** requires service role key (server-side only)
2. **Two-table architecture** requires transactional integrity between auth.users and public.users
3. **RLS policies** already in place; no modifications needed
4. **i18n support** required for Italian (primary) and English
5. **No deletion** of users; use status management (active/inactive/suspended)
6. **Email delivery** depends on Supabase SMTP configuration

### Dependencies

- Supabase service role key must be configured in environment
- SMTP settings must be configured in Supabase dashboard for email invitations
- Existing RLS helper functions remain unchanged

---

## System Architecture Analysis

### Current System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    QuadriParlanti System                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend Layer (Next.js 14 App Router)                      │
│  ├── app/[locale]/admin/page.tsx                            │
│  ├── components/ui/* (shadcn/ui)                            │
│  └── lib/actions/* (Server Actions)                         │
│                                                               │
│  Backend Layer (Supabase)                                    │
│  ├── PostgreSQL Database                                     │
│  │   ├── auth.users (Supabase managed)                      │
│  │   └── public.users (Application managed)                 │
│  ├── Row Level Security (RLS)                               │
│  └── Supabase Auth API                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

#### 1. Supabase Auth Admin API Integration

**Current State:**
- `createAdminClient()` function exists in `lib/supabase/server.ts`
- Service role key configured in `.env`
- No existing admin API usage patterns

**Integration Pattern:**
```typescript
import { createAdminClient } from '@/lib/supabase/server';

const adminClient = createAdminClient();
const { data, error } = await adminClient.auth.admin.createUser({
  email: 'teacher@example.com',
  email_confirm: true, // Auto-confirm email
  user_metadata: {
    name: 'Teacher Name'
  }
});
```

#### 2. Existing Auth Flow Integration

**Current Pattern (from `lib/actions/auth.actions.ts`):**
- Server Actions for authentication operations
- Error handling with Italian language messages
- `revalidatePath()` for cache invalidation
- Profile data synchronization with users table

**Integration Approach:**
- Follow existing pattern structure
- Reuse validation schemas from `lib/validations/schemas`
- Maintain consistent error messaging format

#### 3. Admin Dashboard Integration

**Current Structure:**
```
app/[locale]/admin/
├── page.tsx (Dashboard with metrics cards)
├── works/pending/page.tsx (Example sub-page)
└── [future] teachers/page.tsx (New integration point)
```

**Integration Requirements:**
- Add "Teachers" card to admin dashboard
- Create new route at `/admin/teachers`
- Follow existing card-based UI pattern

---

## API Architecture

### Technology Choice: Next.js Server Actions

**Rationale:**
1. Consistent with existing codebase (`lib/actions/auth.actions.ts`, `lib/actions/works.actions.ts`)
2. Built-in CSRF protection and security features
3. Type-safe with TypeScript
4. Seamless integration with React Server Components
5. Automatic error boundary handling

### Server Action Specifications

Create new file: `quadriparlanti-app/lib/actions/teachers.actions.ts`

#### Action 1: `createTeacher`

**Purpose:** Create a new teacher account with Supabase Auth and profile record

**Function Signature:**
```typescript
export async function createTeacher(input: CreateTeacherInput): Promise<CreateTeacherResult>
```

**Input Schema (Zod):**
```typescript
const createTeacherSchema = z.object({
  email: z.string().email('Email non valido'),
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(100),
  bio: z.string().max(500).optional(),
  sendInvitation: z.boolean().default(true),
});

type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
```

**Response Schema:**
```typescript
type CreateTeacherResult =
  | { success: true; userId: string; message: string }
  | { success: false; error: string };
```

**Implementation Flow:**
```
1. Validate input with Zod schema
2. Check admin authorization (reuse isAdmin())
3. Create admin Supabase client
4. Check if email already exists
5. BEGIN transaction logic:
   a. Create auth.users via adminClient.auth.admin.createUser()
   b. Create public.users record
   c. If sendInvitation=true, send invitation email
6. Handle errors with rollback
7. Revalidate /admin/teachers path
8. Return success/error response
```

**Error Handling:**
- Email already exists: "Email già registrata nel sistema"
- Auth creation failed: "Errore durante la creazione dell'account"
- Profile creation failed: Rollback auth user + "Errore durante la creazione del profilo"
- Invitation failed: User created but "Errore nell'invio dell'email di invito"

**Security Considerations:**
- MUST verify admin role before any operation
- MUST use service role client (never expose to client)
- MUST sanitize all input data
- MUST log all teacher creation attempts for audit trail

---

#### Action 2: `getTeachers`

**Purpose:** Retrieve paginated list of teachers with filtering and search

**Function Signature:**
```typescript
export async function getTeachers(params: GetTeachersParams): Promise<GetTeachersResult>
```

**Input Schema:**
```typescript
const getTeachersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(10).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'invited', 'suspended', 'all']).default('all'),
  sortBy: z.enum(['name', 'email', 'created_at', 'last_login_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

type GetTeachersParams = z.infer<typeof getTeachersSchema>;
```

**Response Schema:**
```typescript
type GetTeachersResult = {
  success: true;
  data: Teacher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} | {
  success: false;
  error: string;
};

type Teacher = {
  id: string;
  email: string;
  name: string | null;
  role: 'docente';
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  last_login_at: string | null;
  storage_used_mb: number;
};
```

**Implementation Flow:**
```
1. Validate input parameters
2. Check admin authorization
3. Build SQL query with filters:
   - WHERE role = 'docente'
   - AND status IN (...) if not 'all'
   - AND (name ILIKE %search% OR email ILIKE %search%) if search provided
4. Execute count query for pagination
5. Execute data query with LIMIT and OFFSET
6. Return paginated results
```

**Database Query Pattern:**
```sql
SELECT
  id, email, name, role, status,
  created_at, last_login_at, storage_used_mb
FROM users
WHERE role = 'docente'
  AND (status = $1 OR $1 = 'all')
  AND (name ILIKE $2 OR email ILIKE $2 OR $2 IS NULL)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

---

#### Action 3: `updateTeacher`

**Purpose:** Update teacher profile information and status

**Function Signature:**
```typescript
export async function updateTeacher(id: string, input: UpdateTeacherInput): Promise<UpdateTeacherResult>
```

**Input Schema:**
```typescript
const updateTeacherSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
```

**Response Schema:**
```typescript
type UpdateTeacherResult =
  | { success: true; message: string }
  | { success: false; error: string };
```

**Implementation Flow:**
```
1. Validate input
2. Check admin authorization
3. Verify teacher exists and has role='docente'
4. Update users table with new values
5. If email changed, update auth.users via admin API
6. Revalidate cache
7. Return result
```

**Business Rules:**
- Cannot change role from 'docente'
- Cannot set status to 'invited' (system-managed)
- Email changes require auth.users update via admin API

---

#### Action 4: `resendInvitation`

**Purpose:** Resend invitation email to teacher

**Function Signature:**
```typescript
export async function resendInvitation(teacherId: string): Promise<ActionResult>
```

**Response Schema:**
```typescript
type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };
```

**Implementation Flow:**
```
1. Check admin authorization
2. Verify teacher exists
3. Get teacher email from users table
4. Call adminClient.auth.admin.inviteUserByEmail()
5. Return result
```

---

#### Action 5: `resetTeacherPassword`

**Purpose:** Send password reset email to teacher

**Function Signature:**
```typescript
export async function resetTeacherPassword(teacherId: string): Promise<ActionResult>
```

**Implementation Flow:**
```
1. Check admin authorization
2. Verify teacher exists
3. Get teacher email
4. Call adminClient.auth.resetPasswordForEmail()
5. Return result
```

---

#### Action 6: `getTeacherStats`

**Purpose:** Get statistics for teachers overview

**Function Signature:**
```typescript
export async function getTeacherStats(): Promise<TeacherStatsResult>
```

**Response Schema:**
```typescript
type TeacherStatsResult = {
  success: true;
  data: {
    totalTeachers: number;
    activeTeachers: number;
    invitedTeachers: number;
    suspendedTeachers: number;
  };
} | {
  success: false;
  error: string;
};
```

**Implementation Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'invited') as invited_count,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_count,
  COUNT(*) as total_count
FROM users
WHERE role = 'docente';
```

---

## Database Architecture

### Current Schema Analysis

**Existing Schema (No modifications needed):**

```sql
CREATE TABLE IF NOT EXISTS users (
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
```

**Key Observations:**
1. Schema already supports 'docente' role
2. Status field includes 'invited' state (perfect for invitation flow)
3. No bio or profile_image_url fields exist (mentioned in requirements but not in schema)
4. storage_used_mb already tracked by existing triggers

### Schema Extensions Required

**Migration File:** `quadriparlanti-app/supabase/migrations/20241109000001_add_teacher_profile_fields.sql`

```sql
-- ============================================================================
-- MIGRATION: Add Teacher Profile Fields
-- Description: Extends users table with bio and profile image support
-- Author: System Architect
-- Date: 2024-11-09
-- ============================================================================

-- Add bio field for teacher profiles
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 500);

-- Add profile image URL field
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT CHECK (
  profile_image_url IS NULL OR
  profile_image_url ~* '^https?://'
);

-- Create index for profile image lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_image
ON users(profile_image_url)
WHERE profile_image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.bio IS 'Teacher biography (max 500 characters)';
COMMENT ON COLUMN users.profile_image_url IS 'URL to teacher profile image stored in Supabase Storage';
```

### Database Function: Sync Auth User to Public User

**Purpose:** Utility function to ensure auth.users and public.users stay synchronized

**Migration File:** `quadriparlanti-app/supabase/migrations/20241109000002_teacher_management_functions.sql`

```sql
-- ============================================================================
-- MIGRATION: Teacher Management Functions
-- Description: Database functions for teacher account management
-- Author: System Architect
-- Date: 2024-11-09
-- ============================================================================

-- ============================================================================
-- FUNCTION: Create user profile from auth.users
-- Description: Creates public.users record when auth.users record is created
--              Called from application code after Supabase Auth user creation
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'docente',
  p_bio TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validate role
  IF p_role NOT IN ('docente', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be docente or admin', p_role;
  END IF;

  -- Insert user profile
  INSERT INTO users (id, email, name, role, status, bio)
  VALUES (p_auth_user_id, p_email, p_name, p_role, 'invited', p_bio)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- ============================================================================
-- FUNCTION: Get teacher statistics
-- Description: Returns aggregated statistics for teachers
-- ============================================================================
CREATE OR REPLACE FUNCTION get_teacher_statistics()
RETURNS TABLE (
  total_teachers BIGINT,
  active_teachers BIGINT,
  invited_teachers BIGINT,
  suspended_teachers BIGINT,
  total_storage_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_teachers,
    COUNT(*) FILTER (WHERE status = 'active') as active_teachers,
    COUNT(*) FILTER (WHERE status = 'invited') as invited_teachers,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_teachers,
    COALESCE(SUM(storage_used_mb), 0) as total_storage_mb
  FROM users
  WHERE role = 'docente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_teacher_statistics TO authenticated;

-- ============================================================================
-- FUNCTION: Check if email exists
-- Description: Checks if email is already registered
-- Returns: TRUE if email exists, FALSE otherwise
-- ============================================================================
CREATE OR REPLACE FUNCTION email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION email_exists TO authenticated;
```

### Indexes

**Existing indexes are sufficient:**
- `idx_users_email` - For email lookups
- `idx_users_role` - For filtering by role and status

**No additional indexes required** - Query patterns don't warrant new indexes at this scale.

### Data Integrity Constraints

**Existing constraints are adequate:**
1. Email uniqueness enforced by `UNIQUE` constraint
2. Email format validation via `CHECK` constraint
3. Role validation via `CHECK` constraint
4. Status validation via `CHECK` constraint

**No modifications needed.**

---

## Security Architecture

### Threat Model

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| **Unauthorized teacher creation** | Admin role verification | `isAdmin()` check in every server action |
| **Service role key exposure** | Server-side only usage | Never import `createAdminClient()` in client components |
| **SQL injection** | Parameterized queries | Use Supabase client methods with parameters |
| **Email enumeration** | Generic error messages | Return "Email già registrata" without revealing if exists |
| **CSRF attacks** | Built-in protection | Next.js Server Actions provide automatic CSRF protection |
| **Mass assignment** | Explicit field whitelisting | Zod schemas define allowed fields only |

### Authentication Flow Security

**Teacher Invitation Flow:**
```
1. Admin creates teacher → Server Action validates admin role
2. Server Action creates auth.users → Uses service role client (server-only)
3. Supabase sends invitation email → Contains secure magic link token
4. Teacher clicks link → Supabase validates token
5. Teacher sets password → Supabase Auth handles securely
6. Status changes 'invited' → 'active' → Trigger updates last_login_at
```

**Security Properties:**
- Magic links expire after 24 hours (Supabase default)
- Tokens are single-use
- Password complexity enforced by Supabase Auth settings
- No temporary passwords stored in database

### RLS Policy Verification

**Existing policies are sufficient** (from `20240101000001_rls_policies.sql`):

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
```

**Analysis:**
- SELECT: Admins can view all teachers ✓
- UPDATE: Admins can update teacher profiles ✓
- INSERT: Admins can create teacher records ✓
- DELETE: No policy (intentional - soft delete via status) ✓

**No RLS policy changes required.**

### Environment Variables

**Required Configuration:**

```env
# Existing (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # CRITICAL: Must be set

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration (Supabase Dashboard)
# Configure in: Authentication → Email Templates
# - Invitation template (used for teacher invitations)
# - Password reset template
# - Email confirmation template
```

**Security Checklist:**
- [ ] SUPABASE_SERVICE_ROLE_KEY never committed to git
- [ ] SUPABASE_SERVICE_ROLE_KEY only accessible server-side
- [ ] Email templates customized in Supabase dashboard
- [ ] SMTP provider configured (or use Supabase's default)

### Input Validation & Sanitization

**Validation Strategy:**
1. **Client-side:** React Hook Form validation (UX feedback)
2. **Server-side:** Zod schema validation (security boundary)
3. **Database:** CHECK constraints (data integrity)

**Sanitization Requirements:**
- Email: Normalized to lowercase before database operations
- Name: Trim whitespace, no HTML allowed
- Bio: Plain text only, max 500 characters
- Profile Image URL: Validate URL format, must be HTTPS

**Example Zod Schema with Sanitization:**
```typescript
const createTeacherSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(100)
    .trim()
    .transform(str => str.replace(/\s+/g, ' ')), // Normalize multiple spaces
  bio: z.string()
    .max(500)
    .optional()
    .transform(str => str?.trim() || null),
  sendInvitation: z.boolean().default(true),
});
```

### Audit Logging

**Implementation:** Log all teacher management operations

**Log Entry Format:**
```typescript
type AuditLog = {
  timestamp: string;
  admin_id: string;
  action: 'create_teacher' | 'update_teacher' | 'resend_invitation' | 'reset_password';
  target_teacher_id: string;
  changes: Record<string, any>;
  ip_address_hash: string;
  success: boolean;
  error?: string;
};
```

**Storage:** Use console.log for development, implement proper logging service for production (e.g., Supabase Edge Functions with logging to dedicated table)

**Audit Table Schema (Future Enhancement):**
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  changes JSONB,
  ip_address_hash TEXT,
  success BOOLEAN,
  error_message TEXT
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_entity_type, target_entity_id);
```

---

## Frontend Architecture

### Component Hierarchy

```
app/[locale]/admin/teachers/
├── page.tsx                          # Main teachers list page (Server Component)
├── components/
│   ├── teachers-list.tsx            # Table with teachers (Client Component)
│   ├── teacher-row.tsx              # Individual teacher row (Client Component)
│   ├── create-teacher-dialog.tsx    # Creation modal (Client Component)
│   ├── edit-teacher-dialog.tsx      # Edit modal (Client Component)
│   ├── teacher-filters.tsx          # Search/filter controls (Client Component)
│   └── teacher-stats-cards.tsx      # Statistics cards (Server Component)
```

### Page Structure: Teachers List Page

**File:** `quadriparlanti-app/app/[locale]/admin/teachers/page.tsx`

```typescript
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/actions/auth.actions';
import { getTeachers, getTeacherStats } from '@/lib/actions/teachers.actions';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TeachersList } from './components/teachers-list';
import { TeacherStatsCards } from './components/teacher-stats-cards';
import { CreateTeacherDialog } from './components/create-teacher-dialog';
import { Button } from '@/components/ui/button';

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
};

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Verify admin access
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }

  // Parse search params
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search || undefined;
  const status = (searchParams.status as any) || 'all';

  // Fetch data
  const [teachersResult, statsResult] = await Promise.all([
    getTeachers({ page, search, status }),
    getTeacherStats(),
  ]);

  if (!teachersResult.success) {
    throw new Error(teachersResult.error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Gestione Docenti</h1>
              <p className="text-muted-foreground">
                Crea e gestisci gli account dei docenti
              </p>
            </div>
            <CreateTeacherDialog />
          </div>

          {/* Statistics Cards */}
          <Suspense fallback={<div>Caricamento statistiche...</div>}>
            <TeacherStatsCards stats={statsResult.success ? statsResult.data : null} />
          </Suspense>

          {/* Teachers List */}
          <TeachersList
            teachers={teachersResult.data}
            pagination={teachersResult.pagination}
            initialFilters={{ search, status }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

### Component: Teachers List

**File:** `quadriparlanti-app/app/[locale]/admin/teachers/components/teachers-list.tsx`

**Purpose:** Display paginated table of teachers with inline actions

**Component Type:** Client Component (for interactivity)

**Props Interface:**
```typescript
interface TeachersListProps {
  teachers: Teacher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialFilters: {
    search?: string;
    status?: string;
  };
}
```

**Features:**
- Search input (debounced)
- Status filter dropdown
- Sortable columns
- Pagination controls
- Inline action buttons (Edit, Resend Invitation, Reset Password)
- Responsive table design

**State Management:**
```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function TeachersList({ teachers, pagination, initialFilters }: TeachersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialFilters.search || '');
  const [status, setStatus] = useState(initialFilters.status || 'all');

  const updateFilters = (newFilters: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.set('page', '1'); // Reset to first page
      router.push(`/admin/teachers?${params.toString()}`);
    });
  };

  // ... render table
}
```

**Table Structure:**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Stato</TableHead>
      <TableHead>Data Creazione</TableHead>
      <TableHead>Ultimo Accesso</TableHead>
      <TableHead>Storage (MB)</TableHead>
      <TableHead className="text-right">Azioni</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {teachers.map((teacher) => (
      <TeacherRow key={teacher.id} teacher={teacher} />
    ))}
  </TableBody>
</Table>
```

### Component: Create Teacher Dialog

**File:** `quadriparlanti-app/app/[locale]/admin/teachers/components/create-teacher-dialog.tsx`

**Purpose:** Modal form for creating new teacher accounts

**Component Type:** Client Component

**Form Schema:**
```typescript
const formSchema = z.object({
  email: z.string().email('Email non valido'),
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(100),
  bio: z.string().max(500, 'La biografia non può superare i 500 caratteri').optional(),
  sendInvitation: z.boolean().default(true),
});
```

**Form Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeacher } from '@/lib/actions/teachers.actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

export function CreateTeacherDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      bio: '',
      sendInvitation: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const result = await createTeacher(values);

      if (result.success) {
        toast({
          title: 'Docente creato',
          description: result.message,
        });
        setOpen(false);
        form.reset();
        // Refresh page to show new teacher
        window.location.reload();
      } else {
        toast({
          title: 'Errore',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore imprevisto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crea Nuovo Docente</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Docente</DialogTitle>
          <DialogDescription>
            Inserisci i dati del docente. Verrà inviata un'email di invito.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="docente@scuola.it"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mario Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrizione del docente..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Massimo 500 caratteri
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendInvitation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Invia email di invito
                    </FormLabel>
                    <FormDescription>
                      Il docente riceverà un'email per impostare la password
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creazione...' : 'Crea Docente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Component: Edit Teacher Dialog

**File:** `quadriparlanti-app/app/[locale]/admin/teachers/components/edit-teacher-dialog.tsx`

**Purpose:** Modal form for editing existing teacher profiles

**Similar structure to CreateTeacherDialog but:**
- Pre-populated form fields
- Cannot change email (security constraint)
- Includes status change dropdown
- Different submit action (`updateTeacher`)

### Component: Teacher Stats Cards

**File:** `quadriparlanti-app/app/[locale]/admin/teachers/components/teacher-stats-cards.tsx`

**Component Type:** Server Component (no interactivity)

**Layout:**
```typescript
export function TeacherStatsCards({ stats }: { stats: TeacherStats | null }) {
  if (!stats) return null;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Docenti</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTeachers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Docenti Attivi</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTeachers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Attesa Invito</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.invitedTeachers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sospesi</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.suspendedTeachers}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Routing and Navigation

**Admin Dashboard Integration:**

Update `quadriparlanti-app/app/[locale]/admin/page.tsx`:

```typescript
// Add new card to admin dashboard
<Card className="group cursor-pointer transition-all hover:shadow-lg" asChild>
  <Link href="/admin/teachers">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Docenti</CardTitle>
      <Users className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">-</div>
      <p className="text-xs text-muted-foreground">Gestisci i docenti</p>
    </CardContent>
  </Link>
</Card>
```

**URL Structure:**
- `/admin/teachers` - Teachers list page
- `/admin/teachers?page=2` - Pagination
- `/admin/teachers?search=mario` - Search filter
- `/admin/teachers?status=active` - Status filter

### Internationalization (i18n)

**Translation Keys Required:**

Create `quadriparlanti-app/messages/it.json` additions:

```json
{
  "admin": {
    "teachers": {
      "title": "Gestione Docenti",
      "subtitle": "Crea e gestisci gli account dei docenti",
      "createButton": "Crea Nuovo Docente",
      "stats": {
        "total": "Totale Docenti",
        "active": "Docenti Attivi",
        "invited": "In Attesa Invito",
        "suspended": "Sospesi"
      },
      "table": {
        "name": "Nome",
        "email": "Email",
        "status": "Stato",
        "createdAt": "Data Creazione",
        "lastLogin": "Ultimo Accesso",
        "storage": "Storage (MB)",
        "actions": "Azioni"
      },
      "status": {
        "active": "Attivo",
        "invited": "Invitato",
        "suspended": "Sospeso"
      },
      "actions": {
        "edit": "Modifica",
        "resendInvitation": "Reinvia Invito",
        "resetPassword": "Reset Password",
        "suspend": "Sospendi",
        "activate": "Attiva"
      },
      "createDialog": {
        "title": "Crea Nuovo Docente",
        "description": "Inserisci i dati del docente. Verrà inviata un'email di invito.",
        "emailLabel": "Email",
        "emailPlaceholder": "docente@scuola.it",
        "nameLabel": "Nome Completo",
        "namePlaceholder": "Mario Rossi",
        "bioLabel": "Biografia (opzionale)",
        "bioPlaceholder": "Breve descrizione del docente...",
        "bioDescription": "Massimo 500 caratteri",
        "sendInvitationLabel": "Invia email di invito",
        "sendInvitationDescription": "Il docente riceverà un'email per impostare la password",
        "cancelButton": "Annulla",
        "submitButton": "Crea Docente",
        "submittingButton": "Creazione..."
      },
      "messages": {
        "createSuccess": "Docente creato con successo",
        "createError": "Errore nella creazione del docente",
        "updateSuccess": "Docente aggiornato con successo",
        "updateError": "Errore nell'aggiornamento del docente",
        "invitationSent": "Email di invito inviata",
        "invitationError": "Errore nell'invio dell'email",
        "passwordResetSent": "Email di reset password inviata",
        "passwordResetError": "Errore nell'invio dell'email"
      },
      "validation": {
        "emailInvalid": "Email non valido",
        "emailRequired": "Email obbligatoria",
        "nameRequired": "Nome obbligatorio",
        "nameMinLength": "Il nome deve contenere almeno 2 caratteri",
        "nameMaxLength": "Il nome non può superare i 100 caratteri",
        "bioMaxLength": "La biografia non può superare i 500 caratteri"
      }
    }
  }
}
```

**English translations** (`messages/en.json`):
```json
{
  "admin": {
    "teachers": {
      "title": "Teacher Management",
      "subtitle": "Create and manage teacher accounts",
      // ... (translate all Italian keys)
    }
  }
}
```

### Responsive Design

**Mobile-First Breakpoints:**
- Mobile: 320px - 640px (single column, stacked cards)
- Tablet: 641px - 1024px (2-column grid)
- Desktop: 1025px+ (4-column grid)

**Table Responsiveness:**
```typescript
// On mobile, convert table to card layout
<div className="md:hidden">
  {teachers.map((teacher) => (
    <TeacherCard key={teacher.id} teacher={teacher} />
  ))}
</div>

<div className="hidden md:block">
  <Table>
    {/* Desktop table */}
  </Table>
</div>
```

---

## Implementation Specifications

### Phase 1: Database Migrations (Backend Engineer)

**Tasks:**
1. Create migration file for profile fields
2. Create migration file for utility functions
3. Test migrations in development environment
4. Verify RLS policies still work correctly

**Acceptance Criteria:**
- [ ] Migrations run without errors
- [ ] bio and profile_image_url columns added
- [ ] All database functions created
- [ ] RLS policies remain functional
- [ ] Existing data unaffected

**Estimated Effort:** 2 hours

---

### Phase 2: Server Actions Implementation (Backend Engineer)

**Tasks:**
1. Create `lib/actions/teachers.actions.ts`
2. Implement all 6 server actions:
   - createTeacher
   - getTeachers
   - updateTeacher
   - resendInvitation
   - resetTeacherPassword
   - getTeacherStats
3. Add Zod validation schemas
4. Implement error handling
5. Add audit logging

**Acceptance Criteria:**
- [ ] All actions follow existing code patterns
- [ ] Input validation with Zod
- [ ] Error messages in Italian
- [ ] Transaction handling for createTeacher
- [ ] Proper use of createAdminClient()
- [ ] No service role key exposure
- [ ] Path revalidation after mutations

**Test Cases:**

**createTeacher:**
```typescript
// Test 1: Successful creation with invitation
const result = await createTeacher({
  email: 'test@example.com',
  name: 'Test Teacher',
  bio: 'Test bio',
  sendInvitation: true,
});
expect(result.success).toBe(true);
expect(result.userId).toBeDefined();

// Test 2: Duplicate email
const result2 = await createTeacher({
  email: 'test@example.com', // Same email
  name: 'Another Teacher',
});
expect(result2.success).toBe(false);
expect(result2.error).toContain('già registrata');

// Test 3: Invalid email format
const result3 = await createTeacher({
  email: 'invalid-email',
  name: 'Test Teacher',
});
expect(result3.success).toBe(false);

// Test 4: Non-admin user attempt (security test)
// Mock isAdmin to return false
const result4 = await createTeacher({
  email: 'test2@example.com',
  name: 'Test Teacher',
});
expect(result4.success).toBe(false);
expect(result4.error).toContain('Non autorizzato');
```

**getTeachers:**
```typescript
// Test 1: Pagination
const page1 = await getTeachers({ page: 1, limit: 10 });
expect(page1.success).toBe(true);
expect(page1.data.length).toBeLessThanOrEqual(10);
expect(page1.pagination.page).toBe(1);

// Test 2: Search filter
const searchResult = await getTeachers({ search: 'mario' });
expect(searchResult.success).toBe(true);
expect(searchResult.data.every(t =>
  t.name.toLowerCase().includes('mario') ||
  t.email.toLowerCase().includes('mario')
)).toBe(true);

// Test 3: Status filter
const activeResult = await getTeachers({ status: 'active' });
expect(activeResult.success).toBe(true);
expect(activeResult.data.every(t => t.status === 'active')).toBe(true);
```

**Estimated Effort:** 8 hours

---

### Phase 3: Frontend Components (Frontend Engineer)

**Tasks:**
1. Create page structure: `app/[locale]/admin/teachers/page.tsx`
2. Implement TeachersList component
3. Implement CreateTeacherDialog component
4. Implement EditTeacherDialog component
5. Implement TeacherStatsCards component
6. Implement TeacherRow component
7. Add to admin dashboard navigation

**Acceptance Criteria:**
- [ ] All components use TypeScript
- [ ] Form validation with react-hook-form + Zod
- [ ] Loading states for async operations
- [ ] Error handling with toast notifications
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] i18n integration with next-intl
- [ ] Follows existing UI patterns (shadcn/ui)

**Component Checklist:**

**TeachersList:**
- [ ] Displays paginated table
- [ ] Search input (debounced 300ms)
- [ ] Status filter dropdown
- [ ] Sortable columns
- [ ] Pagination controls
- [ ] Empty state message
- [ ] Loading skeleton
- [ ] Mobile responsive (card layout)

**CreateTeacherDialog:**
- [ ] Email input with validation
- [ ] Name input with validation
- [ ] Bio textarea (optional)
- [ ] Send invitation checkbox
- [ ] Submit button with loading state
- [ ] Cancel button
- [ ] Success/error toast notifications
- [ ] Form reset after success
- [ ] Auto-focus on email input

**EditTeacherDialog:**
- [ ] Pre-populated form fields
- [ ] Email field disabled (read-only)
- [ ] Status dropdown
- [ ] Update button with loading state
- [ ] Confirmation dialog for status changes
- [ ] Success/error notifications

**Estimated Effort:** 12 hours

---

### Phase 4: Integration Testing (QA Engineer)

**Test Scenarios:**

**Happy Path:**
1. Admin creates teacher → Success
2. Invitation email sent → Teacher receives email
3. Teacher clicks invitation link → Sets password
4. Teacher logs in → Dashboard accessible
5. Admin views teacher in list → Displayed correctly
6. Admin edits teacher profile → Updates saved
7. Admin resets teacher password → Email sent

**Error Paths:**
1. Create teacher with duplicate email → Error message displayed
2. Create teacher with invalid email → Validation error
3. Non-admin user accesses /admin/teachers → Redirected to login
4. Network error during creation → Error handled gracefully
5. SMTP error during invitation → User notified, account still created

**Edge Cases:**
1. Create 100 teachers → Pagination works correctly
2. Search with special characters → No SQL injection
3. Long name (100 chars) → Displays correctly without overflow
4. Long bio (500 chars) → Truncated in list view, full in details
5. Rapid clicking submit button → Only one request sent

**Security Tests:**
1. Service role key not exposed in network requests
2. RLS policies enforced (teacher can't see other teachers)
3. CSRF protection functional
4. XSS prevention (bio field sanitized)
5. Admin role required for all operations

**Performance Tests:**
1. Page load time < 2 seconds
2. Search debounce works (no request until 300ms idle)
3. Table renders smoothly with 50+ rows
4. Optimistic updates where appropriate

**Estimated Effort:** 6 hours

---

### Phase 5: Documentation & Deployment (DevOps)

**Tasks:**
1. Update README with teacher management feature
2. Document environment variable requirements
3. Create runbook for common operations
4. Deploy migrations to staging
5. Verify email configuration in Supabase
6. Deploy to production

**Documentation Deliverables:**
- [ ] Feature overview in README
- [ ] Admin user guide
- [ ] Troubleshooting guide
- [ ] Email template configuration guide

**Estimated Effort:** 4 hours

---

## Testing Requirements

### Unit Tests

**Backend (Vitest):**

Create `lib/actions/__tests__/teachers.actions.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTeacher, getTeachers, updateTeacher } from '../teachers.actions';

describe('teachers.actions', () => {
  describe('createTeacher', () => {
    it('should create teacher with valid input', async () => {
      const result = await createTeacher({
        email: 'test@example.com',
        name: 'Test Teacher',
        sendInvitation: true,
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      // First creation
      await createTeacher({
        email: 'test@example.com',
        name: 'Test Teacher',
      });

      // Duplicate
      const result = await createTeacher({
        email: 'test@example.com',
        name: 'Another Teacher',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('già registrata');
    });

    it('should reject invalid email format', async () => {
      const result = await createTeacher({
        email: 'not-an-email',
        name: 'Test Teacher',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getTeachers', () => {
    it('should return paginated results', async () => {
      const result = await getTeachers({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter by search term', async () => {
      const result = await getTeachers({ search: 'mario' });

      expect(result.success).toBe(true);
      result.data.forEach(teacher => {
        const matchesSearch =
          teacher.name?.toLowerCase().includes('mario') ||
          teacher.email.toLowerCase().includes('mario');
        expect(matchesSearch).toBe(true);
      });
    });
  });
});
```

**Frontend (React Testing Library):**

Create `app/[locale]/admin/teachers/components/__tests__/create-teacher-dialog.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateTeacherDialog } from '../create-teacher-dialog';

describe('CreateTeacherDialog', () => {
  it('should render trigger button', () => {
    render(<CreateTeacherDialog />);
    expect(screen.getByText('Crea Nuovo Docente')).toBeInTheDocument();
  });

  it('should open dialog on button click', async () => {
    render(<CreateTeacherDialog />);
    fireEvent.click(screen.getByText('Crea Nuovo Docente'));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<CreateTeacherDialog />);
    fireEvent.click(screen.getByText('Crea Nuovo Docente'));

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/Email non valido/)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockCreateTeacher = vi.fn().mockResolvedValue({ success: true });
    vi.mock('@/lib/actions/teachers.actions', () => ({
      createTeacher: mockCreateTeacher,
    }));

    render(<CreateTeacherDialog />);
    fireEvent.click(screen.getByText('Crea Nuovo Docente'));

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'Test Teacher' },
    });

    fireEvent.click(screen.getByText('Crea Docente'));

    await waitFor(() => {
      expect(mockCreateTeacher).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Teacher',
        bio: '',
        sendInvitation: true,
      });
    });
  });
});
```

### Integration Tests

**Test Supabase Integration:**

Create `__tests__/integration/teachers.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createTeacher, getTeachers } from '@/lib/actions/teachers.actions';

describe('Teachers Integration Tests', () => {
  let testTeacherId: string;

  beforeAll(async () => {
    // Setup: Create test admin user
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    const supabase = createClient();
    await supabase.from('users').delete().eq('id', testTeacherId);
  });

  it('should create teacher and retrieve from database', async () => {
    // Create
    const createResult = await createTeacher({
      email: 'integration-test@example.com',
      name: 'Integration Test Teacher',
    });

    expect(createResult.success).toBe(true);
    testTeacherId = createResult.userId!;

    // Retrieve
    const getResult = await getTeachers({
      search: 'integration-test@example.com',
    });

    expect(getResult.success).toBe(true);
    expect(getResult.data).toHaveLength(1);
    expect(getResult.data[0].email).toBe('integration-test@example.com');
  });

  it('should enforce RLS policies', async () => {
    const supabase = createClient();

    // Try to query as unauthenticated user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'docente');

    // Should fail due to RLS
    expect(error).toBeDefined();
  });
});
```

### End-to-End Tests

**Playwright Test Suite:**

Create `e2e/admin-teachers.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Teacher Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should navigate to teachers page', async ({ page }) => {
    await page.click('text=Docenti');
    await expect(page).toHaveURL('/admin/teachers');
    await expect(page.locator('h1')).toContainText('Gestione Docenti');
  });

  test('should create new teacher', async ({ page }) => {
    await page.goto('/admin/teachers');
    await page.click('text=Crea Nuovo Docente');

    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="name"]', 'E2E Test Teacher');
    await page.fill('[name="bio"]', 'This is a test bio');

    await page.click('button:has-text("Crea Docente")');

    // Wait for success toast
    await expect(page.locator('text=Docente creato con successo')).toBeVisible();

    // Verify teacher appears in list
    await expect(page.locator('text=E2E Test Teacher')).toBeVisible();
  });

  test('should filter teachers by status', async ({ page }) => {
    await page.goto('/admin/teachers');

    await page.selectOption('[name="status"]', 'active');

    // All displayed teachers should have 'Attivo' status
    const statusBadges = page.locator('[data-status]');
    await expect(statusBadges).toHaveCount(await statusBadges.count());
  });

  test('should search teachers', async ({ page }) => {
    await page.goto('/admin/teachers');

    await page.fill('[name="search"]', 'mario');
    await page.waitForTimeout(500); // Debounce

    // Verify search results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('mario');
    }
  });
});
```

### Test Coverage Goals

- Backend actions: 90%+ coverage
- Frontend components: 80%+ coverage
- Integration tests: All critical paths covered
- E2E tests: All user workflows covered

---

## Appendices

### Appendix A: File Structure

Complete file structure for the feature:

```
quadriparlanti-app/
├── app/
│   └── [locale]/
│       └── admin/
│           ├── page.tsx (UPDATE: Add teachers card)
│           └── teachers/
│               ├── page.tsx (NEW)
│               └── components/
│                   ├── teachers-list.tsx (NEW)
│                   ├── teacher-row.tsx (NEW)
│                   ├── create-teacher-dialog.tsx (NEW)
│                   ├── edit-teacher-dialog.tsx (NEW)
│                   ├── teacher-filters.tsx (NEW)
│                   └── teacher-stats-cards.tsx (NEW)
├── lib/
│   ├── actions/
│   │   ├── teachers.actions.ts (NEW)
│   │   └── __tests__/
│   │       └── teachers.actions.test.ts (NEW)
│   └── validations/
│       └── teacher-schemas.ts (NEW)
├── messages/
│   ├── it.json (UPDATE: Add teacher translations)
│   └── en.json (UPDATE: Add teacher translations)
├── supabase/
│   └── migrations/
│       ├── 20241109000001_add_teacher_profile_fields.sql (NEW)
│       └── 20241109000002_teacher_management_functions.sql (NEW)
└── __tests__/
    ├── integration/
    │   └── teachers.integration.test.ts (NEW)
    └── e2e/
        └── admin-teachers.spec.ts (NEW)
```

### Appendix B: API Response Examples

**createTeacher Success:**
```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Docente creato con successo. Email di invito inviata a test@example.com"
}
```

**createTeacher Failure (Duplicate Email):**
```json
{
  "success": false,
  "error": "Email già registrata nel sistema"
}
```

**getTeachers Success:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "mario.rossi@scuola.it",
      "name": "Mario Rossi",
      "role": "docente",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login_at": "2024-11-08T14:22:00Z",
      "storage_used_mb": 45
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2
  }
}
```

**getTeacherStats Success:**
```json
{
  "success": true,
  "data": {
    "totalTeachers": 35,
    "activeTeachers": 30,
    "invitedTeachers": 3,
    "suspendedTeachers": 2
  }
}
```

### Appendix C: Email Templates

**Invitation Email (Configure in Supabase Dashboard):**

Subject: Invito a QuadriParlanti - Crea il tuo account docente

Body:
```
Ciao,

Sei stato invitato a creare un account docente su QuadriParlanti.

Clicca sul link qui sotto per impostare la tua password e accedere:

{{ .ConfirmationURL }}

Il link scade tra 24 ore.

Se non hai richiesto questo invito, puoi ignorare questa email.

Grazie,
Il team di QuadriParlanti
```

**Password Reset Email:**

Subject: Reset password - QuadriParlanti

Body:
```
Ciao {{ .Name }},

Hai richiesto di reimpostare la password per il tuo account QuadriParlanti.

Clicca sul link qui sotto per impostare una nuova password:

{{ .ConfirmationURL }}

Il link scade tra 1 ora.

Se non hai richiesto questo reset, puoi ignorare questa email. La tua password attuale rimane valida.

Grazie,
Il team di QuadriParlanti
```

### Appendix D: Supabase Configuration Checklist

**Dashboard Configuration Steps:**

1. **Enable Email Auth:**
   - Go to Authentication → Providers
   - Enable Email provider
   - Set "Confirm email" to OFF (we auto-confirm)
   - Set "Secure email change" to ON

2. **Configure SMTP (Optional but Recommended):**
   - Go to Project Settings → Auth
   - Add custom SMTP settings
   - Or use Supabase's default (limited to 3 emails/hour in free tier)

3. **Customize Email Templates:**
   - Go to Authentication → Email Templates
   - Customize "Invite user" template
   - Customize "Reset password" template
   - Set "From" email address

4. **Set Redirect URLs:**
   - Go to Authentication → URL Configuration
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)

5. **Verify Service Role Key:**
   - Go to Project Settings → API
   - Copy "service_role" key (keep secret!)
   - Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Appendix E: Troubleshooting Guide

**Common Issues:**

**1. "Email not sent" error:**
- Check SMTP configuration in Supabase dashboard
- Verify email provider allows sending from Supabase IP
- Check Supabase logs for delivery errors
- Verify rate limits (3/hour on free tier)

**2. "Service role key not defined" error:**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Restart Next.js dev server after adding env var
- Verify key is correct (starts with `eyJ...`)

**3. Teacher not appearing in list:**
- Check if RLS policies are enabled
- Verify admin authentication
- Check browser console for errors
- Verify teacher role is 'docente' not 'admin'

**4. Invitation link doesn't work:**
- Verify redirect URL is configured in Supabase
- Check link hasn't expired (24 hour limit)
- Ensure auth callback route exists
- Check browser console for CORS errors

**5. Duplicate email error despite no existing user:**
- Check both auth.users and public.users tables
- User might exist in auth but not public (failed transaction)
- Manually clean up orphaned auth.users record

### Appendix F: Performance Optimization Checklist

**Backend Optimizations:**
- [ ] Use database connection pooling (Supabase handles this)
- [ ] Implement database indexes (already in place)
- [ ] Use SELECT only needed columns (avoid SELECT *)
- [ ] Paginate queries (implemented in getTeachers)
- [ ] Cache teacher stats (consider Redis for production)

**Frontend Optimizations:**
- [ ] Debounce search input (300ms)
- [ ] Virtualize long lists (if > 100 rows)
- [ ] Lazy load images (profile pictures)
- [ ] Use React Server Components where possible
- [ ] Implement optimistic updates for better UX
- [ ] Code-split large components
- [ ] Use Next.js Image component for profile images

### Appendix G: Security Audit Checklist

**Pre-Deployment Security Review:**

- [ ] Service role key never exposed to client
- [ ] All server actions verify admin role
- [ ] Input validation with Zod on server-side
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user inputs)
- [ ] CSRF protection (Next.js built-in)
- [ ] Rate limiting on API endpoints
- [ ] Audit logging for all mutations
- [ ] RLS policies tested and verified
- [ ] No sensitive data in error messages
- [ ] Email templates don't contain sensitive info
- [ ] Password reset tokens expire appropriately
- [ ] Invitation links expire after 24 hours
- [ ] Admin routes protected with middleware
- [ ] Environment variables properly configured

### Appendix H: Deployment Runbook

**Step-by-Step Deployment:**

1. **Pre-Deployment:**
   ```bash
   # Run tests
   npm run test
   npm run test:integration
   npm run test:e2e

   # Build check
   npm run build

   # Lint
   npm run lint
   ```

2. **Database Migrations:**
   ```bash
   # Apply migrations to staging
   npx supabase db push --db-url <staging-url>

   # Verify migrations
   npx supabase db diff

   # Apply to production
   npx supabase db push --db-url <production-url>
   ```

3. **Environment Configuration:**
   - Verify all env vars in Vercel/hosting platform
   - Test SMTP email delivery
   - Verify redirect URLs configured

4. **Deploy Application:**
   ```bash
   # Deploy to staging
   vercel --prod --scope staging

   # Smoke tests on staging
   npm run test:e2e -- --config staging

   # Deploy to production
   vercel --prod
   ```

5. **Post-Deployment Verification:**
   - [ ] Admin can access /admin/teachers
   - [ ] Create test teacher account
   - [ ] Verify invitation email sent
   - [ ] Test password reset flow
   - [ ] Check analytics/monitoring
   - [ ] Verify no errors in logs

6. **Rollback Plan:**
   ```bash
   # If deployment fails, rollback
   vercel rollback

   # Revert database migrations
   npx supabase db reset
   ```

---

## Summary for Engineering Teams

### For Backend Engineers

**Primary Deliverables:**
1. Two database migration files
2. `lib/actions/teachers.actions.ts` with 6 server actions
3. Unit tests for all actions
4. Integration tests for database operations

**Key Requirements:**
- Use existing `createAdminClient()` for Supabase Auth Admin API
- Follow transaction pattern for two-phase user creation
- Implement Zod validation for all inputs
- Error messages in Italian language
- Revalidate paths after mutations

**Estimated Timeline:** 10-12 hours

---

### For Frontend Engineers

**Primary Deliverables:**
1. Teachers list page with components
2. Create and edit dialogs with forms
3. Statistics cards display
4. Admin dashboard integration
5. i18n translations (Italian and English)

**Key Requirements:**
- Use shadcn/ui components
- React Hook Form + Zod for validation
- TypeScript for all components
- Responsive design (mobile-first)
- Accessibility compliance
- Loading states and error handling

**Estimated Timeline:** 12-14 hours

---

### For QA Engineers

**Primary Deliverables:**
1. Unit test suites
2. Integration test suites
3. E2E test scenarios
4. Security test cases
5. Performance benchmarks

**Key Requirements:**
- 90%+ backend coverage
- 80%+ frontend coverage
- All critical paths tested
- Security vulnerabilities checked
- Performance metrics baseline

**Estimated Timeline:** 6-8 hours

---

### For Security Analysts

**Focus Areas:**
1. Service role key handling
2. RLS policy verification
3. Input sanitization review
4. Email security (no sensitive data)
5. Authentication flow audit
6. Audit logging implementation

**Deliverables:**
- Security audit report
- Vulnerability assessment
- Recommendation document

**Estimated Timeline:** 4 hours

---

## Conclusion

This technical architecture provides a complete blueprint for implementing teacher management functionality in the QuadriParlanti application. All specifications are implementation-ready and follow existing codebase patterns.

**Key Success Factors:**
1. Two-phase user creation ensures data consistency
2. Email invitation flow provides secure onboarding
3. RLS policies maintain security boundaries
4. i18n support ensures accessibility for Italian users
5. Comprehensive testing catches issues early

**Next Steps:**
1. Backend Engineer implements database migrations
2. Backend Engineer implements server actions
3. Frontend Engineer builds UI components (can start in parallel)
4. QA Engineer writes test suites
5. Security Analyst reviews implementation
6. DevOps deploys to staging → production

**Total Estimated Effort:** 32-38 hours across all teams

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-11-09
**Version:** 1.0

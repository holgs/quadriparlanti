# Teacher Management Backend Implementation

## Overview

Complete CRUD backend functionality for managing teachers (docenti) in the QuadriParlanti application. This implementation provides secure, type-safe server actions for creating, reading, updating, and deleting teacher accounts.

## Files Created

### 1. Types Definition
**File**: `/lib/types/teacher.types.ts`
- TypeScript interfaces for all teacher-related operations
- Includes User, CreateTeacherInput, UpdateTeacherInput, TeacherFilters, TeacherStats, and PaginatedTeachersResponse types

### 2. Database Migrations
**Migration 1**: `/supabase/migrations/20241109000001_add_teacher_profile_fields.sql`
- Adds `bio`, `profile_image_url`, and `updated_at` columns to users table
- Creates automatic `updated_at` trigger
- Updates role and status constraints to support all user types

**Migration 2**: `/supabase/migrations/20241109000002_teacher_management_functions.sql`
- Creates `get_teacher_statistics()` function for aggregated stats
- Creates `teacher_has_works()` function to check for associated works
- Creates `get_teacher_work_count()` function for work counts
- Adds performance indexes for teacher queries

**Consolidated Migration**: `/supabase/migrations/APPLY_TEACHER_MIGRATIONS.sql`
- Single file containing both migrations for easy application
- Includes verification queries

### 3. Server Actions
**File**: `/lib/actions/teachers.actions.ts`
- Complete implementation of all 10 server actions
- Comprehensive error handling with Italian error messages
- Input validation using Zod schemas
- Type-safe TypeScript throughout

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Copy the Consolidated Migration**:
   ```bash
   # Open the file:
   quadriparlanti-app/supabase/migrations/APPLY_TEACHER_MIGRATIONS.sql

   # Select all (Cmd+A) and copy (Cmd+C)
   ```

3. **Paste and Execute**:
   - Paste into SQL Editor
   - Click "Run" or press Cmd+Enter
   - Wait for completion

4. **Verify Success**:
   - Go to: Database → Tables → users
   - Check for new columns: `bio`, `profile_image_url`, `updated_at`
   - Go to: Database → Functions
   - Verify functions: `get_teacher_statistics`, `teacher_has_works`, `get_teacher_work_count`

### Option 2: Individual Migrations

Apply each migration file separately in order:
1. `20241109000001_add_teacher_profile_fields.sql`
2. `20241109000002_teacher_management_functions.sql`

## Implemented Server Actions

### 1. createTeacher
```typescript
createTeacher(input: CreateTeacherInput): Promise<{ success: boolean; data?: User; error?: string }>
```

**Features**:
- Creates auth.users record via Supabase Auth Admin API
- Creates public.users profile record
- Sends invitation email with magic link (optional)
- Rollback transaction on any failure
- Validates email uniqueness

**Validation**:
- Email: Valid format, unique, required
- Name: Min 2 chars, max 100 chars, required
- Bio: Optional, max 500 chars

**Error Handling**:
- "Email già in uso" - Email already exists
- "Errore durante la creazione del docente" - Generic creation error
- "Permessi insufficienti" - User is not admin

### 2. getTeachers
```typescript
getTeachers(params: TeacherFilters): Promise<{ success: boolean; data?: PaginatedTeachersResponse; error?: string }>
```

**Features**:
- Paginated results with customizable page size
- Search by name or email (case-insensitive)
- Filter by status (active/inactive/suspended/invited)
- Returns total count and pagination metadata
- Orders by created_at DESC

**Parameters**:
- page: Number (default: 1)
- limit: Number (default: 10, max: 100)
- search: String (optional)
- status: Enum (optional)

### 3. updateTeacher
```typescript
updateTeacher(id: string, input: UpdateTeacherInput): Promise<{ success: boolean; data?: User; error?: string }>
```

**Features**:
- Updates profile fields (name, bio, profile_image_url)
- Updates status (active/inactive/suspended)
- Cannot change email or role
- Automatically updates updated_at timestamp
- Verifies teacher exists and is docente

**Validation**:
- Name: Min 2 chars, max 100 chars (optional)
- Bio: Max 500 chars (optional)
- Profile image URL: Valid URL format (optional)
- Status: Must be one of: active, inactive, suspended (optional)

### 4. deleteTeacher
```typescript
deleteTeacher(id: string, hard?: boolean): Promise<{ success: boolean; error?: string }>
```

**Features**:
- **Soft delete** (default): Sets status to 'inactive', preserves data
- **Hard delete**: Permanently removes from database
- Checks for associated works before hard delete
- Cannot hard delete if teacher has works

**Error Handling**:
- "Il docente ha opere associate e non può essere eliminato" - Has associated works

### 5. resendInvitation
```typescript
resendInvitation(id: string): Promise<{ success: boolean; error?: string }>
```

**Features**:
- Resends invitation email to teacher
- Uses Supabase Auth Admin API
- Includes redirect URL for authentication callback

### 6. resetTeacherPassword
```typescript
resetTeacherPassword(id: string): Promise<{ success: boolean; error?: string }>
```

**Features**:
- Sends password reset email to teacher
- Teacher receives email with reset link
- Redirect URL points to reset-password page

### 7. getTeacherStats
```typescript
getTeacherStats(): Promise<{ success: boolean; data?: TeacherStats; error?: string }>
```

**Features**:
- Returns aggregated statistics
- Uses database function for performance
- Returns counts for: total, active, inactive, suspended, invited

**Response Format**:
```typescript
{
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  invited: number;
}
```

### 8. getTeacher
```typescript
getTeacher(id: string): Promise<{ success: boolean; data?: User; error?: string }>
```

**Features**:
- Retrieves single teacher by ID
- Verifies teacher role is 'docente'
- Returns complete profile data

## Security

### Authentication & Authorization
- All actions check if user is admin using `checkIsAdmin()`
- Uses `createClient()` for regular queries (respects RLS)
- Uses `createAdminClient()` for Auth Admin API operations
- Service role key is never exposed to client

### Row Level Security (RLS)
- All queries respect existing RLS policies on users table
- Admin check performed server-side before any operation
- Uses SECURITY DEFINER functions for database operations

### Input Validation
- All inputs validated using Zod schemas
- SQL injection prevention through parameterized queries
- Email format validation
- Length constraints enforced
- Type safety with TypeScript

### Error Handling
- Never expose internal errors to client
- Generic error messages for security
- Detailed logging for debugging
- Transaction rollback on failures

## Database Schema Changes

### New Columns on `users` Table
```sql
bio TEXT                    -- Teacher biography (max 500 chars)
profile_image_url TEXT      -- URL to profile image
updated_at TIMESTAMPTZ      -- Auto-updated on changes
```

### New Constraints
```sql
-- Bio length constraint
CHECK (bio IS NULL OR char_length(bio) <= 500)

-- Updated role constraint
CHECK (role IN ('admin', 'docente', 'studente'))

-- Updated status constraint
CHECK (status IN ('active', 'invited', 'suspended', 'inactive'))
```

### New Functions
```sql
get_teacher_statistics()          -- Returns aggregated teacher stats
teacher_has_works(UUID)           -- Checks if teacher has works
get_teacher_work_count(UUID)      -- Returns teacher's work count
update_updated_at_column()        -- Trigger function for updated_at
```

### New Indexes
```sql
idx_users_status                  -- Status filtering
idx_users_email_lower             -- Case-insensitive email
idx_users_role_status             -- Combined role/status
idx_users_name_lower              -- Case-insensitive name
idx_users_name_trgm               -- Fuzzy name search
idx_users_created_at              -- Date ordering
idx_users_docente_active          -- Optimized teacher queries
```

### New Trigger
```sql
set_updated_at ON users           -- Auto-update updated_at on changes
```

## Usage Examples

### Creating a Teacher
```typescript
import { createTeacher } from '@/lib/actions/teachers.actions';

const result = await createTeacher({
  email: 'teacher@example.com',
  name: 'Mario Rossi',
  bio: 'Docente di Matematica con 10 anni di esperienza',
  sendInvitation: true,
});

if (result.success) {
  console.log('Teacher created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Getting Teachers with Filters
```typescript
import { getTeachers } from '@/lib/actions/teachers.actions';

const result = await getTeachers({
  page: 1,
  limit: 20,
  search: 'Mario',
  status: 'active',
});

if (result.success && result.data) {
  console.log('Teachers:', result.data.teachers);
  console.log('Total:', result.data.total);
  console.log('Pages:', result.data.totalPages);
}
```

### Updating a Teacher
```typescript
import { updateTeacher } from '@/lib/actions/teachers.actions';

const result = await updateTeacher('teacher-id-uuid', {
  name: 'Mario Rossi',
  bio: 'Updated biography',
  status: 'active',
});

if (result.success) {
  console.log('Updated teacher:', result.data);
}
```

### Deleting a Teacher (Soft)
```typescript
import { deleteTeacher } from '@/lib/actions/teachers.actions';

// Soft delete (set status to inactive)
const result = await deleteTeacher('teacher-id-uuid', false);

if (result.success) {
  console.log('Teacher deactivated');
}
```

### Getting Statistics
```typescript
import { getTeacherStats } from '@/lib/actions/teachers.actions';

const result = await getTeacherStats();

if (result.success && result.data) {
  console.log('Total teachers:', result.data.total);
  console.log('Active:', result.data.active);
  console.log('Inactive:', result.data.inactive);
  console.log('Suspended:', result.data.suspended);
  console.log('Invited:', result.data.invited);
}
```

## Error Messages (Italian)

All error messages are in Italian for consistency with the application:

- "Email già in uso" - Email already in use
- "Docente non trovato" - Teacher not found
- "Nome richiesto" - Name required
- "Email non valida" - Invalid email
- "Errore durante la creazione del docente" - Error creating teacher
- "Errore durante l'aggiornamento del docente" - Error updating teacher
- "Errore durante l'eliminazione del docente" - Error deleting teacher
- "Il docente ha opere associate e non può essere eliminato" - Teacher has associated works
- "Errore durante l'invio dell'invito" - Error sending invitation
- "Errore durante il reset della password" - Error resetting password
- "Permessi insufficienti" - Insufficient permissions
- "Dati non validi" - Invalid data
- "Parametri non validi" - Invalid parameters

## Performance Considerations

### Indexes
- Composite indexes for common query patterns
- Case-insensitive indexes for search operations
- Trigram indexes for fuzzy searching
- Partial indexes for active teachers only

### Query Optimization
- Pagination to limit result sets
- Count queries use exact count for accuracy
- Filters applied at database level
- Efficient use of WHERE clauses

### Caching Opportunities
- Teacher statistics can be cached (low frequency changes)
- Teacher lists can use stale-while-revalidate
- Individual teacher profiles suitable for caching

## Testing Checklist

- [ ] Create teacher with valid data
- [ ] Create teacher with duplicate email (should fail)
- [ ] Create teacher with invalid email format (should fail)
- [ ] Create teacher with name too short (should fail)
- [ ] Create teacher with bio too long (should fail)
- [ ] Get paginated list of teachers
- [ ] Filter teachers by status
- [ ] Search teachers by name
- [ ] Search teachers by email
- [ ] Update teacher profile fields
- [ ] Update teacher status
- [ ] Soft delete teacher
- [ ] Hard delete teacher without works
- [ ] Hard delete teacher with works (should fail)
- [ ] Resend invitation email
- [ ] Reset teacher password
- [ ] Get teacher statistics
- [ ] Get single teacher by ID
- [ ] Non-admin access (should fail all operations)

## Next Steps

1. **Apply Migrations**: Follow the migration instructions above
2. **Verify Database**: Check that all columns, functions, and indexes are created
3. **Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
4. **Frontend Integration**: Build admin UI components that consume these actions
5. **Testing**: Write integration tests for all CRUD operations
6. **Documentation**: Update API documentation with these endpoints

## Related Files

- Architecture Specification: `/project-documentation/teacher-management-architecture.md`
- Existing Auth Actions: `/lib/actions/auth.actions.ts`
- Supabase Client Setup: `/lib/supabase/client.ts` and `/lib/supabase/server.ts`
- Initial Schema: `/supabase/migrations/20240101000000_initial_schema.sql`

## Support

For issues or questions:
1. Check the error messages for specific validation failures
2. Verify admin permissions are set correctly
3. Check Supabase logs for database errors
4. Review the migration verification queries in `APPLY_TEACHER_MIGRATIONS.sql`

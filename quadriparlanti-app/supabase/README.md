# Supabase Database Setup

This directory contains all database migrations and seed data for the **Repository Lavori Studenti** application.

## Overview

The database schema consists of **11 tables** with comprehensive Row Level Security (RLS) policies, triggers, and analytics views.

### Database Tables

1. **users** - Teacher and admin profiles
2. **themes** - Thematic collections for organizing works
3. **works** - Student work submissions
4. **work_themes** - Many-to-many relationship (works ↔ themes)
5. **work_attachments** - File attachments (PDFs, images)
6. **work_links** - External links (YouTube, Vimeo, Drive)
7. **qr_codes** - QR code metadata for theme access
8. **qr_scans** - QR scan analytics (GDPR-compliant)
9. **work_views** - Work view analytics
10. **work_reviews** - Admin review feedback
11. **config** - Application configuration settings

### Storage Buckets

- **work-attachments** - Student work files (10MB limit per file)
- **theme-images** - Featured images for themes (5MB limit)
- **qr-codes** - Generated QR code images (1MB limit)

## Migration Files

Migrations are applied in sequential order:

| File | Description |
|------|-------------|
| `20240101000000_initial_schema.sql` | Creates all database tables with constraints and indexes |
| `20240101000001_rls_policies.sql` | Implements Row Level Security policies for access control |
| `20240101000002_triggers_functions.sql` | Database triggers and utility functions |
| `20240101000003_analytics_views.sql` | Analytics views and reporting functions |
| `20240101000004_storage_buckets.sql` | Supabase Storage configuration and policies |

## Local Development Setup

### Prerequisites

- Supabase account ([signup](https://supabase.com))
- Supabase CLI installed (`brew install supabase/tap/supabase` on macOS)

### Step 1: Create Supabase Project

```bash
# Create a new project via Supabase Dashboard
# Or use CLI:
supabase projects create repository-lavori-studenti --org-id your-org-id
```

### Step 2: Link Project Locally

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Get your project ref from: https://app.supabase.com/project/_/settings/general
```

### Step 3: Apply Migrations

```bash
# Apply all migrations to your Supabase project
supabase db push

# Verify migrations were applied
supabase db diff --schema public
```

### Step 4: Load Seed Data (Optional - Development Only)

```bash
# Load sample data for testing
psql your-connection-string < seed.sql

# Or via Supabase CLI:
supabase db reset --linked
```

### Step 5: Update Environment Variables

Update your `.env.local` file with Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from:
- Supabase Dashboard → Settings → API
- URL: Project API URL
- anon key: Project API keys → `anon` `public`
- service_role key: Project API keys → `service_role` (keep secret!)

## Creating Admin Users

Admin users must be created via Supabase Auth, then their role set in the `users` table:

### Via Supabase Dashboard

1. Go to Authentication → Users → Add User
2. Enter email and password
3. Note the user UUID
4. Go to Table Editor → `users` → Insert row:
   - `id`: (paste UUID from step 3)
   - `email`: (same as above)
   - `name`: Full name
   - `role`: `admin`
   - `status`: `active`

### Via SQL

```sql
-- First create auth user via Supabase Dashboard or API
-- Then insert into users table:
INSERT INTO users (id, email, name, role, status) VALUES
  ('uuid-from-auth', 'admin@yourschool.com', 'Admin Name', 'admin', 'active');
```

## Database Schema Diagram

```
users (teachers & admins)
  ├── works (student projects)
  │   ├── work_themes → themes
  │   ├── work_attachments
  │   ├── work_links
  │   ├── work_views (analytics)
  │   └── work_reviews (admin feedback)
  └── themes (collections)
      └── qr_codes
          └── qr_scans (analytics)
```

## Key Features

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Public users**: Can view published works, themes, and QR codes
- **Teachers**: Can create/edit own works, view own analytics
- **Admins**: Full access to all resources

### Automatic Triggers

- `updated_at` timestamps auto-updated on row changes
- Full-text search vectors auto-generated for works
- View counts incremented on page views
- Storage quotas calculated on file uploads
- Status timestamps (submitted_at, published_at) set on status changes

### Analytics Views

Pre-computed views for admin dashboard:
- `daily_scan_stats` - QR scan trends
- `work_performance_stats` - Work popularity metrics
- `admin_review_queue` - Pending review items
- `theme_statistics` - Theme engagement data
- `teacher_statistics` - Teacher productivity stats

## Common Operations

### Reset Database (Development Only)

```bash
# WARNING: This will delete all data
supabase db reset --linked
```

### Generate TypeScript Types

```bash
# Generate types from current schema
supabase gen types typescript --linked > ../types/supabase.ts
```

### Backup Database

```bash
# Backup all data to SQL file
supabase db dump --data-only > backup.sql

# Backup schema only
supabase db dump --schema public > schema.sql
```

### View Database Logs

```bash
# View real-time database logs
supabase db logs --linked --tail
```

## Security Considerations

1. **Never commit** `.env.local` or credentials to version control
2. **Service role key** should only be used server-side
3. **RLS policies** are enforced at the database level - trust them
4. **IP hashing** uses daily salt for GDPR compliance
5. **File uploads** are limited by size and mime type

## Troubleshooting

### Migration Fails

```bash
# Check migration status
supabase migration list --linked

# View specific migration
cat supabase/migrations/20240101000000_initial_schema.sql
```

### RLS Blocks Access

```bash
# Test as specific user in SQL Editor
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM works WHERE id = 'work-uuid';
```

### Storage Upload Fails

1. Check bucket exists in Supabase Dashboard → Storage
2. Verify RLS policies on `storage.objects`
3. Check file size and mime type limits
4. Ensure user is authenticated

## Production Deployment

1. **Do NOT** run `seed.sql` in production
2. Create real admin users via Supabase Auth
3. Set up database backups (automatic on Pro plan)
4. Configure custom SMTP for emails
5. Set up monitoring and alerts

## Support

For issues:
1. Check Supabase status: https://status.supabase.com
2. Review Supabase docs: https://supabase.com/docs
3. Check application logs in Vercel dashboard

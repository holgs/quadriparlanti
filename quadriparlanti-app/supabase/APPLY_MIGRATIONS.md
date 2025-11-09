# How to Apply Database Migrations

This guide shows you how to set up the complete database schema for QuadriParlanti on Supabase.

## 🎯 Quick Start (Recommended)

### Option 1: Via Supabase Dashboard (Easiest)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/sql/new
   - Or: Dashboard → SQL Editor → "+ New query"

2. **Copy the consolidated SQL**
   - Open file: `/supabase/FULL_DATABASE_SETUP.sql`
   - Select all (Cmd+A) and copy (Cmd+C)

3. **Paste and Execute**
   - Paste into the SQL Editor
   - Click "Run" or press Cmd+Enter
   - Wait for completion (~5-10 seconds)

4. **Verify Success**
   - Go to: Database → Tables
   - You should see 11 tables:
     - users
     - themes
     - works
     - work_themes
     - work_attachments
     - work_links
     - qr_codes
     - qr_scans
     - work_views
     - work_reviews
     - config

✅ **Done!** Your database is fully set up.

---

## 📋 Option 2: Step-by-Step (Individual Migrations)

If you prefer to apply migrations one by one:

### Migration 1: Initial Schema
```
File: migrations/20240101000000_initial_schema.sql
What it does: Creates all 11 database tables
```

1. Open: https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/sql/new
2. Copy contents of `20240101000000_initial_schema.sql`
3. Paste and Run
4. ✅ Verify: 11 tables created in Database → Tables

### Migration 2: RLS Policies
```
File: migrations/20240101000001_rls_policies.sql
What it does: Sets up Row Level Security policies for data protection
```

1. Copy contents of `20240101000001_rls_policies.sql`
2. Paste and Run
3. ✅ Verify: Go to Database → Tables → users → Policies (should see multiple policies)

### Migration 3: Triggers & Functions
```
File: migrations/20240101000002_triggers_functions.sql
What it does: Creates database triggers for automatic updates
```

1. Copy contents of `20240101000002_triggers_functions.sql`
2. Paste and Run
3. ✅ Verify: Database → Functions (should see several functions)

### Migration 4: Analytics Views
```
File: migrations/20240101000003_analytics_views.sql
What it does: Creates views for analytics and statistics
```

1. Copy contents of `20240101000003_analytics_views.sql`
2. Paste and Run
3. ✅ Verify: Database → Views (should see analytics views)

### Migration 5: Storage Buckets
```
File: migrations/20240101000004_storage_buckets.sql
What it does: Sets up file storage buckets for uploads
```

1. Copy contents of `20240101000004_storage_buckets.sql`
2. Paste and Run
3. ✅ Verify: Storage → Buckets (should see `work-attachments` bucket)

---

## 🌱 Option 3: Add Sample Data (Optional)

After applying migrations, you can add test data:

1. Open: https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/sql/new
2. Copy contents of `/supabase/seed.sql`
3. Paste and Run
4. ✅ Verify: Database → Table Editor → themes (should see 2-3 sample themes)

---

## 🔧 Option 4: Via Supabase CLI (Advanced)

If you have Supabase CLI set up and linked:

```bash
cd quadriparlanti-app

# Apply all pending migrations
supabase db push

# Or reset and reapply all
supabase db reset

# Apply seed data
supabase db seed
```

**Note**: Requires Supabase CLI to be linked to the project first.

---

## ✅ Verification Checklist

After applying migrations, verify everything is set up correctly:

### Database Tables (11 total)
- [ ] `users` - User profiles (teachers, admins)
- [ ] `themes` - Thematic collections
- [ ] `works` - Student work submissions
- [ ] `work_themes` - Junction table (works ↔ themes)
- [ ] `work_attachments` - File attachments
- [ ] `work_links` - External links
- [ ] `qr_codes` - QR code metadata
- [ ] `qr_scans` - QR scan analytics
- [ ] `work_views` - Work view analytics
- [ ] `work_reviews` - Admin review feedback
- [ ] `config` - App configuration

### Row Level Security (RLS)
- [ ] All tables have RLS enabled
- [ ] Policies are in place for `users`, `themes`, `works`, etc.
- [ ] Check: Database → Tables → [any table] → Policies

### Database Functions
- [ ] `hash_ip()` - IP hashing for GDPR compliance
- [ ] `generate_short_code()` - QR short code generation
- [ ] `update_updated_at_column()` - Auto-update timestamps
- [ ] Check: Database → Functions

### Triggers
- [ ] `update_works_updated_at` - Auto-update work timestamps
- [ ] `update_themes_updated_at` - Auto-update theme timestamps
- [ ] `update_works_search_vector` - Full-text search indexing
- [ ] Check: Database → Triggers

### Storage Buckets
- [ ] `work-attachments` bucket exists
- [ ] RLS policies applied to storage
- [ ] Check: Storage → Buckets

### Analytics Views
- [ ] Views for daily/weekly/monthly scans
- [ ] Views for work statistics
- [ ] Check: Database → Views

### Initial Config Data
- [ ] `config` table has initial settings
- [ ] Check: Database → Table Editor → config (should have ~9 rows)

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Cause**: Migration was already applied or table exists
**Solution**: Skip this migration or drop the existing table first (⚠️ careful with data loss!)

### Error: "permission denied"
**Cause**: Not enough database permissions
**Solution**: Make sure you're logged in as the project owner

### Error: "function does not exist"
**Cause**: Dependencies not installed (e.g., pgcrypto extension)
**Solution**: Run the initial schema migration first - it installs all extensions

### Error: "invalid input syntax"
**Cause**: SQL syntax error in migration
**Solution**: Make sure you copied the entire file without truncation

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/database/overview
- **SQL Editor**: https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/sql
- **Table Editor**: https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/editor

---

## 🎯 Next Steps

After database setup:

1. ✅ Verify all tables and policies are in place
2. 🌱 (Optional) Apply seed data for testing
3. 🚀 Start the Next.js development server: `cd .. && npm run dev`
4. 🔧 Configure `.env.local` with Supabase credentials
5. 🎨 Begin frontend development

**Your database is now ready for development!** 🎉

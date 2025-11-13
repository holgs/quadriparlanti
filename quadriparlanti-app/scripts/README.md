# Utility Scripts for Work Attachments

This directory contains utility scripts for diagnosing and fixing issues with work attachments.

## Problem Description

Work attachments may have incorrect or missing `file_type` and `mime_type` values in the database, which can cause PDF files and images to not display correctly on the work detail pages.

Common issues:
- `file_type` is set to 'pdf' for non-PDF files
- `mime_type` is missing or set to generic 'application/octet-stream'
- Mismatch between `file_type` and `mime_type`
- Files are not accessible via their storage URLs

## Available Scripts

### 1. Diagnose Attachments

**Purpose**: Check all work attachments for issues without making any changes.

**Usage**:
```bash
# Check all works
npx tsx scripts/diagnose-attachments.ts

# Check a specific work
npx tsx scripts/diagnose-attachments.ts <work_id>
```

**What it checks**:
- Missing or invalid `file_type`
- Missing or unusual `mime_type`
- Mismatch between `file_type` and `mime_type`
- File extension vs MIME type consistency
- URL accessibility

**Example output**:
```
📋 Diagnosing work: 5ee6dc2a-2892-4541-8666-3e31fe57719c
────────────────────────────────────────────────────────────
📄 Work: My Project
📎 Total attachments: 3

📎 document.pdf
   ID: abc-123
   Type: pdf | MIME: application/octet-stream
   Path: user123/work456/document.pdf
   ⚠️  WARNINGS:
      • mime_type is generic, should be application/pdf
   🔗 Checking URL accessibility...
      ✅ URL is accessible

✅ image.jpg - OK
```

### 2. Fix Attachments

**Purpose**: Automatically fix issues with work attachments.

**Usage**:
```bash
# Preview fixes without making changes (DRY RUN)
npx tsx scripts/fix-attachments.ts --dry-run

# Fix all works
npx tsx scripts/fix-attachments.ts

# Fix a specific work
npx tsx scripts/fix-attachments.ts <work_id>

# Preview fixes for a specific work
npx tsx scripts/fix-attachments.ts <work_id> --dry-run
```

**What it fixes**:
- Infers correct `file_type` from `mime_type`
- Infers correct `mime_type` from file extension
- Fixes mismatches between `file_type` and `mime_type`

**Example output**:
```
🔧 Fixing attachments for work: 5ee6dc2a-2892-4541-8666-3e31fe57719c
────────────────────────────────────────────────────────────
📄 Work: My Project
📎 Attachments: 3

📎 document.pdf
   Current: file_type="pdf", mime_type="application/octet-stream"
   Proposed: file_type="pdf", mime_type="application/pdf"
   Reason: Inferred mime_type from file extension
   ✅ Fixed

✅ image.jpg - No fix needed
```

## Environment Variables

Both scripts require the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin access)

Make sure these are set in your `.env.local` file.

## Development Mode Features

When running the application in development mode (`NODE_ENV=development`), additional debugging features are enabled:

### Debug Panel on Work Pages

A collapsible debug panel appears at the top of work detail pages showing:
- Total number of attachments
- Number of PDF attachments found
- Number of image attachments found
- Detailed JSON dump of all attachment metadata

### Enhanced PDF Viewer

The PDF viewer component shows additional debug information:
- File name
- MIME type
- Full storage URL (clickable)
- URL accessibility check with status

## Common Scenarios

### Scenario 1: PDFs not showing

**Symptoms**: PDF section appears but files don't display

**Diagnosis**:
```bash
npx tsx scripts/diagnose-attachments.ts <work_id>
```

Look for:
- `file_type` not equal to 'pdf'
- `mime_type` not containing 'pdf'
- URL not accessible

**Fix**:
```bash
# Preview the fix first
npx tsx scripts/fix-attachments.ts <work_id> --dry-run

# Apply the fix
npx tsx scripts/fix-attachments.ts <work_id>
```

### Scenario 2: Files showing in wrong section

**Symptoms**: PDFs appearing in image gallery or vice versa

**Diagnosis**:
```bash
npx tsx scripts/diagnose-attachments.ts <work_id>
```

Look for mismatches between `file_type`, `mime_type`, and file extension.

**Fix**:
```bash
npx tsx scripts/fix-attachments.ts <work_id>
```

### Scenario 3: Bulk cleanup

**Symptoms**: Multiple works have attachment issues

**Process**:
```bash
# 1. Diagnose all works
npx tsx scripts/diagnose-attachments.ts > diagnosis.txt

# 2. Review diagnosis.txt

# 3. Preview fixes
npx tsx scripts/fix-attachments.ts --dry-run

# 4. Apply fixes
npx tsx scripts/fix-attachments.ts
```

## Technical Details

### File Type Detection Logic

The fix script uses the following priority order:

1. **MIME Type**: Most reliable, used first if present
2. **File Extension**: Used as fallback or to validate MIME type
3. **Content-Type Header**: Can be checked by fetching the file (not implemented in fix script)

### Supported File Types

**PDFs**:
- `file_type`: 'pdf'
- `mime_type`: 'application/pdf'
- Extensions: .pdf

**Images**:
- `file_type`: 'image'
- `mime_type`: 'image/jpeg', 'image/png', 'image/webp', 'image/gif'
- Extensions: .jpg, .jpeg, .png, .webp, .gif

### Storage URL Format

Files are stored in Supabase Storage with public access:
```
https://<project>.supabase.co/storage/v1/object/public/work-attachments/<storage_path>
```

Where `storage_path` format is:
```
<user_id>/<work_id>/<timestamp>_<filename>
```

## Troubleshooting

### Script fails with "Missing environment variables"

**Solution**: Ensure `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### "URL not accessible" errors

**Possible causes**:
1. File was deleted from storage but database entry remains
2. Storage bucket is not public
3. Storage path is incorrect

**Solution**:
- Check Supabase Storage dashboard
- Verify bucket 'work-attachments' has public access
- Manually delete orphaned database entries

### Fix script doesn't fix certain files

**Reason**: The script can only infer types from extensions and MIME types. If both are missing or unusual, manual intervention is needed.

**Solution**: Update the database manually:
```sql
UPDATE work_attachments
SET file_type = 'pdf', mime_type = 'application/pdf'
WHERE id = '<attachment_id>';
```

## Future Improvements

Potential enhancements to consider:

1. **Content-based detection**: Fetch actual file and detect type from content
2. **Bulk operations**: UI for admins to fix issues without command line
3. **Automatic validation**: Validate on upload to prevent issues
4. **Storage sync**: Detect and remove orphaned files
5. **Migration tool**: One-time script to fix historical data

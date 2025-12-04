/**
 * Script to fix work attachments with incorrect file_type or mime_type
 *
 * This script attempts to fix attachments by:
 * 1. Inferring correct file_type from mime_type
 * 2. Inferring correct mime_type from file extension
 * 3. Detecting actual file type by fetching the file
 *
 * Usage:
 * npx tsx scripts/fix-attachments.ts [work_id] [--dry-run]
 *
 * Options:
 *   work_id: Only fix attachments for this specific work
 *   --dry-run: Show what would be fixed without making changes
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const isDryRun = process.argv.includes('--dry-run')

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

interface Attachment {
  id: string
  work_id: string
  file_name: string
  file_type: string
  mime_type: string
  storage_path: string
}

interface Fix {
  attachmentId: string
  fileName: string
  currentFileType: string
  currentMimeType: string
  newFileType?: string
  newMimeType?: string
  reason: string
}

function inferFileTypeFromMimeType(mimeType: string): 'pdf' | 'image' | null {
  const lower = mimeType.toLowerCase()
  if (lower.includes('pdf')) return 'pdf'
  if (lower.startsWith('image/')) return 'image'
  return null
}

function inferMimeTypeFromExtension(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? EXTENSION_TO_MIME[extension] || null : null
}

function inferMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'pdf') return 'application/pdf'
  if (['jpg', 'jpeg'].includes(extension || '')) return 'image/jpeg'
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'

  return 'application/octet-stream'
}

async function detectFileTypeFromUrl(storagePath: string): Promise<string | null> {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/work-attachments/${storagePath}`

  try {
    const response = await fetch(publicUrl, { method: 'HEAD' })
    if (response.ok) {
      return response.headers.get('content-type')
    }
  } catch (error) {
    // Ignore errors
  }

  return null
}

function analyzeFix(attachment: Attachment): Fix | null {
  const fixes: Partial<Fix> = {
    attachmentId: attachment.id,
    fileName: attachment.file_name,
    currentFileType: attachment.file_type,
    currentMimeType: attachment.mime_type,
  }

  let needsFix = false

  // Case 1: Missing or invalid file_type
  if (!attachment.file_type || !['pdf', 'image'].includes(attachment.file_type.toLowerCase())) {
    // Try to infer from mime_type
    if (attachment.mime_type) {
      const inferredType = inferFileTypeFromMimeType(attachment.mime_type)
      if (inferredType) {
        fixes.newFileType = inferredType
        fixes.reason = `Inferred file_type from mime_type "${attachment.mime_type}"`
        needsFix = true
      }
    }

    // If still no file_type, try from extension
    if (!fixes.newFileType) {
      const extension = attachment.file_name.split('.').pop()?.toLowerCase()
      if (extension === 'pdf') {
        fixes.newFileType = 'pdf'
        fixes.reason = 'Inferred file_type from .pdf extension'
        needsFix = true
      } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
        fixes.newFileType = 'image'
        fixes.reason = `Inferred file_type from .${extension} extension`
        needsFix = true
      }
    }
  }

  // Case 2: Missing or generic mime_type
  if (
    !attachment.mime_type ||
    attachment.mime_type === 'application/octet-stream' ||
    !attachment.mime_type.includes('/')
  ) {
    const inferredMime = inferMimeTypeFromFileName(attachment.file_name)
    if (inferredMime !== 'application/octet-stream') {
      fixes.newMimeType = inferredMime
      fixes.reason = fixes.reason
        ? `${fixes.reason} and mime_type from file extension`
        : `Inferred mime_type from file extension`
      needsFix = true
    }
  }

  // Case 3: file_type and mime_type mismatch
  if (attachment.file_type && attachment.mime_type) {
    const fileTypeLower = attachment.file_type.toLowerCase()
    const mimeTypeLower = attachment.mime_type.toLowerCase()

    if (fileTypeLower === 'pdf' && !mimeTypeLower.includes('pdf')) {
      // file_type says PDF but mime_type doesn't
      // Trust the extension
      const extension = attachment.file_name.split('.').pop()?.toLowerCase()
      if (extension === 'pdf') {
        fixes.newMimeType = 'application/pdf'
        fixes.reason = 'Fixed mime_type to match .pdf extension'
        needsFix = true
      } else {
        // Extension is not PDF, so file_type is probably wrong
        fixes.newFileType = 'image'
        fixes.reason = 'Fixed file_type to match mime_type'
        needsFix = true
      }
    }

    if (fileTypeLower === 'image' && !mimeTypeLower.startsWith('image/')) {
      // file_type says image but mime_type doesn't
      const extension = attachment.file_name.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
        fixes.newMimeType = inferMimeTypeFromFileName(attachment.file_name)
        fixes.reason = 'Fixed mime_type to match image extension'
        needsFix = true
      } else if (extension === 'pdf') {
        fixes.newFileType = 'pdf'
        fixes.reason = 'Fixed file_type to match .pdf extension'
        needsFix = true
      }
    }
  }

  return needsFix ? (fixes as Fix) : null
}

async function applyFix(fix: Fix): Promise<boolean> {
  const updates: any = {}

  if (fix.newFileType) {
    updates.file_type = fix.newFileType
  }

  if (fix.newMimeType) {
    updates.mime_type = fix.newMimeType
  }

  if (Object.keys(updates).length === 0) {
    return false
  }

  if (isDryRun) {
    console.log(`   [DRY RUN] Would update:`, updates)
    return true
  }

  const { error } = await supabase
    .from('work_attachments')
    .update(updates)
    .eq('id', fix.attachmentId)

  if (error) {
    console.error(`   ❌ Failed to update: ${error.message}`)
    return false
  }

  return true
}

async function fixWork(workId: string) {
  console.log(`\n🔧 Fixing attachments for work: ${workId}`)
  console.log('─'.repeat(80))

  const { data: work, error } = await supabase
    .from('works')
    .select('id, title_it, work_attachments(*)')
    .eq('id', workId)
    .single()

  if (error || !work) {
    console.error(`❌ Error fetching work: ${error?.message}`)
    return
  }

  console.log(`📄 Work: ${work.title_it}`)
  console.log(`📎 Attachments: ${work.work_attachments?.length || 0}`)

  if (!work.work_attachments || work.work_attachments.length === 0) {
    console.log('   No attachments to fix.')
    return
  }

  let fixed = 0
  let failed = 0

  for (const attachment of work.work_attachments) {
    const fix = analyzeFix(attachment)

    if (fix) {
      console.log(`\n📎 ${fix.fileName}`)
      console.log(`   Current: file_type="${fix.currentFileType}", mime_type="${fix.currentMimeType}"`)
      console.log(`   Proposed: file_type="${fix.newFileType || fix.currentFileType}", mime_type="${fix.newMimeType || fix.currentMimeType}"`)
      console.log(`   Reason: ${fix.reason}`)

      const success = await applyFix(fix)
      if (success) {
        console.log(`   ✅ ${isDryRun ? 'Would be fixed' : 'Fixed'}`)
        fixed++
      } else {
        console.log(`   ❌ Failed`)
        failed++
      }
    } else {
      console.log(`✅ ${attachment.file_name} - No fix needed`)
    }
  }

  console.log('')
  console.log('─'.repeat(80))
  console.log(`Summary: ${fixed} fixed, ${failed} failed`)
}

async function fixAllWorks() {
  console.log('\n🔧 Fixing all works with attachments...')
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made')
  }
  console.log('='.repeat(80))

  const { data: works, error } = await supabase
    .from('works')
    .select('id, title_it, work_attachments(count)')
    .gt('work_attachments.count', 0)

  if (error || !works) {
    console.error(`❌ Error fetching works: ${error?.message}`)
    return
  }

  console.log(`\n📚 Found ${works.length} works with attachments`)

  for (const work of works) {
    await fixWork(work.id)
  }
}

// Main execution
const args = process.argv.slice(2).filter((arg) => arg !== '--dry-run')
const workId = args[0]

if (workId) {
  fixWork(workId)
    .then(() => {
      console.log('\n✅ Fix complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error)
      process.exit(1)
    })
} else {
  fixAllWorks()
    .then(() => {
      console.log('\n✅ Fix complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error)
      process.exit(1)
    })
}

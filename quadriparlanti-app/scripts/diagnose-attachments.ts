/**
 * Diagnostic script to check work attachments for issues
 *
 * This script checks all work attachments in the database and reports:
 * - Attachments with missing or invalid file_type
 * - Attachments with missing or invalid mime_type
 * - Attachments where file_type doesn't match mime_type
 * - Accessibility of storage URLs
 *
 * Usage:
 * npx tsx scripts/diagnose-attachments.ts [work_id]
 *
 * If work_id is provided, only that work will be checked.
 * Otherwise, all works will be checked.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Attachment {
  id: string
  work_id: string
  file_name: string
  file_type: string
  mime_type: string
  storage_path: string
  uploaded_at: string
}

interface DiagnosticResult {
  attachment: Attachment
  issues: string[]
  warnings: string[]
}

const PDF_MIME_TYPES = ['application/pdf']
const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

function validateAttachment(attachment: Attachment): DiagnosticResult {
  const issues: string[] = []
  const warnings: string[] = []

  // Check file_type
  if (!attachment.file_type) {
    issues.push('Missing file_type')
  } else if (!['pdf', 'image'].includes(attachment.file_type.toLowerCase())) {
    issues.push(`Invalid file_type: "${attachment.file_type}" (expected "pdf" or "image")`)
  }

  // Check mime_type
  if (!attachment.mime_type) {
    issues.push('Missing mime_type')
  } else {
    const validMimeTypes = [...PDF_MIME_TYPES, ...IMAGE_MIME_TYPES]
    if (!validMimeTypes.includes(attachment.mime_type.toLowerCase())) {
      warnings.push(`Unusual mime_type: "${attachment.mime_type}"`)
    }
  }

  // Check consistency between file_type and mime_type
  if (attachment.file_type && attachment.mime_type) {
    const fileTypeLower = attachment.file_type.toLowerCase()
    const mimeTypeLower = attachment.mime_type.toLowerCase()

    if (fileTypeLower === 'pdf' && !mimeTypeLower.includes('pdf')) {
      issues.push(
        `Mismatch: file_type is "pdf" but mime_type is "${attachment.mime_type}"`
      )
    }

    if (fileTypeLower === 'image' && !mimeTypeLower.startsWith('image/')) {
      issues.push(
        `Mismatch: file_type is "image" but mime_type is "${attachment.mime_type}"`
      )
    }
  }

  // Check file extension vs mime_type
  const extension = attachment.file_name.split('.').pop()?.toLowerCase()
  if (extension && attachment.mime_type) {
    const mimeTypeLower = attachment.mime_type.toLowerCase()

    if (extension === 'pdf' && !mimeTypeLower.includes('pdf')) {
      warnings.push(
        `Extension ".pdf" doesn't match mime_type "${attachment.mime_type}"`
      )
    }

    if (
      ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) &&
      !mimeTypeLower.startsWith('image/')
    ) {
      warnings.push(
        `Extension ".${extension}" doesn't match mime_type "${attachment.mime_type}"`
      )
    }
  }

  return { attachment, issues, warnings }
}

async function checkUrlAccessibility(storagePath: string): Promise<boolean> {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/work-attachments/${storagePath}`

  try {
    const response = await fetch(publicUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

async function diagnoseWork(workId: string) {
  console.log(`\n📋 Diagnosing work: ${workId}`)
  console.log('─'.repeat(80))

  // Fetch work with attachments
  const { data: work, error: workError } = await supabase
    .from('works')
    .select('id, title_it, work_attachments(*)')
    .eq('id', workId)
    .single()

  if (workError || !work) {
    console.error(`❌ Error fetching work: ${workError?.message}`)
    return
  }

  console.log(`📄 Work: ${work.title_it}`)
  console.log(`📎 Total attachments: ${work.work_attachments?.length || 0}`)

  if (!work.work_attachments || work.work_attachments.length === 0) {
    console.log('   No attachments found.')
    return
  }

  console.log('')

  let totalIssues = 0
  let totalWarnings = 0

  for (const attachment of work.work_attachments) {
    const result = validateAttachment(attachment)

    if (result.issues.length > 0 || result.warnings.length > 0) {
      console.log(`\n📎 ${attachment.file_name}`)
      console.log(`   ID: ${attachment.id}`)
      console.log(`   Type: ${attachment.file_type} | MIME: ${attachment.mime_type}`)
      console.log(`   Path: ${attachment.storage_path}`)

      if (result.issues.length > 0) {
        console.log(`   ❌ ISSUES:`)
        result.issues.forEach((issue) => console.log(`      • ${issue}`))
        totalIssues += result.issues.length
      }

      if (result.warnings.length > 0) {
        console.log(`   ⚠️  WARNINGS:`)
        result.warnings.forEach((warning) => console.log(`      • ${warning}`))
        totalWarnings += result.warnings.length
      }

      // Check URL accessibility
      console.log(`   🔗 Checking URL accessibility...`)
      const accessible = await checkUrlAccessibility(attachment.storage_path)
      if (accessible) {
        console.log(`      ✅ URL is accessible`)
      } else {
        console.log(`      ❌ URL is NOT accessible`)
        totalIssues++
      }
    } else {
      console.log(`✅ ${attachment.file_name} - OK`)
    }
  }

  console.log('')
  console.log('─'.repeat(80))
  console.log(`Summary: ${totalIssues} issues, ${totalWarnings} warnings`)
}

async function diagnoseAllWorks() {
  console.log('\n🔍 Diagnosing all works with attachments...')
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
    await diagnoseWork(work.id)
  }
}

// Main execution
const workId = process.argv[2]

if (workId) {
  diagnoseWork(workId)
    .then(() => {
      console.log('\n✅ Diagnosis complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Diagnosis failed:', error)
      process.exit(1)
    })
} else {
  diagnoseAllWorks()
    .then(() => {
      console.log('\n✅ Diagnosis complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Diagnosis failed:', error)
      process.exit(1)
    })
}

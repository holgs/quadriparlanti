/**
 * Data fetching utilities for student works
 */

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Get all published works with pagination
 */
export const getWorks = cache(async (options?: {
  page?: number
  limit?: number
  classFilter?: string
  yearFilter?: string
  searchQuery?: string
}) => {
  const supabase = await createClient()
  const page = options?.page || 1
  const limit = options?.limit || 12
  const offset = (page - 1) * limit

  let query = supabase
    .from('works')
    .select('*, work_attachments(count)', { count: 'exact' })
    .eq('status', 'published')

  // Apply filters
  if (options?.classFilter) {
    query = query.eq('class_name', options.classFilter)
  }

  if (options?.yearFilter) {
    query = query.eq('school_year', options.yearFilter)
  }

  if (options?.searchQuery) {
    query = query.textSearch('search_vector', options.searchQuery)
  }

  const { data: works, error, count } = await query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching works:', error)
    return { works: [], total: 0, pages: 0 }
  }

  return {
    works: works || [],
    total: count || 0,
    pages: Math.ceil((count || 0) / limit),
  }
})

/**
 * Get recent works for homepage
 */
export const getRecentWorks = cache(async (limit: number = 6) => {
  const supabase = await createClient()

  const { data: works, error } = await supabase
    .from('works')
    .select(`
      id,
      title_it,
      title_en,
      class_name,
      school_year,
      published_at,
      work_attachments (
        id,
        storage_path,
        file_type,
        thumbnail_path
      ),
      work_themes!inner (
        themes (
          title_it,
          slug,
          featured_image_url
        )
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent works:', error)
    return []
  }

  return works || []
})

/**
 * Get a single work by ID with all attachments and links
 */
export const getWorkById = cache(async (id: string) => {
  const supabase = await createClient()

  // Get work details
  const { data: work, error: workError } = await supabase
    .from('works')
    .select(`
      *,
      work_attachments (*),
      work_links (*),
      work_themes (
        themes (
          id,
          slug,
          title_it,
          title_en
        )
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (workError || !work) {
    console.error('Error fetching work:', workError)
    return null
  }

  // Increment view count (async, don't wait)
  supabase
    .from('works')
    .update({ view_count: (work.view_count || 0) + 1 })
    .eq('id', id)
    .then()

  return work
})

/**
 * Get works by teacher for dashboard
 */
export const getWorksByTeacher = cache(async (teacherId: string) => {
  const supabase = await createClient()

  const { data: works, error } = await supabase
    .from('works')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teacher works:', error)
    return []
  }

  return works || []
})

/**
 * Get works pending review for admin
 */
export const getPendingWorks = cache(async () => {
  const supabase = await createClient()

  const { data: works, error } = await supabase
    .from('works')
    .select(`
      *,
      work_attachments (*),
      work_links (*),
      work_themes (
        themes (
          id,
          slug,
          title_it,
          title_en
        )
      ),
      work_reviews (
        id,
        action,
        comments,
        reviewed_at
      )
    `)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending works:', error)
    return []
  }

  return works || []
})

/**
 * Search works with full-text search
 */
export const searchWorks = cache(async (query: string, limit: number = 20) => {
  const supabase = await createClient()

  const { data: works, error } = await supabase
    .from('works')
    .select('id, title_it, title_en, class_name, school_year')
    .eq('status', 'published')
    .textSearch('search_vector', query)
    .limit(limit)

  if (error) {
    console.error('Error searching works:', error)
    return []
  }

  return works || []
})

/**
 * Get a single work by ID for editing (no status filter)
 * Used by teachers to edit their own works
 */
export const getWorkByIdForEdit = cache(async (id: string, userId: string) => {
  const supabase = await createClient()

  // Get work details with all relations
  const { data: work, error: workError } = await supabase
    .from('works')
    .select(`
      *,
      work_attachments (*),
      work_links (*),
      work_themes (
        theme_id
      )
    `)
    .eq('id', id)
    .single()

  if (workError || !work) {
    console.error('Error fetching work for edit:', workError)
    return null
  }

  // Verify ownership (teachers can only edit their own works)
  if (work.created_by !== userId) {
    console.error('User does not own this work')
    return null
  }

  // Extract theme IDs from work_themes relation
  const theme_ids = work.work_themes?.map((wt: any) => wt.theme_id) || []

  return {
    ...work,
    theme_ids,
  }
})

/**
 * Get a single work by ID for preview (no status filter, no view count increment)
 * Used by teachers (own works) and admins (all works) to preview before publishing
 */
export const getWorkByIdForPreview = cache(async (id: string, userId: string, userRole: string) => {
  const supabase = await createClient()

  // Get work details with all relations
  const { data: work, error: workError } = await supabase
    .from('works')
    .select(`
      *,
      work_attachments (*),
      work_links (*),
      work_themes (
        themes (
          id,
          slug,
          title_it,
          title_en
        )
      )
    `)
    .eq('id', id)
    .single()

  if (workError || !work) {
    console.error('Error fetching work for preview:', workError)
    return null
  }

  // Authorization check:
  // - Admins can preview any work
  // - Teachers can only preview their own works
  if (userRole !== 'admin' && work.created_by !== userId) {
    console.error('User not authorized to preview this work')
    return null
  }

  // Do NOT increment view_count for preview

  return work
})

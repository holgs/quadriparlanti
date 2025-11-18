/**
 * Data fetching utilities for themes
 * All functions use server-side Supabase client for security
 */

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Get all published themes with work counts
 * Cached for performance
 */
export const getThemes = cache(async () => {
  const supabase = await createClient()

  const { data: themes, error } = await supabase
    .from('themes')
    .select(`
      id,
      slug,
      title_it,
      title_en,
      description_it,
      description_en,
      featured_image_url,
      status,
      display_order,
      created_at
    `)
    .eq('status', 'published')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching themes:', error)
    return []
  }

  // Get work counts for each theme
  const themesWithCounts = await Promise.all(
    (themes || []).map(async (theme) => {
      const { count } = await supabase
        .from('work_themes')
        .select('*', { count: 'exact', head: true })
        .eq('theme_id', theme.id)

      return {
        ...theme,
        worksCount: count || 0,
      }
    })
  )

  return themesWithCounts
})

/**
 * Get a single theme by slug with all associated works
 */
export const getThemeBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  // Get theme
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (themeError || !theme) {
    console.error('Error fetching theme:', themeError)
    return null
  }

  // Get associated works
  const { data: workThemes, error: worksError } = await supabase
    .from('work_themes')
    .select(`
      work_id,
      works!inner (
        id,
        title_it,
        title_en,
        description_it,
        description_en,
        class_name,
        school_year,
        teacher_name,
        status,
        published_at,
        view_count,
        work_attachments (
          id,
          storage_path,
          file_type,
          thumbnail_path
        )
      )
    `)
    .eq('theme_id', theme.id)
    .eq('works.status', 'published')
    .order('works.published_at', { ascending: false })

  if (worksError) {
    console.error('Error fetching works:', worksError)
    return { ...theme, works: [] }
  }

  const works = (workThemes || []).map((wt: any) => wt.works).filter(Boolean)

  return {
    ...theme,
    works,
  }
})

/**
 * Get featured themes for homepage
 */
export const getFeaturedThemes = cache(async (limit: number = 6) => {
  const supabase = await createClient()

  const { data: themes, error } = await supabase
    .from('themes')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured themes:', error)
    return []
  }

  return themes || []
})

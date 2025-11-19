-- Script di debug per verificare allegati e policy RLS
-- Esegui questo nel SQL Editor di Supabase

-- 1. Verifica configurazione bucket storage
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'work-attachments';

-- 2. Verifica policy RLS sulla tabella work_attachments
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'work_attachments'
ORDER BY policyname;

-- 3. Verifica se ci sono allegati nel database
SELECT
  wa.id,
  wa.work_id,
  wa.file_name,
  wa.file_type,
  wa.storage_path,
  wa.uploaded_by,
  w.status as work_status,
  w.title_it as work_title,
  w.created_by as work_creator
FROM work_attachments wa
JOIN works w ON wa.work_id = w.id
ORDER BY wa.created_at DESC
LIMIT 10;

-- 4. Verifica policy storage per il bucket
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%work%'
ORDER BY policyname;

-- 5. Verifica se RLS è abilitato
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'work_attachments';

-- 6. Conta allegati per stato del lavoro
SELECT
  w.status,
  COUNT(wa.id) as num_attachments
FROM works w
LEFT JOIN work_attachments wa ON w.id = wa.work_id
GROUP BY w.status
ORDER BY w.status;

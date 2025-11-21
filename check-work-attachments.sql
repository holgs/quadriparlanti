-- Check work and attachments for the specific work
SELECT 
  w.id as work_id,
  w.title_it,
  w.status,
  w.created_by as work_created_by,
  COUNT(wa.id) as attachment_count
FROM works w
LEFT JOIN work_attachments wa ON wa.work_id = w.id
WHERE w.id = '12e88a3e-60f2-4001-bd0c-1bc8321c32f1'
GROUP BY w.id, w.title_it, w.status, w.created_by;

-- Check attachments details
SELECT 
  wa.id,
  wa.work_id,
  wa.file_name,
  wa.storage_path,
  wa.uploaded_by,
  wa.created_at
FROM work_attachments wa
WHERE wa.work_id = '12e88a3e-60f2-4001-bd0c-1bc8321c32f1';

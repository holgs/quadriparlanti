# Fix Allegati Non Visibili - Guida Completa

## Problema
Gli allegati (immagini e PDF) non sono visibili né all'admin in pending review né al pubblico dopo la pubblicazione.

## Causa
Policy RLS (Row Level Security) duplicate e conflittuali su:
1. Tabella `work_attachments` (database)
2. Bucket `work-attachments` (storage)

## Soluzione - Applica queste migrazioni IN ORDINE

### Step 1: Fix policy tabella work_attachments
**File:** `20251118000002_fix_work_attachments_rls_v2.sql`

Apri Supabase Dashboard → SQL Editor ed esegui:
```sql
-- Contenuto del file 20251118000002_fix_work_attachments_rls_v2.sql
```

**Cosa fa:**
- Rimuove tutte le policy SELECT esistenti sulla tabella `work_attachments`
- Crea policy pulite per:
  - ✅ Pubblico: vede allegati di lavori published
  - ✅ Admin: vede TUTTI gli allegati
  - ✅ Teacher: vede allegati dei propri lavori

### Step 2: Fix policy bucket storage
**File:** `20251118000003_fix_storage_policies_duplicates.sql`

Apri Supabase Dashboard → SQL Editor ed esegui:
```sql
-- Contenuto del file 20251118000003_fix_storage_policies_duplicates.sql
```

**Cosa fa:**
- Rimuove tutte le policy storage duplicate
- Crea policy pulite per accesso pubblico al bucket
- Verifica che il bucket sia `public = true`

### Step 3: Debug - Verifica che funzioni
**File:** `debug_attachments.sql`

Esegui nel SQL Editor per verificare:
```sql
-- Contenuto del file debug_attachments.sql
```

**Output atteso:**
- Bucket `work-attachments` con `public = true`
- Policy RLS pulite senza duplicati
- Allegati presenti nel database collegati ai lavori

## Debug nel codice (opzionale)

### Aggiungi componente di debug alle pagine

**File:** `components/debug/attachments-debug.tsx`

1. In `app/[locale]/preview/works/[id]/page.tsx`:
```tsx
import { AttachmentsDebug } from '@/components/debug/attachments-debug'

// Alla fine del render, prima di </main>
<AttachmentsDebug workId={work.id} attachments={work.work_attachments} />
```

2. In `app/[locale]/works/[id]/page.tsx`:
```tsx
import { AttachmentsDebug } from '@/components/debug/attachments-debug'

// Alla fine del render, prima di </main>
<AttachmentsDebug workId={work.id} attachments={work.work_attachments} />
```

Questo mostrerà un box giallo in basso a destra con:
- Numero di allegati trovati
- Path storage di ogni allegato
- Link diretto per testare l'accesso

## Checklist finale

- [ ] Migrazione 20251118000002 applicata (policy tabella)
- [ ] Migrazione 20251118000003 applicata (policy storage)
- [ ] Script debug eseguito e verificato
- [ ] Bucket `work-attachments` è `public = true`
- [ ] Policy senza duplicati
- [ ] Allegati visibili in anteprima teacher
- [ ] Allegati visibili in anteprima admin
- [ ] Allegati visibili in pagina pubblica

## Test completo

1. Come teacher:
   - Crea nuovo lavoro
   - Carica 2-3 immagini e 1 PDF
   - Vai su anteprima → allegati visibili? ✓
   - Invia in revisione

2. Come admin:
   - Vai su Review Queue
   - Apri l'anteprima del lavoro
   - Allegati visibili? ✓
   - Approva il lavoro

3. Come pubblico (logout):
   - Vai alla pagina del lavoro pubblicato
   - Allegati visibili? ✓
   - Lightbox funziona? ✓
   - Download funziona? ✓

## Problemi comuni

### "Policy already exists"
→ Usa `DROP POLICY IF EXISTS` nelle migrazioni

### "Permission denied for bucket work-attachments"
→ Verifica che bucket.public = true
→ Verifica policy storage con `TO public`

### "Row Level Security violated"
→ Verifica policy tabella work_attachments
→ Admin deve avere accesso con `users.role = 'admin'`

### Allegati non caricati nel database
→ Verifica console browser per errori
→ Verifica che `createWork()` riceva il parametro `attachments`
→ Verifica log server: `[createWork] Inserting X attachments`

## Query utili

```sql
-- Vedi tutti gli allegati
SELECT * FROM work_attachments ORDER BY created_at DESC LIMIT 10;

-- Vedi policy tabella
SELECT * FROM pg_policies WHERE tablename = 'work_attachments';

-- Vedi policy storage
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Verifica bucket
SELECT * FROM storage.buckets WHERE id = 'work-attachments';
```

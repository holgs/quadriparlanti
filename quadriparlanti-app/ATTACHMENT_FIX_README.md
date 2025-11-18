# Fix: Allegati Non Visibili nei Lavori Pubblicati

## 🔍 Problema

Gli allegati dei lavori (works) non sono visibili quando il work viene pubblicato:

- ✅ **Preview docente (draft)**: Allegati visibili
- ❌ **Preview admin (pending_review)**: Allegati NON visibili
- ❌ **Pagina pubblica (published)**: Allegati NON visibili

### Dati di Debug

**Work in Draft** (ID: `0de03589-9c82-4922-a23b-bdae94ec6dae`):
```json
{
  "status": "draft",
  "work_attachments": [
    {
      "id": "105718cf-e8f5-440d-a577-bbcaa3bdd9a3",
      "file_name": "AgendaRecuperiDocenti.png",
      "storage_path": "12e88a3e.../draft/1763468710164_AgendaRecuperiDocenti.png"
    },
    {
      "id": "c0a68315-f2fa-46e4-87c5-e4848532b1e5",
      "file_name": "Logo Piaggia sfondo bianco 300.jpg",
      "storage_path": "12e88a3e.../draft/1763468714421_Logo_Piaggia_sfondo_bianco_300.jpg"
    }
  ]
}
```

**Work Pubblicato** (ID: `982fb702-2331-40cb-b1a9-7becdfcbbe1b`):
```json
{
  "status": "published",
  "work_attachments": []  // ❌ VUOTO!
}
```

## 🐛 Causa del Problema

Le **Row Level Security (RLS) policies** sulla tabella `work_attachments` sono in conflitto:

### Policy Originali (Problematiche)

1. **"Public can view attachments of published works"**:
   ```sql
   USING (
     EXISTS (
       SELECT 1 FROM works
       WHERE id = work_attachments.work_id
       AND status = 'published'
     )
   )
   ```

2. **"Teachers can view own attachments"**:
   ```sql
   USING (
     uploaded_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
     )
   )
   ```

### Perché il Conflitto?

Quando si esegue una query con JOIN:
```sql
SELECT *
FROM works w
LEFT JOIN work_attachments wa ON wa.work_id = w.id
WHERE w.id = 'xxx'
```

PostgreSQL applica **entrambe** le policy in modo restrittivo, creando una condizione che spesso fallisce, specialmente per gli admin che cercano di vedere works di altri utenti.

## ✅ Soluzione

La migration `20251118000001_fix_work_attachments_rls.sql` risolve il problema sostituendo le policy con versioni più chiare e non conflittuali.

### Nuove Policy

1. **"Public can view published work attachments"**: Il pubblico può vedere gli allegati solo dei works pubblicati
2. **"Authenticated users view work attachments"**: Gli utenti autenticati possono vedere:
   - I propri allegati (uploaded_by = loro ID)
   - Se sono admin: TUTTI gli allegati
   - Se hanno creato il work: gli allegati di quel work

## 🛠️ Come Applicare la Fix

### Opzione 1: Via SQL Editor di Supabase (RACCOMANDATO)

1. Apri [Supabase Dashboard](https://app.supabase.com)
2. Vai su **SQL Editor**
3. Apri il file `FIX_ATTACHMENTS_RLS.sql` da questo progetto
4. Copia e incolla tutto il contenuto nell'editor SQL
5. Clicca **Run** per eseguire
6. Verifica il messaggio di successo nei log

### Opzione 2: Via Supabase CLI (se installato)

```bash
# Assicurati di essere nella directory quadriparlanti-app
cd quadriparlanti-app

# Applica la migration
npx supabase db push

# Oppure applica solo questa migration specifica
npx supabase migration up --db-url "your-database-url"
```

### Opzione 3: Applica Manualmente (Step by Step)

Se preferisci applicare la fix manualmente via SQL Editor:

```sql
-- 1. Rimuovi le vecchie policy
DROP POLICY IF EXISTS "Public can view attachments of published works" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can view own attachments" ON public.work_attachments;

-- 2. Crea la policy per il pubblico
CREATE POLICY "Public can view published work attachments"
ON public.work_attachments FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.works
    WHERE works.id = work_attachments.work_id
    AND works.status = 'published'
  )
);

-- 3. Crea la policy per gli utenti autenticati
CREATE POLICY "Authenticated users view work attachments"
ON public.work_attachments FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.works
    WHERE works.id = work_attachments.work_id
    AND works.created_by = auth.uid()
  )
);
```

## 🧪 Verifica della Fix

Dopo aver applicato la fix, verifica che funzioni:

### 1. Controlla le Policy Attive

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'work_attachments'
ORDER BY policyname;
```

Dovresti vedere:
- ✅ `Authenticated users view work attachments`
- ✅ `Public can view published work attachments`
- ✅ Le vecchie policy NON devono più essere presenti

### 2. Testa con i Tuoi Work

Visita le pagine di debug:
- http://localhost:3000/it/debug/works/0de03589-9c82-4922-a23b-bdae94ec6dae
- http://localhost:3000/it/debug/works/982fb702-2331-40cb-b1a9-7becdfcbbe1b

Entrambi dovrebbero ora mostrare gli allegati correttamente.

### 3. Testa la Pagina Pubblica

Se il work è pubblicato, visita:
- http://localhost:3000/it/works/982fb702-2331-40cb-b1a9-7becdfcbbe1b

Gli allegati dovrebbero essere visibili anche al pubblico.

## 📋 Checklist Post-Fix

- [ ] Migration applicata con successo
- [ ] Vecchie policy rimosse
- [ ] Nuove policy create
- [ ] Work in draft: allegati visibili dal docente
- [ ] Work in pending_review: allegati visibili dall'admin
- [ ] Work pubblicati: allegati visibili dall'admin
- [ ] Work pubblicati: allegati visibili dal pubblico
- [ ] Storage files accessibili pubblicamente

## 🚨 Se il Problema Persiste

Se dopo aver applicato la fix gli allegati non sono ancora visibili:

1. **Verifica che gli allegati esistano nel database**:
   ```sql
   SELECT * FROM work_attachments
   WHERE work_id = '982fb702-2331-40cb-b1a9-7becdfcbbe1b';
   ```

2. **Verifica i file nello storage**:
   - Vai su Supabase Dashboard → Storage → work-attachments
   - Cerca i file nel bucket

3. **Verifica le policy sullo storage**:
   ```sql
   SELECT policyname
   FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
   AND policyname LIKE '%work%';
   ```

4. **Controlla i log di Supabase** per errori RLS o storage

## 📞 Supporto

Se hai bisogno di ulteriore assistenza, fornisci:
- Screenshot delle pagine di debug
- Output delle query di verifica
- Log degli errori (se presenti)
- Nome delle policy attive sulla tabella

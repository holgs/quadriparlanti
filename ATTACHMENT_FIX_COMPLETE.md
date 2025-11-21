# Fix Completa: Allegati Persi nei Lavori

## 🎯 Problema Risolto

Gli allegati dei works venivano **sistematicamente cancellati** durante le operazioni di salvataggio e pubblicazione.

### Sintomi
- ✅ Allegati visibili quando appena caricati
- ❌ Allegati spariti dopo il salvataggio
- ❌ Allegati non visibili in preview admin
- ❌ Allegati non visibili nella pagina pubblica

## 🔍 Analisi Root Cause

Il problema aveva **DUE cause** che si combinavano:

### 1. RLS Policies Conflittuali (FIXATO in commit precedente)

Le policy su `work_attachments` creavano conflitti quando si faceva JOIN con `works`:
- Policy pubblica bloccava gli allegati non-published
- Policy authenticated richiedeva ownership O admin
- Il conflitto impediva la lettura anche agli admin

**Soluzione**: Nuove policy separate e chiare (vedi `FIX_ATTACHMENTS_RLS.sql`)

### 2. Logica di Update Distruttiva ⚠️ **PROBLEMA PRINCIPALE**

#### In `works.actions.ts` - `updateWork()`

**Comportamento Errato** (PRIMA):
```typescript
if (attachments !== undefined) {
  // CANCELLA SEMPRE tutti gli allegati esistenti!
  await supabase.from('work_attachments').delete().eq('work_id', id);

  // Inserisce solo se array non vuoto
  if (attachments.length > 0) {
    // ...insert
  }
}
```

**Il Circolo Vizioso**:
1. Form carica work con RLS bloccato → `work.work_attachments = []`
2. Form inizializza `formData.attachments = []`
3. Utente salva (anche senza modifiche)
4. Form passa `attachmentsData = []` (array vuoto!)
5. `updateWork` vede `[] !== undefined` → **CANCELLA TUTTO**
6. `updateWork` vede `[].length === 0` → **NON INSERISCE NIENTE**
7. **Allegati persi!** 💥

## ✅ Soluzioni Implementate

### 1. Fix `updateWork()` Logic (works.actions.ts)

**Nuovo Comportamento**:
```typescript
// Tre casi distinti:

// CASO 1: Array con allegati → Replace all
if (attachments !== undefined && attachments.length > 0) {
  console.log('[updateWork] Updating attachments...');
  // Delete old + Insert new
}

// CASO 2: Array vuoto esplicito → Remove all (intenzionale)
else if (attachments !== undefined && attachments.length === 0) {
  console.log('[updateWork] Explicitly removing all attachments');
  // Delete all
}

// CASO 3: undefined → Preserve existing
else {
  console.log('[updateWork] Preserving existing attachments');
  // Non toccare il database
}
```

**Chiave**: Distinguere tra:
- `undefined` = "non modificare"
- `[]` = "rimuovi tutti" (intenzionale)
- `[...]` = "sostituisci con questi"

### 2. Fix Edit Form (edit-work-form.tsx)

**Problema**: Il form passava sempre `[]` anche quando non modificato

**Soluzione**:
```typescript
// PRIMA (ERRATO):
const attachmentsData = formData.attachments?.map(...)

// DOPO (CORRETTO):
const attachmentsData = formData.attachments && formData.attachments.length > 0
  ? formData.attachments.map(...)
  : undefined; // ← Chiave: passa undefined se vuoto
```

**Risultato**:
- Se non ci sono allegati → passa `undefined` → updateWork preserva esistenti
- Se ci sono allegati → passa l'array → updateWork li sostituisce

### 3. Logging Completo

Aggiunto logging dettagliato per debug:
- `[createWork]` - Traccia inserimento allegati
- `[updateWork]` - Traccia operazioni su allegati (update/remove/preserve)

## 📝 File Modificati

### 1. `lib/actions/works.actions.ts`
- ✅ `createWork()`: Aggiunto logging
- ✅ `updateWork()`: Logica completamente riscritta per preservare allegati

### 2. `app/[locale]/teacher/works/[id]/components/edit-work-form.tsx`
- ✅ `handleSave()`: Passa `undefined` invece di `[]` quando nessun allegato
- ✅ `handleSubmitForReview()`: Stesso fix (2 occorrenze)

## 🧪 Testing

### Test Case 1: Creazione Nuovo Work con Allegati
```
1. Crea nuovo work
2. Aggiungi 2 allegati
3. Salva bozza
✅ Expected: 2 allegati salvati nel database
✅ Log: "[createWork] Successfully inserted 2 attachments"
```

### Test Case 2: Modifica Work Senza Toccare Allegati
```
1. Apri work esistente con 2 allegati
2. Modifica solo il titolo
3. Salva
✅ Expected: 2 allegati ancora presenti
✅ Log: "[updateWork] Preserving existing attachments"
```

### Test Case 3: Submit for Review (cambio status)
```
1. Work draft con 2 allegati
2. Submit for review
✅ Expected: 2 allegati ancora presenti
✅ Log: "[updateWork] Preserving existing attachments"
```

### Test Case 4: Admin Approva (pubblicazione)
```
1. Work pending_review con 2 allegati
2. Admin approva
✅ Expected: 2 allegati ancora presenti, work status = published
✅ Allegati visibili pubblicamente
```

### Test Case 5: Modifica Allegati Esistenti
```
1. Work con 2 allegati
2. Rimuovi 1, aggiungi 1 nuovo
3. Salva
✅ Expected: 2 allegati totali (1 vecchio + 1 nuovo)
✅ Log: "[updateWork] Updating attachments: 2"
```

## 🚀 Come Verificare la Fix

### 1. Check Database
```sql
-- Verifica allegati per work specifico
SELECT
  w.id,
  w.title_it,
  w.status,
  COUNT(wa.id) as attachment_count,
  json_agg(wa.file_name) as file_names
FROM works w
LEFT JOIN work_attachments wa ON wa.work_id = w.id
WHERE w.id = 'your-work-id'
GROUP BY w.id, w.title_it, w.status;
```

### 2. Check Logs
Guarda i log del server durante le operazioni:
```
[createWork] Inserting 2 attachments for work xxx
[createWork] Successfully inserted 2 attachments
[updateWork] Preserving existing attachments for work xxx
[updateWork] Updating attachments for work xxx: {attachmentCount: 2, fileNames: [...]}
```

### 3. Check UI
1. **Teacher Dashboard**: Visualizza count allegati nella lista works
2. **Preview Page**: Verifica che allegati siano visibili
3. **Admin Review**: Verifica che allegati siano visibili
4. **Public Page**: Verifica che allegati published siano accessibili

## 📌 Note Importanti

### Work Già Danneggiati
⚠️ I work che hanno già perso gli allegati **NON possono essere recuperati automaticamente**.
Gli allegati sono stati cancellati dal database e devono essere ri-uploadati manualmente.

Per identificarli:
```sql
-- Trova works senza allegati (possibilmente danneggiati)
SELECT
  w.id,
  w.title_it,
  w.status,
  w.created_at,
  COUNT(wa.id) as attachment_count
FROM works w
LEFT JOIN work_attachments wa ON wa.work_id = w.id
GROUP BY w.id
HAVING COUNT(wa.id) = 0
ORDER BY w.created_at DESC;
```

### Storage Files Orfani
I file potrebbero ancora esistere in Supabase Storage anche se i record sono stati cancellati.
Considera di:
1. Fare audit dello storage bucket `work-attachments`
2. Confrontare con records in `work_attachments`
3. Ricollegare files orfani se possibile

## 🎉 Risultato

Dopo questa fix:
- ✅ Gli allegati NON vengono più cancellati accidentalmente
- ✅ Workflow completo funziona: create → save → submit → publish
- ✅ Allegati visibili in tutti gli stati (draft/pending/published)
- ✅ RLS policies corrette per admin/teacher/public
- ✅ Logging completo per debug futuro

## 🔄 Workflow Completo Verificato

```
1. Docente crea work
   ↓
2. Docente aggiunge 2 allegati
   ↓ [createWork] → INSERT 2 attachments
3. Salva bozza
   ✅ 2 allegati in DB
   ↓
4. Modifica titolo
   ↓ [updateWork] → Preserving existing
5. Salva
   ✅ 2 allegati ancora presenti
   ↓
6. Submit for review
   ↓ [updateWork] → Preserving existing
7. Status = pending_review
   ✅ 2 allegati ancora presenti
   ↓
8. Admin approva
   ↓ [approveWork] → UPDATE status only
9. Status = published
   ✅ 2 allegati ancora presenti
   ✅ Visibili al pubblico
```

---

**Fix completata il**: 2025-11-18
**Branch**: `claude/fix-job-attachments-01AYzoYSHuroAfoE5L66QVpE`

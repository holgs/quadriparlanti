# Piano di Implementazione - Attività Docenti QuadriParlanti

**Data Creazione**: 2025-11-11
**Versione**: 1.0
**Branch**: `claude/review-teacher-features-011CV2VGR6wJvv9tQtrDqPtz`

---

## Indice

1. [Funzionalità Implementate](#funzionalità-implementate)
2. [Funzionalità da Implementare](#funzionalità-da-implementare)
3. [Piano d'Azione Dettagliato](#piano-dazione-dettagliato)
4. [Stime Temporali](#stime-temporali)
5. [Priorità MVP](#priorità-mvp)

---

## Funzionalità Implementate

### ✅ Gestione Docenti (CRUD Completo - Admin)

#### Backend
- **File**: `lib/actions/teachers.actions.ts`
- **Operazioni**:
  - `createTeacher()` - Creazione docenti con invito email
  - `getTeachers()` - Lista paginata con filtri e ricerca
  - `getTeacher()` - Dettagli singolo docente
  - `updateTeacher()` - Modifica profilo docente
  - `deleteTeacher()` - Eliminazione (soft/hard delete)
  - `resendInvitation()` - Reinvio email invito
  - `resetTeacherPassword()` - Reset password
  - `getTeacherStats()` - Statistiche aggregate

#### Frontend
- **Route**: `/admin/teachers`
- **Componenti**:
  - `teachers-page-client.tsx` - Wrapper client-side
  - `teacher-stats-cards.tsx` - Card statistiche
  - `search-filter-bar.tsx` - Ricerca e filtri
  - `pagination.tsx` - Controlli paginazione
  - `teachers-table.tsx` - Tabella docenti
  - `create-teacher-dialog.tsx` - Dialog creazione
  - `edit-teacher-dialog.tsx` - Dialog modifica
  - `delete-teacher-dialog.tsx` - Dialog eliminazione

#### Database
- **Migrazioni**:
  - `20241109000001_add_teacher_profile_fields.sql`
  - `20241109000002_teacher_management_functions.sql`
- **Estensioni tabella `users`**:
  - Campo `bio` (TEXT, max 500 caratteri)
  - Campo `profile_image_url` (TEXT)
  - Campo `updated_at` (TIMESTAMPTZ)
- **Funzioni database**:
  - `get_teacher_statistics()` - Statistiche aggregate
  - `teacher_has_works()` - Verifica opere associate
  - `get_teacher_work_count()` - Conta opere
- **Indici**: 7 indici per ottimizzazione query

---

### ✅ Sistema Lavori - Backend

#### Server Actions
- **File**: `lib/actions/works.actions.ts`
  - `createWork()` - Creazione lavoro (stato: draft)
  - `updateWork()` - Aggiornamento lavoro
  - `deleteWork()` - Eliminazione lavoro

- **File**: `lib/actions/review.actions.ts`
  - `approveWork()` - Approvazione lavoro (draft → published)
  - `rejectWork()` - Rifiuto lavoro (published → needs_revision)

#### Workflow Stati
```
draft → pending_review → published
                ↓
         needs_revision → (modifica docente) → pending_review
```

---

### ✅ Dashboard Docente Base

#### Frontend
- **Route**: `/teacher`
- **Componenti**:
  - Statistiche personali (totale, bozze, in revisione, pubblicati)
  - Lista lavori del docente
  - Link per creare nuovo lavoro
  - Link per modificare lavori esistenti

---

## Funzionalità da Implementare

### Area Docente - Gestione Lavori

#### 1. Pagina Creazione Lavoro (`/teacher/works/new`) - **PRIORITÀ ALTA**

**Descrizione**: Form multi-step per creare un nuovo lavoro

**Funzionalità**:
- Form wizard a 4 step:
  - **Step 1**: Info base (titolo IT/EN, descrizione IT/EN, classe, anno scolastico)
  - **Step 2**: Contenuti (upload file PDF/immagini, link esterni)
  - **Step 3**: Associazione temi
  - **Step 4**: Revisione e conferma
- Salvataggio bozza automatico
- Validazione campi con Zod
- Preview contenuti prima dell'invio
- Pulsanti: "Salva bozza", "Invia a revisione"
- Toast notifications per feedback utente

**File da creare**:
```
app/[locale]/teacher/works/new/
├── page.tsx (Server Component principale)
├── schemas/
│   └── work-form.schemas.ts (Zod validation)
└── components/
    ├── work-form-wizard.tsx (Client wrapper con stato form)
    ├── step-1-basic-info.tsx (Info base)
    ├── step-2-content.tsx (Upload e link)
    ├── step-3-themes.tsx (Selezione temi)
    ├── step-4-review.tsx (Riepilogo)
    └── form-navigation.tsx (Pulsanti next/prev/save)
```

**Validazione Zod**:
```typescript
// Step 1 - Basic Info
const basicInfoSchema = z.object({
  title_it: z.string().min(3).max(200),
  title_en: z.string().min(3).max(200).optional(),
  description_it: z.string().min(10).max(2000),
  description_en: z.string().min(10).max(2000).optional(),
  class_name: z.string().min(2).max(50),
  school_year: z.string().regex(/^\d{4}-\d{4}$/),
});

// Step 2 - Content (gestito separatamente upload/link)

// Step 3 - Themes
const themesSchema = z.object({
  theme_ids: z.array(z.string().uuid()).min(1, "Seleziona almeno un tema"),
});
```

**Traduzioni** (da aggiungere a `messages/it.json` e `messages/en.json`):
```json
{
  "teacher": {
    "works": {
      "new": {
        "title": "Crea Nuovo Lavoro",
        "steps": {
          "basicInfo": "Informazioni Base",
          "content": "Contenuti",
          "themes": "Temi",
          "review": "Revisione"
        },
        "fields": {
          "titleIt": "Titolo (Italiano)",
          "titleEn": "Titolo (Inglese)",
          "descriptionIt": "Descrizione (Italiano)",
          "descriptionEn": "Descrizione (Inglese)",
          "className": "Classe",
          "schoolYear": "Anno Scolastico"
        },
        "buttons": {
          "saveDraft": "Salva Bozza",
          "submitReview": "Invia a Revisione",
          "next": "Avanti",
          "prev": "Indietro"
        }
      }
    }
  }
}
```

---

#### 2. Pagina Modifica Lavoro (`/teacher/works/[id]`) - **PRIORITÀ ALTA**

**Descrizione**: Form di modifica per lavori esistenti

**Funzionalità**:
- Riutilizza componenti da Step 1.1
- Pre-compila form con dati esistenti
- Permette modifica solo se stato = `draft` o `needs_revision`
- Mostra feedback admin se stato = `needs_revision`
- Gestione allegati esistenti (visualizza, elimina)

**File da creare**:
```
app/[locale]/teacher/works/[id]/
├── page.tsx (Server Component)
└── components/
    └── edit-work-form.tsx (Wrapper del form wizard)
```

---

#### 3. Sistema Upload File - **PRIORITÀ ALTA**

**Descrizione**: Componente per upload file a Supabase Storage

**Funzionalità**:
- Drag & drop area (react-dropzone)
- Validazione tipi file: PDF, JPG, PNG, JPEG
- Validazione dimensione max: 10MB
- Preview thumbnail per immagini
- Progress bar durante upload
- Lista file caricati con preview
- Eliminazione file

**File da creare**:
```
components/file-upload/
├── file-dropzone.tsx (Drag & drop component)
├── file-preview.tsx (Preview con thumbnail)
├── file-list.tsx (Lista file caricati)
└── upload-progress.tsx (Progress bar)

app/api/upload/
└── presign/
    └── route.ts (API per presigned URLs)

lib/supabase/
└── storage.ts (Helper functions per Storage)
```

**Configurazione Supabase Storage**:
```sql
-- Bucket per allegati lavori
CREATE BUCKET work_attachments;

-- Policy per upload (solo docenti autenticati)
CREATE POLICY "Teachers can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'work_attachments' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
);

-- Policy per read (pubblico per file pubblicati)
CREATE POLICY "Public can read published attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'work_attachments');
```

---

#### 4. Gestione Link Esterni - **PRIORITÀ MEDIA**

**Descrizione**: Form per inserire link esterni (YouTube, Vimeo, Google Drive)

**Funzionalità**:
- Input URL con validazione
- Supporto piattaforme:
  - YouTube (video embed)
  - Vimeo (video embed)
  - Google Drive (viewer embed)
- Preview embed in iframe
- Lista link con edit/delete
- Validazione URL format

**File da creare**:
```
components/external-links/
├── link-input.tsx (Form input URL)
├── link-preview.tsx (Preview iframe)
├── link-list.tsx (Lista link con azioni)
└── platform-icon.tsx (Icone piattaforme)

lib/utils/
└── url-validators.ts (Validatori URL per piattaforme)
```

**Validazione URL**:
```typescript
// YouTube
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// Vimeo
const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/(\d+)/;

// Google Drive
const driveRegex = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
```

---

#### 5. Sistema Notifiche Email - **PRIORITÀ MEDIA**

**Descrizione**: Invio email automatiche per eventi workflow

**Eventi**:
- Lavoro approvato → Email docente
- Lavoro respinto → Email docente con feedback
- Lavoro inviato a revisione → Email admin

**Template Email**:

**Template 1: Lavoro Approvato**
```
Oggetto: ✅ Il tuo lavoro "{titolo}" è stato approvato

Ciao {nome_docente},

Il tuo lavoro "{titolo}" (Classe: {classe}) è stato approvato e pubblicato!

Ora è visibile pubblicamente:
{link_lavoro}

Grazie per il tuo contributo.

Team QuadriParlanti
```

**Template 2: Lavoro Respinto**
```
Oggetto: 🔄 Il tuo lavoro "{titolo}" necessita revisione

Ciao {nome_docente},

Il tuo lavoro "{titolo}" necessita di alcune modifiche prima della pubblicazione.

Feedback dell'amministratore:
{commento_admin}

Puoi modificare il lavoro qui:
{link_modifica}

Team QuadriParlanti
```

**Implementazione**:
```typescript
// lib/email/send-work-notification.ts
export async function sendWorkApprovedEmail(workId: string) {
  const supabase = createAdminClient();

  // Get work and teacher details
  const { data: work } = await supabase
    .from('works')
    .select('*, users!created_by(name, email)')
    .eq('id', workId)
    .single();

  // Send email via Supabase Auth
  await supabase.auth.admin.sendEmail({
    to: work.users.email,
    template: 'work-approved',
    data: {
      name: work.users.name,
      work_title: work.title_it,
      work_link: `${process.env.NEXT_PUBLIC_SITE_URL}/works/${work.id}`,
    },
  });
}
```

---

### Area Admin - Revisione Lavori

#### 6. Coda Revisione (`/admin/works/pending`) - **PRIORITÀ ALTA**

**Descrizione**: Dashboard per approvare/respingere lavori in attesa

**Funzionalità**:
- Lista lavori con stato `pending_review`
- Card lavoro con:
  - Titolo, descrizione, classe, anno
  - Nome docente
  - Data invio
  - Preview allegati
- Dialog per preview completo lavoro
- Form approvazione (conferma)
- Form rifiuto (con campo feedback obbligatorio)
- Filtri: docente, classe, data
- Statistiche: totale in coda, tempo medio revisione

**File da creare**:
```
app/[locale]/admin/works/pending/
├── page.tsx (Server Component)
└── components/
    ├── pending-works-list.tsx (Lista lavori)
    ├── work-card.tsx (Card singolo lavoro)
    ├── review-dialog.tsx (Dialog approvazione/rifiuto)
    ├── work-preview.tsx (Preview completo)
    ├── approve-form.tsx (Form conferma approvazione)
    ├── reject-form.tsx (Form rifiuto con feedback)
    └── pending-stats.tsx (Statistiche coda)
```

**Server Action da creare**:
```typescript
// lib/actions/review.actions.ts (da estendere)

/**
 * Reject a work
 * Changes status to needs_revision and creates review record
 */
export async function rejectWork(input: {
  work_id: string;
  comments: string;
}) {
  // Validate admin
  // Update work status to 'needs_revision'
  // Create review record with comments
  // Send email to teacher
  // Revalidate paths
}

/**
 * Get pending works for review
 */
export async function getPendingWorks(filters?: {
  teacher_id?: string;
  class_name?: string;
  from_date?: string;
}) {
  // Query works with status='pending_review'
  // Join with users (teacher info)
  // Apply filters
  // Return paginated results
}
```

---

#### 7. Dashboard Admin Works (`/admin/works`) - **PRIORITÀ MEDIA**

**Descrizione**: Gestione completa tutti i lavori (pubblicati, bozze, respinti)

**Funzionalità**:
- Tabella tutti i lavori con:
  - Titolo, classe, docente, stato, data creazione
- Filtri avanzati:
  - Stato (tutti, bozza, in revisione, pubblicato, respinto)
  - Docente (dropdown)
  - Classe (dropdown)
  - Tema (dropdown)
  - Anno scolastico
  - Data creazione (range)
- Ricerca full-text (titolo, descrizione)
- Azioni rapide:
  - Visualizza dettagli
  - Approva (se pending)
  - Respingi (se pending o published)
  - Elimina
- Export CSV
- Statistiche globali:
  - Totale lavori
  - Per stato
  - Per docente
  - Per classe

**File da creare**:
```
app/[locale]/admin/works/
├── page.tsx (Server Component)
└── components/
    ├── works-table.tsx (Tabella lavori)
    ├── works-filters.tsx (Barra filtri)
    ├── works-stats.tsx (Card statistiche)
    ├── work-actions.tsx (Dropdown azioni)
    └── export-csv-button.tsx (Export CSV)
```

---

### Sistema Temi e QR (Completezza)

#### 8. Gestione Temi (`/admin/themes`) - **PRIORITÀ BASSA**

**Descrizione**: CRUD completo per temi e QR codes

**Funzionalità**:
- Lista temi con card visive
- Creazione tema:
  - Titolo IT/EN
  - Descrizione IT/EN
  - Upload immagine tema
  - Slug (auto-generato)
- Modifica tema
- Eliminazione tema (soft delete)
- Generazione QR dinamico per tema
- Download QR (PNG, SVG, PDF)
- Statistiche per tema:
  - Numero lavori associati
  - Scansioni QR
  - Visualizzazioni

---

## Piano d'Azione Dettagliato

### FASE 1: Creazione e Modifica Lavori (Docenti)

**Obiettivo**: Permettere ai docenti di creare e modificare lavori

**Stima**: 16-20 ore

#### Step 1.1: Pagina Creazione Lavoro (8-10 ore)

**Task**:
1. Creare struttura directory `/teacher/works/new`
2. Implementare `page.tsx` (Server Component)
3. Creare schema validazione Zod
4. Implementare `work-form-wizard.tsx` (gestione stato multi-step)
5. Implementare Step 1: `step-1-basic-info.tsx`
6. Implementare Step 2: `step-2-content.tsx` (placeholder per upload)
7. Implementare Step 3: `step-3-themes.tsx`
8. Implementare Step 4: `step-4-review.tsx`
9. Implementare `form-navigation.tsx`
10. Integrare con `createWork` action
11. Aggiungere toast notifications
12. Aggiungere traduzioni IT/EN
13. Testing form completo

**Checklist**:
- [ ] Struttura directory creata
- [ ] Schema Zod validazione
- [ ] Form wizard con stato multi-step
- [ ] Step 1: Info base (titolo, descrizione, classe, anno)
- [ ] Step 3: Selezione temi (multi-select)
- [ ] Step 4: Revisione dati
- [ ] Navigazione prev/next funzionante
- [ ] Salvataggio bozza
- [ ] Invio a revisione
- [ ] Toast success/error
- [ ] Traduzioni IT/EN
- [ ] Responsive mobile
- [ ] Testing completo

---

#### Step 1.2: Sistema Upload File (4-5 ore)

**Task**:
1. Installare dipendenza `react-dropzone`
2. Creare bucket Supabase `work_attachments`
3. Configurare RLS policies per upload
4. Creare API route `/api/upload/presign` per presigned URLs
5. Implementare `file-dropzone.tsx`
6. Implementare `file-preview.tsx`
7. Implementare `file-list.tsx`
8. Implementare `upload-progress.tsx`
9. Creare helper `lib/supabase/storage.ts`
10. Integrare in Step 2 del form
11. Testing upload vari formati
12. Testing validazione dimensioni

**Checklist**:
- [ ] Dipendenza react-dropzone installata
- [ ] Bucket Supabase creato
- [ ] RLS policies configurate
- [ ] API presigned URL funzionante
- [ ] Drag & drop funziona
- [ ] Validazione tipi file (PDF, JPG, PNG)
- [ ] Validazione dimensione max (10MB)
- [ ] Preview immagini
- [ ] Progress bar upload
- [ ] Eliminazione file
- [ ] Testing formati supportati
- [ ] Gestione errori upload

---

#### Step 1.3: Gestione Link Esterni (2-3 ore)

**Task**:
1. Creare `lib/utils/url-validators.ts`
2. Implementare validatori URL (YouTube, Vimeo, Drive)
3. Implementare `link-input.tsx`
4. Implementare `link-preview.tsx` (iframe embed)
5. Implementare `link-list.tsx`
6. Integrare in Step 2 del form
7. Testing vari URL

**Checklist**:
- [ ] Validatori URL creati
- [ ] Input URL con validazione
- [ ] Preview embed YouTube
- [ ] Preview embed Vimeo
- [ ] Preview embed Google Drive
- [ ] Lista link con edit/delete
- [ ] Testing URL validi/invalidi

---

#### Step 1.4: Pagina Modifica Lavoro (2 ore)

**Task**:
1. Creare route `/teacher/works/[id]/page.tsx`
2. Fetch dati lavoro esistente
3. Pre-compilare form wizard
4. Gestire modifica solo se stato permesso
5. Mostrare feedback admin se `needs_revision`
6. Integrare con `updateWork` action
7. Testing modifica completa

**Checklist**:
- [ ] Route creata
- [ ] Fetch dati lavoro
- [ ] Form pre-compilato
- [ ] Controllo stato (draft/needs_revision)
- [ ] Mostra feedback admin
- [ ] Update funzionante
- [ ] Toast notifications
- [ ] Testing modifica

---

### FASE 2: Sistema Revisione Admin

**Obiettivo**: Permettere agli admin di approvare/respingere lavori

**Stima**: 10-12 ore

#### Step 2.1: Coda Revisione (6-7 ore)

**Task**:
1. Creare server action `getPendingWorks`
2. Creare server action `rejectWork`
3. Creare route `/admin/works/pending/page.tsx`
4. Implementare `pending-works-list.tsx`
5. Implementare `work-card.tsx`
6. Implementare `review-dialog.tsx`
7. Implementare `work-preview.tsx`
8. Implementare `approve-form.tsx`
9. Implementare `reject-form.tsx`
10. Implementare `pending-stats.tsx`
11. Aggiungere filtri (docente, classe, data)
12. Testing workflow approvazione
13. Testing workflow rifiuto

**Checklist**:
- [ ] Server actions create
- [ ] Route admin creata
- [ ] Lista lavori pending
- [ ] Card lavoro con info complete
- [ ] Dialog preview lavoro
- [ ] Form approvazione
- [ ] Form rifiuto con feedback
- [ ] Statistiche coda
- [ ] Filtri funzionanti
- [ ] Testing approvazione
- [ ] Testing rifiuto
- [ ] Traduzioni IT/EN

---

#### Step 2.2: Dashboard Admin Works (4-5 ore)

**Task**:
1. Creare server action `getAllWorks` con filtri
2. Creare route `/admin/works/page.tsx`
3. Implementare `works-table.tsx`
4. Implementare `works-filters.tsx`
5. Implementare `works-stats.tsx`
6. Implementare `work-actions.tsx` (dropdown azioni)
7. Implementare `export-csv-button.tsx`
8. Testing filtri avanzati
9. Testing export CSV

**Checklist**:
- [ ] Server action con filtri
- [ ] Route admin creata
- [ ] Tabella lavori completa
- [ ] Filtri avanzati (stato, docente, classe, tema, data)
- [ ] Ricerca full-text
- [ ] Azioni rapide (approva, respingi, elimina)
- [ ] Export CSV
- [ ] Statistiche globali
- [ ] Paginazione
- [ ] Testing completo

---

### FASE 3: Sistema Notifiche

**Obiettivo**: Inviare email automatiche per eventi workflow

**Stima**: 4-6 ore

#### Step 3.1: Email Templates (2-3 ore)

**Task**:
1. Accedere Supabase Dashboard → Authentication → Email Templates
2. Creare template "Lavoro Approvato"
3. Creare template "Lavoro Respinto"
4. Creare template "Lavoro Inviato a Revisione" (per admin)
5. Personalizzare template con variabili
6. Testing invio email manuale

**Checklist**:
- [ ] Template "Lavoro Approvato" configurato
- [ ] Template "Lavoro Respinto" configurato
- [ ] Template "Lavoro Inviato" configurato
- [ ] Variabili template corrette
- [ ] Testing invio email

---

#### Step 3.2: Trigger Email (2-3 ore)

**Task**:
1. Creare helper `lib/email/send-work-notification.ts`
2. Implementare `sendWorkApprovedEmail()`
3. Implementare `sendWorkRejectedEmail()`
4. Implementare `sendWorkSubmittedEmail()` (per admin)
5. Integrare in `approveWork` action
6. Integrare in `rejectWork` action
7. Integrare in `submitWorkForReview` action (da creare)
8. Testing invio email automatico
9. Logging invio email

**Checklist**:
- [ ] Helper email creato
- [ ] Funzione invio approvazione
- [ ] Funzione invio rifiuto
- [ ] Funzione invio submit (admin)
- [ ] Integrazione in actions
- [ ] Testing email automatiche
- [ ] Logging funzionante
- [ ] Gestione errori invio

---

### FASE 4: Testing e Refinement

**Obiettivo**: Testare e ottimizzare l'intero workflow

**Stima**: 6-8 ore

**Task**:
1. Test end-to-end workflow docente:
   - Login docente
   - Crea lavoro (form completo)
   - Upload file
   - Aggiungi link esterni
   - Salva bozza
   - Riprendi bozza
   - Completa e invia a revisione
   - Ricevi email approvazione
   - Verifica lavoro pubblicato
2. Test end-to-end workflow admin:
   - Login admin
   - Visualizza coda revisione
   - Approva lavoro → verifica email docente
   - Respingi lavoro → verifica email con feedback
   - Verifica statistiche aggiornate
3. Test upload file:
   - Upload PDF, JPG, PNG
   - Test dimensioni max (10MB)
   - Test formati non supportati
   - Test eliminazione file
4. Test validazione form:
   - Campi obbligatori
   - Lunghezza min/max
   - Formati URL
5. Test responsive:
   - Mobile (320px, 375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)
6. Test traduzioni:
   - Verifica IT completo
   - Verifica EN completo
7. Fix bug e ottimizzazioni:
   - Performance form (debounce, lazy load)
   - Ottimizzazione query database
   - Cache invalidation
   - Error handling
8. Accessibility:
   - Keyboard navigation
   - Screen reader
   - ARIA labels
   - Focus management

**Checklist**:
- [ ] Workflow docente completo testato
- [ ] Workflow admin completo testato
- [ ] Upload file testato (tutti formati)
- [ ] Validazione form testata
- [ ] Responsive mobile testato
- [ ] Responsive tablet testato
- [ ] Responsive desktop testato
- [ ] Traduzioni IT complete
- [ ] Traduzioni EN complete
- [ ] Performance ottimizzata
- [ ] Bug critici fixati
- [ ] Accessibility verificata
- [ ] Documentazione aggiornata

---

## Stime Temporali

### Totale: 36-46 ore

- **Fase 1** (Docenti - Lavori): 16-20 ore
  - Step 1.1: Pagina creazione lavoro: 8-10 ore
  - Step 1.2: Sistema upload file: 4-5 ore
  - Step 1.3: Gestione link esterni: 2-3 ore
  - Step 1.4: Pagina modifica lavoro: 2 ore

- **Fase 2** (Admin - Revisione): 10-12 ore
  - Step 2.1: Coda revisione: 6-7 ore
  - Step 2.2: Dashboard admin works: 4-5 ore

- **Fase 3** (Notifiche): 4-6 ore
  - Step 3.1: Email templates: 2-3 ore
  - Step 3.2: Trigger email: 2-3 ore

- **Fase 4** (Testing): 6-8 ore

---

## Priorità MVP

Per avere un sistema funzionante minimo (MVP), implementare in ordine:

### Sprint 1: Workflow Base (20-24 ore)
1. ✅ **Step 1.1**: Pagina creazione lavoro (form base, no upload)
2. ✅ **Step 1.2**: Sistema upload file
3. ✅ **Step 2.1**: Coda revisione admin
4. ✅ **Step 3.2**: Email notifiche base

**Risultato**: Workflow completo funzionante:
```
Docente crea lavoro → Admin approva/respinge → Docente riceve notifica → Lavoro pubblicato
```

### Sprint 2: Completamento Funzionalità (12-16 ore)
5. ✅ **Step 1.3**: Gestione link esterni
6. ✅ **Step 1.4**: Pagina modifica lavoro
7. ✅ **Step 2.2**: Dashboard admin works completa
8. ✅ **Step 3.1**: Email templates personalizzati

### Sprint 3: Testing e Ottimizzazione (6-8 ore)
9. ✅ **Fase 4**: Testing completo e refinement

---

## Note Implementative

### Tecnologie Utilizzate
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Forms**: react-hook-form, Zod
- **Upload**: react-dropzone, Supabase Storage
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **i18n**: next-intl

### Pattern Architetturali
- Server Components per data fetching
- Client Components per interattività
- Server Actions per mutations
- Zod per validazione type-safe
- RLS (Row Level Security) per autorizzazione

### Best Practices
- Validazione client-side e server-side
- Error boundaries
- Loading states
- Optimistic updates
- Toast notifications per feedback
- Responsive design mobile-first
- Accessibility (WCAG 2.1 AA)
- i18n per tutte le stringhe UI

---

## Risorse Aggiuntive

### Documentazione Riferimento
- [PRD](../prd.md)
- [Architettura](./architecture-output.md)
- [Teacher Management](./teacher-management-architecture.md)
- [Implementazione Docenti](../quadriparlanti-app/IMPLEMENTAZIONE_COMPLETA_DOCENTI.md)

### API Endpoints
- `createWork`: Crea nuovo lavoro
- `updateWork`: Aggiorna lavoro esistente
- `approveWork`: Approva lavoro (admin)
- `rejectWork`: Respinge lavoro (admin)
- `getPendingWorks`: Lista lavori in revisione
- `getWorksByTeacher`: Lista lavori di un docente

### Database Tables
- `users` - Utenti (docenti, admin)
- `works` - Lavori studenti
- `work_attachments` - Allegati lavori
- `work_external_links` - Link esterni
- `work_themes` - Associazioni lavori-temi
- `work_reviews` - Storico revisioni
- `themes` - Temi espositivi

---

**Stato**: 🚧 In Implementazione
**Ultima Modifica**: 2025-11-11
**Responsabile**: Claude Code Agent

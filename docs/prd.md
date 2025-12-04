# PRD – Repository Lavori Studenti con QR e Next.js + Supabase

## Visione
Realizzare una vetrina digitale per i lavori degli studenti della scuola. Ogni opera fisica esposta nei corridoi sarà collegata a un QR code che consente ai visitatori – interni ed esterni – di accedere a contenuti digitali prodotti dagli studenti e caricati dai docenti. L’applicazione funge da archivio, museo digitale e strumento di valorizzazione didattica, multilingue e accessibile.

## Obiettivi
- Rendere fruibili i lavori degli studenti tramite QR code dinamici.
- Consentire ai docenti di caricare, descrivere e pubblicare i lavori con flusso di approvazione.
- Offrire una consultazione pubblica per visitatori interni/esterni.
- Garantire accessibilità, privacy (nessun dato sensibile degli studenti) e multilingua.
- Conservare e valorizzare contenuti didattici in modo duraturo.

## Stakeholder
- **Docenti**: creano e propongono lavori → approvazione richiesta.
- **Amministratori**: gestiscono contenuti, approvano lavori, creano QR.
- **Visitatori/Studenti**: accedono e visualizzano lavori tramite QR o navigazione web.

## Flusso Utente Principale

### Visitatori
1. Scansionano QR affisso presso un’opera fisica nei corridoi.
2. Vengono reindirizzati alla pagina del tema/immagine corrispondente.
3. Visualizzano:
   - titolo e descrizione dell’immagine/opera fisica
   - elenco lavori associati
4. Possono filtrare lavori per:
   - classe
   - docente
   - anno scolastico
   - tipologia contenuto
5. Selezionano un lavoro → accedono alla pagina dettagli.
6. Consultano contenuti (video, PDF, presentazioni, immagini, link esterni).

### Docenti
1. Accedono all’area riservata (password).
2. Creano un nuovo lavoro:
   - inseriscono titolo, descrizione, classe, docente, anno, eventuali tag e licenza.
   - caricano file PDF/immagini o inseriscono link (Drive, Vimeo, YouTube, etc.)
   - associano lavoro ad una o più immagini/temi.
3. Inoltrano a revisione.
4. Ricevono notifiche email quando pubblicato.

### Amministratori
1. Accedono alla dashboard admin.
2. Revisione lavori:
   - approvano/pubblicano o rimandano con commento.
3. Creano e gestiscono immagini/temi del percorso fisico.
4. Generano QR dinamici (short link).
5. Monitorano statistiche:
   - scansioni QR
   - visualizzazioni lavori
   - visite per intervallo temporale

## Funzionalità Chiave
- QR dinamici collegati a contenuti editoriali modificabili senza ristampa.
- Flusso `bozza → revisione → pubblicato`.
- Supporto contenuti multimediali (caricati o linkati).
- Filtri avanzati e ricerca full-text.
- Multilingua (IT/EN).
- Accessibilità WCAG 2.1 AA.
- Tracking visite e scansioni QR (anonimizzato).
- Licenze Creative Commons opzionali per lavori pubblicati.

## Requisiti Funzionali
| Categoria | Requisito |
|---|---|
Contenuti | Caricamento PDF/IMG, link esterni per video/presentazioni |
QR | Generazione, gestione, redirect dinamico |
Workflow | Approvazione lavori docente → admin |
Ricerca | Ricerca testo + filtri (classe, anno, docente, tag) |
Accesso | Pubblico; area riservata docenti/admin |
Lingua | IT + EN |
Notifiche | Email per submit/approval |
Analytics | scansioni QR, visualizzazioni lavori |
Storage | Supabase Storage per file, links Drive supportati |

## Requisiti Non Funzionali
- **Performance**: caricamento rapido mobile-first.
- **Sicurezza**: RLS Supabase, HTTPS, hashing IP, niente DPI studente.
- **Affidabilità**: backup automatico DB + esportazione contenuti.
- **Scalabilità**: architettura serverless, caching lato CDN.

## Architettura Tecnica
- **Frontend**: Next.js (App Router), SSR + ISR, next-intl
- **Backend**: Supabase (Postgres + RLS + Storage + Auth)
- **Auth**: email/password con ruoli `admin` e `docente`
- **DB**: tabelle per temi, lavori, allegati/link, QR, tracking
- **Hosting**: Vercel + Supabase

## Privacy e Compliance
- Nessun nome/volto studente visibile.
- Hash degli IP → no tracciamento personale.
- Rispetto GDPR (nessun dato personale minore raccolto).

## KPI
- Numero lavori pubblicati
- Numero scansioni QR
- Numero visualizzazioni lavori
- Tasso approvazione lavori / tempo medio a pubblicazione

## MVP Scope
- Creazione/approvazione lavori
- Pagina tema + lista lavori
- Pagina dettaglio lavoro
- QR dinamici
- Statistiche minime
- Multilingua
- Accessibilità base

## Future
- PWA offline
- Ruoli per aree tematiche
- Media transcoding locale
- Badge “featured” redazione
- Tassonomia tematica estesa


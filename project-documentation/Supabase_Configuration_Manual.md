# Configurazione Manuale URL Supabase

Se i link di reset password o invito continuano a puntare a `localhost`, è necessario aggiornare le impostazioni direttamente nella dashboard di Supabase. Ecco come fare passo dopo passo.

## 1. Accedi a Supabase
Vai su [supabase.com](https://supabase.com) ed entra nel tuo progetto.

## 2. Vai alle impostazioni di Autenticazione
Nel menu laterale sinistro, clicca sull'icona **Authentication** (di solito un'icona a forma di utenti o lucchetto), poi clicca su **URL Configuration** nel sottomenu.

## 3. Modifica il "Site URL"
Trova il campo **Site URL**.
-   **Valore attuale**: Probabilmente è `http://localhost:3000`
-   **Nuovo valore**: Inserisci l'URL del tuo sito in produzione su Vercel.
    -   Esempio: `https://quadriparlanti.vercel.app`

> **Nota**: Questo è l'URL predefinito usato per i redirect se non ne viene specificato un altro.

## 4. Aggiungi i "Redirect URLs"
Sotto, nella sezione **Redirect URLs**, devi autorizzare gli URL specifici o i pattern per la produzione.
-   Clicca su **Add URL**.
-   Aggiungi: `https://quadriparlanti.vercel.app/**`
    -   I due asterischi `**` alla fine sono importanti: autorizzano qualsiasi pagina del sito (es. `/auth/callback`, `/reset-password`).

Assicurati che **entrambi** (localhost e vercel) siano presenti se vuoi continuare a testare anche in locale:
-   `http://localhost:3000/**`
-   `https://quadriparlanti.vercel.app/**`

## 5. Salva
Clicca sul pulsante **Save** per applicare le modifiche.

---

## Perché serve farlo?
Supabase usa una "whitelist" di URL per sicurezza. Se il codice prova a fare un redirect verso `quadriparlanti.vercel.app` ma Supabase conosce solo `localhost`, per sicurezza potrebbe bloccare la richiesta o usare il `Site URL` di default (che era `localhost`), causando l'errore che hai visto.

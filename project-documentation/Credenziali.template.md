# Credenziali Supabase - Template

Questo file contiene istruzioni su dove trovare le credenziali necessarie per il progetto QuadriParlanti.

## ⚠️ IMPORTANTE: File Sensibili

**NON committare mai le credenziali reali su Git!**

Il file `Credenziali.md` è ignorato da Git (vedi `.gitignore`). Usa questo template per creare la tua copia locale.

---

## 📝 Informazioni da Raccogliere

### 1. Password Database Supabase
- **Dove trovarla**: Dashboard Supabase → Settings → Database → Database Password
- **Quando serve**: Durante la creazione del progetto (annotala subito!)
- **Formato**: Stringa alfanumerica

### 2. Project ID (Project Reference)
- **Dove trovarla**: URL del progetto Supabase → `https://[PROJECT_ID].supabase.co`
- **Oppure**: Dashboard → Settings → General → Reference ID
- **Esempio**: `tdztjlzpnlsaobhnaqcq`

### 3. Anon Public Key
- **Dove trovarla**: Dashboard Supabase → Settings → API → Project API keys → `anon` `public`
- **Uso**: Chiave pubblica per il client-side (safe per frontend)
- **Formato**: JWT token (inizia con `eyJhbGci...`)

### 4. Service Role Key
- **Dove trovarla**: Dashboard Supabase → Settings → API → Project API keys → `service_role` `secret`
- **⚠️ ATTENZIONE**: Chiave privata con privilegi admin - MAI esporre sul frontend!
- **Uso**: Solo server-side, operazioni admin, bypass RLS
- **Formato**: JWT token (inizia con `eyJhbGci...`)

### 5. Personal Access Token (per MCP)
- **Dove trovarla**: Supabase Account Settings (non project settings!) → https://supabase.com/dashboard/account/tokens
- **Uso**: Autenticazione MCP server per Claude Code
- **Formato**: Token (inizia con `sbp_...`)
- **Click**: "Generate new token" → dai un nome (es: "MCP Claude Code") → copia il token

---

## 📋 Struttura File Credenziali.md

Crea un file `Credenziali.md` nella stessa directory con questa struttura:

```markdown
Password supabase ([TUA_EMAIL]) database: [PASSWORD_DATABASE]

Project id: [PROJECT_ID]

Anon public key:
[ANON_KEY_JWT_TOKEN]

Service Role:
[SERVICE_ROLE_KEY_JWT_TOKEN]

Personal Access Token (MCP):
[PERSONAL_ACCESS_TOKEN]
```

---

## 🔧 Configurazione Ambiente

### File `.env.local` (per Next.js app)

Posizione: `/quadriparlanti-app/.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Repository Lavori Studenti"

# Analytics (Optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### File MCP Configuration (per Claude Code)

Posizione: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)

Aggiungi questa sezione sotto `mcpServers`:

```json
"supabase-toolkit": {
  "command": "npx",
  "args": [
    "-y",
    "@smithery/cli@latest",
    "run",
    "@supabase/mcp-server"
  ],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "[PERSONAL_ACCESS_TOKEN]",
    "SUPABASE_PROJECT_REF": "[PROJECT_ID]"
  }
}
```

**Dopo aver modificato il file MCP config, riavvia Claude Desktop/Code!**

---

## ✅ Checklist Setup

- [ ] Password database annotata
- [ ] Project ID copiato
- [ ] Anon Key copiato
- [ ] Service Role Key copiato
- [ ] Personal Access Token generato e copiato
- [ ] File `Credenziali.md` creato localmente (NON committare!)
- [ ] File `.env.local` aggiornato con credenziali reali
- [ ] File MCP config aggiornato con Personal Access Token
- [ ] Claude Desktop riavviato
- [ ] Verificato che `.gitignore` contenga `project-documentation/Credenziali.md`

---

## 🔒 Sicurezza

**Files da NON committare MAI:**
- ❌ `Credenziali.md` (già in .gitignore)
- ❌ `.env.local` (già in .gitignore)
- ❌ `claude_desktop_config.json` (file di sistema, non nel repo)

**Files safe da committare:**
- ✅ `Credenziali.template.md` (questo file - solo istruzioni)
- ✅ `.env.example` (template senza valori reali)

---

## 📚 Risorse Utili

- **Supabase Dashboard**: https://supabase.com/dashboard
- **API Settings**: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api
- **Account Tokens**: https://supabase.com/dashboard/account/tokens
- **Supabase Docs**: https://supabase.com/docs

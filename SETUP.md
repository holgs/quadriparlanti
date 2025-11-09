# Setup Guide - QuadriParlanti

Quick setup guide for developers working on this project.

## 🚀 Quick Start for Claude Code (VSCode)

### 1. Setup Supabase MCP Environment

When working on this project in VSCode with Claude Code, you need to configure Supabase MCP credentials.

**One-time setup:**
```bash
# Copy the template
cp setup-supabase-mcp.sh.template setup-supabase-mcp.sh

# Edit setup-supabase-mcp.sh with your credentials
# (see project-documentation/Credenziali.template.md for where to find them)
```

**Every time you open the project in VSCode:**
```bash
# Run this in the VSCode integrated terminal
source ./setup-supabase-mcp.sh
```

This will export the necessary environment variables for Claude Code MCP to work with Supabase.

### 2. Verify Setup

Check that the environment variables are set:
```bash
echo $SUPABASE_ACCESS_TOKEN
echo $SUPABASE_PROJECT_REF
```

### 3. Alternative: Create an Alias (Optional)

Add this to your `~/.zshrc` or `~/.bashrc`:
```bash
alias setup-supabase='source ~/CODE/QuadriParlanti/setup-supabase-mcp.sh'
```

Then just run:
```bash
setup-supabase
```

---

## 📦 Next.js Application Setup

### Install Dependencies

```bash
cd quadriparlanti-app
npm install
```

### Configure Environment Variables

Copy and configure the environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual Supabase credentials (see `project-documentation/Credenziali.md`).

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup (Supabase)

### Apply Migrations

Once Supabase MCP is configured (step 1 above), you can use Claude Code to apply migrations:

```
Ask Claude Code: "Apply the database migrations to Supabase"
```

Or manually via Supabase Dashboard → SQL Editor:
1. Go to https://supabase.com/dashboard/project/tdztjlzpnlsaobhnaqcq/sql
2. Run each migration file in order from `quadriparlanti-app/supabase/migrations/`

### Seed Database (Optional)

For testing data:
```
Ask Claude Code: "Execute the seed.sql file"
```

Or manually via SQL Editor:
1. Copy contents of `quadriparlanti-app/supabase/seed.sql`
2. Run in Supabase SQL Editor

---

## 🔐 Security Notes

**Never commit these files:**
- ❌ `setup-supabase-mcp.sh` (contains credentials)
- ❌ `project-documentation/Credenziali.md` (contains credentials)
- ❌ `.env.local` (contains credentials)

**Safe to commit:**
- ✅ `setup-supabase-mcp.sh.template` (no credentials)
- ✅ `project-documentation/Credenziali.template.md` (instructions only)
- ✅ `.env.example` (no credentials)

---

## 🔄 Switching Between Projects

If you work on multiple Supabase projects:

1. Create separate setup scripts:
   ```bash
   setup-supabase-mcp-projectA.sh
   setup-supabase-mcp-projectB.sh
   ```

2. Source the appropriate one before working:
   ```bash
   source ./setup-supabase-mcp-projectA.sh
   ```

3. Or create shell aliases for each:
   ```bash
   alias setup-quadriparlanti='source ~/CODE/QuadriParlanti/setup-supabase-mcp.sh'
   alias setup-otherproject='source ~/CODE/OtherProject/setup-supabase-mcp.sh'
   ```

---

## 🛠️ Troubleshooting

### Claude Code MCP Tools Not Working

**Symptom**: Claude Code returns "Unauthorized" when using Supabase tools

**Solution**:
1. Make sure you've run `source ./setup-supabase-mcp.sh` in your current terminal
2. Verify environment variables are set: `echo $SUPABASE_ACCESS_TOKEN`
3. If using a new terminal, run the setup script again
4. Reload VSCode window: `Cmd+Shift+P` → "Reload Window"

### Database Migrations Failing

**Symptom**: Migrations fail with permission errors

**Solution**:
1. Check your Personal Access Token is valid: https://supabase.com/dashboard/account/tokens
2. Verify the token has the correct project permissions
3. Make sure the `SUPABASE_PROJECT_REF` matches your project ID

---

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guidance for Claude Code
- **[PRD](./prd.md)** - Product Requirements
- **[Product Specs](./project-documentation/product-manager-output.md)** - Detailed specifications
- **[Architecture](./project-documentation/architecture-output.md)** - Technical architecture
- **[Credentials Template](./project-documentation/Credenziali.template.md)** - Where to find credentials

---

## ❓ Questions?

Check the main [README.md](./README.md) or the comprehensive documentation in `/project-documentation/`.

-- ============================================================================
-- FIX: Abilita eliminazione docenti
-- ============================================================================
--
-- PROBLEMA: Gli admin non possono eliminare i docenti perché manca la policy
-- DELETE sulla tabella users.
--
-- SOLUZIONE: Aggiungi questa policy per permettere agli admin di eliminare
-- gli utenti dalla tabella users.
--
-- COME APPLICARE:
-- 1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- 2. Copia TUTTO questo file (Cmd+A, Cmd+C)
-- 3. Incolla nel SQL Editor e clicca "Run" (o Cmd+Enter)
-- 4. Verifica il successo - dovresti vedere "Success. No rows returned"
-- 5. Ricarica la pagina /admin/teachers e prova a eliminare un docente
--
-- ============================================================================

-- Aggiungi policy DELETE per gli admin sulla tabella users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (public.is_admin());

-- Aggiungi commento descrittivo
COMMENT ON POLICY "Admins can delete users" ON users
  IS 'Allows admin users to delete any user record';

-- ============================================================================
-- VERIFICA
-- ============================================================================
-- Esegui questa query per verificare che la policy sia stata creata:
--
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'users' AND cmd = 'DELETE';
--
-- Dovresti vedere una riga con policyname = "Admins can delete users"
-- ============================================================================

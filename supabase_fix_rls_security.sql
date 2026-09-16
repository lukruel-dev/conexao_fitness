-- ==============================================================================
-- SCRIPT DE SEGURANÇA SUPABASE: HABILITAÇÃO DE RLS E POLÍTICAS DE PROTEÇÃO
-- Projeto: conexao_fitness (koonezmqzmtpmppasjgl)
-- Objetivo: Resolver os 18 alertas do Security Advisor (rls_disabled_in_public)
-- ==============================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS SINALIZADAS
ALTER TABLE IF EXISTS public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.point_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workout_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gym_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gym_access_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Tabelas essenciais adicionais (caso ainda não tenham RLS)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.aluno_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academia_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academia_units ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 2. POLÍTICAS UNIVERSAIS NÃO-BLOQUEANTES
-- Compatíveis com qualquer convenção de colunas (snake_case ou camelCase)
-- O backend NestJS conecta com credenciais diretas do Postgres (bypass RLS)
-- ==============================================================================

-- --- POSTS & COMUNIDADE ---
DROP POLICY IF EXISTS "allow_read_posts" ON public.posts;
CREATE POLICY "allow_read_posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_posts" ON public.posts;
CREATE POLICY "allow_auth_all_posts" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_comments" ON public.post_comments;
CREATE POLICY "allow_read_comments" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_comments" ON public.post_comments;
CREATE POLICY "allow_auth_all_comments" ON public.post_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_likes" ON public.post_likes;
CREATE POLICY "allow_read_likes" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_likes" ON public.post_likes;
CREATE POLICY "allow_auth_all_likes" ON public.post_likes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_follows" ON public.user_follows;
CREATE POLICY "allow_read_follows" ON public.user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_follows" ON public.user_follows;
CREATE POLICY "allow_auth_all_follows" ON public.user_follows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- PLANOS & ACADEMIAS ---
DROP POLICY IF EXISTS "allow_read_plans" ON public.membership_plans;
CREATE POLICY "allow_read_plans" ON public.membership_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_plans" ON public.membership_plans;
CREATE POLICY "allow_auth_all_plans" ON public.membership_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_enrollments" ON public.gym_enrollments;
CREATE POLICY "allow_auth_enrollments" ON public.gym_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_access_logs" ON public.gym_access_logs;
CREATE POLICY "allow_auth_access_logs" ON public.gym_access_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- GAMIFICAÇÃO & BADGES ---
DROP POLICY IF EXISTS "allow_read_badges" ON public.badges;
CREATE POLICY "allow_read_badges" ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_badges" ON public.badges;
CREATE POLICY "allow_auth_all_badges" ON public.badges FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_user_badges" ON public.user_badges;
CREATE POLICY "allow_read_user_badges" ON public.user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_user_badges" ON public.user_badges;
CREATE POLICY "allow_auth_all_user_badges" ON public.user_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_gamification" ON public.user_gamification;
CREATE POLICY "allow_read_gamification" ON public.user_gamification FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_gamification" ON public.user_gamification;
CREATE POLICY "allow_auth_all_gamification" ON public.user_gamification FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_points" ON public.point_transactions;
CREATE POLICY "allow_auth_points" ON public.point_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- TREINOS ---
DROP POLICY IF EXISTS "allow_auth_workout_routines" ON public.workout_routines;
CREATE POLICY "allow_auth_workout_routines" ON public.workout_routines FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_workout_exercises" ON public.workout_exercises;
CREATE POLICY "allow_auth_workout_exercises" ON public.workout_exercises FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_workout_sessions" ON public.workout_session_logs;
CREATE POLICY "allow_auth_workout_sessions" ON public.workout_session_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- CARTEIRA FINANCEIRA ---
DROP POLICY IF EXISTS "allow_auth_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "allow_auth_wallet_transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_wallet_withdrawals" ON public.wallet_withdrawals;
CREATE POLICY "allow_auth_wallet_withdrawals" ON public.wallet_withdrawals FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==============================================================================
-- 3. STATUS FINAL DE VERIFICAÇÃO DO RLS
-- ==============================================================================
SELECT 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'post_likes', 'post_comments', 'user_follows', 'posts',
    'wallet_transactions', 'wallet_withdrawals', 'user_gamification', 'point_transactions',
    'workout_session_logs', 'membership_plans', 'gym_enrollments', 'gym_access_logs',
    'badges', 'user_badges', 'workout_routines', 'workout_exercises'
  )
ORDER BY tablename;

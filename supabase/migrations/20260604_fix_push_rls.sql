-- Recria policy de push_subscriptions para permitir upsert pelo próprio usuário
DROP POLICY IF EXISTS "push_own" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_own" ON push_subscriptions;
CREATE POLICY "push_own" ON push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

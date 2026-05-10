
-- ═══════════════════════════════════════════════════════
-- 1. CHAT HISTORY PERSISTENCE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'NOVA CONSULTA',
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON public.chat_conversations(user_id, updated_at DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_conversations" ON public.chat_conversations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_conversations" ON public.chat_conversations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_delete_own_conversations" ON public.chat_conversations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  sources jsonb DEFAULT '[]'::jsonb,
  charts jsonb DEFAULT '[]'::jsonb,
  tool_calls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own_messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════
-- 2. RISK & PRICE DATA TRANSPARENCY
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.risk_data
  ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'estimated' CHECK (confidence_level IN ('verified','estimated','unverified')),
  ADD COLUMN IF NOT EXISTS is_ai_estimated boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS citations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS methodology text;

ALTER TABLE public.risk_alerts
  ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'estimated' CHECK (confidence_level IN ('verified','estimated','unverified')),
  ADD COLUMN IF NOT EXISTS is_ai_estimated boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS citations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url text;

ALTER TABLE public.country_risk
  ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'estimated',
  ADD COLUMN IF NOT EXISTS is_ai_estimated boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS citations jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.price_data
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS is_official boolean DEFAULT false;

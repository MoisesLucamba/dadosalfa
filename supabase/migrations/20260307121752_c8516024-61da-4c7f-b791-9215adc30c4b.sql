
-- Create workspace_messages table for group chat
CREATE TABLE public.workspace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  reply_to uuid REFERENCES public.workspace_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create private_messages table for DMs
CREATE TABLE public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- RLS for workspace_messages
CREATE POLICY "Members can view workspace messages"
  ON public.workspace_messages FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can send messages"
  ON public.workspace_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can edit own messages"
  ON public.workspace_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON public.workspace_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR can_manage_workspace(workspace_id, auth.uid()));

-- RLS for private_messages
CREATE POLICY "Users can view own DMs"
  ON public.private_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send DMs"
  ON public.private_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete own DMs"
  ON public.private_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

-- User presence/status tracking table
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_count INTEGER DEFAULT 0,
  total_session_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User activity metrics table
CREATE TABLE public.user_activity_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, workspace_id, action_type, date)
);

-- Email notifications log
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_presence
CREATE POLICY "Users can view all presence data" 
ON public.user_presence FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" 
ON public.user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_activity_metrics
CREATE POLICY "Users can view activity in their workspaces"
ON public.user_activity_metrics FOR SELECT
USING (
  workspace_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = user_activity_metrics.workspace_id 
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own activity"
ON public.user_activity_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for email_notifications (admins only)
CREATE POLICY "Admins can view email notifications"
ON public.email_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "System can insert email notifications"
ON public.email_notifications FOR INSERT
WITH CHECK (true);

-- Update trigger for user_presence
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
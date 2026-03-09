
-- Create storage bucket for workspace file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-files', 'workspace-files', true);

-- Allow authenticated members to upload files to workspace folders
CREATE POLICY "Members can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workspace-files');

-- Allow authenticated users to view workspace files
CREATE POLICY "Members can view workspace files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'workspace-files');

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'workspace-files');

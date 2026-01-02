-- جدول سجل تفصيلي لكل ملف داخل ZIP
CREATE TABLE IF NOT EXISTS public.import_file_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    import_log_id uuid REFERENCES public.import_logs(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    student_id text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- pending, success, failed, skipped
    records_count integer DEFAULT 0,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.import_file_logs ENABLE ROW LEVEL SECURITY;

-- Policies: same as import_logs
CREATE POLICY "Users can view their file logs"
ON public.import_file_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.import_logs il
        WHERE il.id = import_file_logs.import_log_id
        AND (il.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

CREATE POLICY "Service can manage file logs"
ON public.import_file_logs FOR ALL
USING (true);

-- Index for faster queries
CREATE INDEX idx_import_file_logs_import_log_id ON public.import_file_logs(import_log_id);
CREATE INDEX idx_import_file_logs_student_id ON public.import_file_logs(student_id);
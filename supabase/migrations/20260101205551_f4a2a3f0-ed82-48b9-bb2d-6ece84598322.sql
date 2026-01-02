-- Add aggregated import metrics to import_logs so the UI can show "imported" and "duplicates merged"
ALTER TABLE public.import_logs
ADD COLUMN IF NOT EXISTS inserted_records integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS parsed_rows integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duplicates_merged integer NOT NULL DEFAULT 0;

-- Helpful index for admin history sorting/filtering
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON public.import_logs (created_at DESC);

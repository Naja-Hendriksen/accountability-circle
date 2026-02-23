-- Add sort_order column to mini_moves
ALTER TABLE public.mini_moves ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Set initial sort_order based on created_at for existing rows
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY weekly_entry_id ORDER BY created_at) - 1 AS rn
  FROM public.mini_moves
)
UPDATE public.mini_moves SET sort_order = ranked.rn
FROM ranked WHERE public.mini_moves.id = ranked.id;
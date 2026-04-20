-- ============================================================
-- Migration 6: Drop tables_schema and table_rows
-- ============================================================

-- Tables are no longer a separate database concept. They are BlockNote content inside pages.
DROP TABLE IF EXISTS public.table_rows;
DROP TABLE IF EXISTS public.tables_schema;
-- Extensions
create extension if not exists "pgcrypto";   -- gen_random_uuid(), gen_random_bytes()
create extension if not exists "vector";     -- pgvector, for product/knowledge embeddings (RAG)

-- Generic updated_at maintenance, reused by every table below that has the column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

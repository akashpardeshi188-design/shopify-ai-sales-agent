-- PostgREST has no filter syntax for pgvector's `<=>` distance operator, so
-- similarity search is exposed as RPC functions instead. Always called from
-- server code via the service-role client (the storefront widget has no
-- Supabase Auth session at all), so these don't need RLS-aware logic.

create or replace function match_products(
  p_store_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 5
)
returns table (
  product_id uuid,
  title text,
  handle text,
  description text,
  price_min numeric,
  price_max numeric,
  image_url text,
  similarity float
)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.handle,
    p.description,
    p.price_min,
    p.price_max,
    p.image_url,
    1 - (pe.embedding <=> p_query_embedding) as similarity
  from product_embeddings pe
  join products p on p.id = pe.product_id
  where p.store_id = p_store_id
    and p.status = 'active'
  order by pe.embedding <=> p_query_embedding
  limit p_match_count;
$$;

create or replace function match_agent_knowledge(
  p_store_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 3
)
returns table (
  knowledge_id uuid,
  question text,
  answer text,
  similarity float
)
language sql
stable
as $$
  select
    k.id,
    k.question,
    k.answer,
    1 - (k.embedding <=> p_query_embedding) as similarity
  from agent_knowledge k
  where k.store_id = p_store_id
    and k.embedding is not null
  order by k.embedding <=> p_query_embedding
  limit p_match_count;
$$;
